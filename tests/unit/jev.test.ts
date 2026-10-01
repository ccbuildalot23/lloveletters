import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  buildJevRequest,
  decide,
  jevConfigured,
  jevRecord,
  jevSummary,
  minimizeState,
  minimizeText,
  parseJevResponse,
  CONTACT_QUESTIONS,
  JEV_ENDPOINT,
  REVIEW_QUESTIONS,
  TRADE_QUESTIONS,
  type JevResult,
} from '../../functions/_lib/jev';

const withKey = { JEV_API_KEY: 'jv_test_key', JEV_MODEL: undefined, JEV_DISABLED: undefined };
const Q = { ...TRADE_QUESTIONS };

function goodBody(overrides: Record<string, unknown> = {}) {
  return {
    model: 'jev-1.13.0',
    answers: {
      lead_fit: { score: 3.6, probabilities: [0.05, 0.1, 0.25, 0.4, 0.2], confidence: 0.71 },
      route: {
        choice: 'review',
        probability: { approve: 0.3, review: 0.6, decline: 0.1 },
        confidence: 0.6,
      },
      ...overrides,
    },
  };
}
const okResponse = (body: unknown) =>
  new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  });

afterEach(() => vi.restoreAllMocks());

describe('configuration and kill switch', () => {
  it('is off without a key or with JEV_DISABLED=true', () => {
    expect(
      jevConfigured({ JEV_API_KEY: undefined, JEV_MODEL: undefined, JEV_DISABLED: undefined }),
    ).toBe(false);
    expect(jevConfigured({ ...withKey, JEV_DISABLED: 'true' })).toBe(false);
    expect(jevConfigured(withKey)).toBe(true);
  });
  it('decide() with no key never calls fetch and returns null', async () => {
    const fetchImpl = vi.fn();
    const r = await decide(
      { JEV_API_KEY: undefined, JEV_MODEL: undefined, JEV_DISABLED: undefined },
      { a: 1 },
      Q,
      { fetchImpl },
    );
    expect(r).toBeNull();
    expect(fetchImpl).not.toHaveBeenCalled();
  });
  it('decide() with a null (unsafe) state never calls fetch', async () => {
    const fetchImpl = vi.fn();
    expect(await decide(withKey, null, Q, { fetchImpl })).toBeNull();
    expect(fetchImpl).not.toHaveBeenCalled();
  });
});

describe('request shape (official contract)', () => {
  it('posts model, state and questions to the official endpoint with a bearer key', () => {
    const { url, init } = buildJevRequest(
      { ...withKey, JEV_MODEL: 'jev-1.13.0' },
      { firm: 'X' },
      Q,
    );
    expect(url).toBe(JEV_ENDPOINT);
    expect(init.method).toBe('POST');
    expect((init.headers as Record<string, string>).authorization).toBe('Bearer jv_test_key');
    const body = JSON.parse(init.body as string);
    expect(body.model).toBe('jev-1.13.0');
    expect(body.state).toEqual({ firm: 'X' });
    expect(Object.keys(body.questions)).toEqual(['lead_fit', 'route']);
    expect(body.questions.lead_fit.type).toBe('score');
  });
  it('defaults the model to jev-latest', () => {
    expect(JSON.parse(buildJevRequest(withKey, {}, Q).init.body as string).model).toBe(
      'jev-latest',
    );
  });
});

describe('response validation', () => {
  it('accepts a valid body with a fractional score and returns typed answers', () => {
    const p = parseJevResponse(goodBody(), Q)!;
    expect(p.model).toBe('jev-1.13.0');
    expect(p.answers.lead_fit).toMatchObject({ type: 'score', score: 3.6 });
    expect(p.answers.route).toMatchObject({ type: 'choice', choice: 'review' });
  });
  it('accepts noul 0 and 1 exactly', () => {
    const p = parseJevResponse(
      { answers: { looks_like_spam: { noul: 0 }, publication_policy_signal: { noul: 1 } } },
      REVIEW_QUESTIONS,
    )!;
    expect(p.answers.looks_like_spam).toEqual({ type: 'noul', noul: 0 });
    expect(p.answers.publication_policy_signal).toEqual({ type: 'noul', noul: 1 });
  });
  it.each([
    ['missing question id', { answers: { lead_fit: goodBody().answers.lead_fit } }],
    [
      'choice outside the enum',
      goodBody({
        route: {
          choice: 'maybe',
          probability: { approve: 1, review: 0, decline: 0 },
          confidence: 1,
        },
      }),
    ],
    [
      'score out of range',
      goodBody({ lead_fit: { score: 6, probabilities: [0, 0, 0, 0, 1], confidence: 1 } }),
    ],
    [
      'score with wrong distribution length',
      goodBody({ lead_fit: { score: 2, probabilities: [1, 0], confidence: 1 } }),
    ],
    [
      'non-finite confidence',
      goodBody({
        route: {
          choice: 'review',
          probability: { approve: 0, review: 1, decline: 0 },
          confidence: Number.NaN,
        },
      }),
    ],
    [
      'probability above 1',
      goodBody({
        route: {
          choice: 'review',
          probability: { approve: 0, review: 1.5, decline: 0 },
          confidence: 0.5,
        },
      }),
    ],
    ['no answers key', { model: 'x' }],
    ['not an object', 'nope'],
  ])('rejects %s', (_label, body) => {
    expect(parseJevResponse(body, Q)).toBeNull();
  });
  it('rejects a noul outside 0..1 and a boolean noul', () => {
    expect(
      parseJevResponse(
        { answers: { looks_like_spam: { noul: 1.2 }, publication_policy_signal: { noul: 0 } } },
        REVIEW_QUESTIONS,
      ),
    ).toBeNull();
    expect(
      parseJevResponse(
        { answers: { looks_like_spam: { noul: true }, publication_policy_signal: { noul: 0 } } },
        REVIEW_QUESTIONS,
      ),
    ).toBeNull();
  });
});

describe('decide() failure modes never throw and never leak state', () => {
  const state = { firm: 'Acme Staging', message: 'secret content' };
  it.each([401, 429, 500])('HTTP %i → null with a sanitized log line', async (status) => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => {});
    const r = await decide(withKey, state, Q, {
      fetchImpl: async () => new Response('x', { status }),
    });
    expect(r).toBeNull();
    const line = log.mock.calls.map((c) => String(c[0])).join('\n');
    expect(line).toContain('"status":"http_error"');
    expect(line).toContain(`"http":${status}`);
    expect(line).not.toContain('secret content');
  });
  it('malformed JSON → null', async () => {
    const r = await decide(withKey, state, Q, {
      fetchImpl: async () => new Response('{not json', { status: 200 }),
    });
    expect(r).toBeNull();
  });
  it('unexpected shape → null', async () => {
    const r = await decide(withKey, state, Q, {
      fetchImpl: async () => okResponse({ answers: {} }),
    });
    expect(r).toBeNull();
  });
  it('network error → null', async () => {
    const r = await decide(withKey, state, Q, {
      fetchImpl: async () => {
        throw new TypeError('fetch failed');
      },
    });
    expect(r).toBeNull();
  });
  it('a stalled response times out via the abort signal → null, timer cleared', async () => {
    vi.useFakeTimers();
    const fetchImpl = (async (_u: string, init?: RequestInit) =>
      new Promise<Response>((_, reject) => {
        init?.signal?.addEventListener('abort', () =>
          reject(new DOMException('aborted', 'AbortError')),
        );
      })) as unknown as typeof fetch;
    const pending = decide(withKey, state, Q, { fetchImpl, timeoutMs: 50 });
    await vi.advanceTimersByTimeAsync(60);
    expect(await pending).toBeNull();
    expect(vi.getTimerCount()).toBe(0);
    vi.useRealTimers();
  });
  it('a stalled body (headers ok, json never resolves) also times out', async () => {
    vi.useFakeTimers();
    const fetchImpl = (async (_u: string, init?: RequestInit) =>
      ({
        ok: true,
        status: 200,
        json: () =>
          new Promise((_, reject) =>
            init?.signal?.addEventListener('abort', () =>
              reject(new DOMException('aborted', 'AbortError')),
            ),
          ),
      }) as unknown as Response) as unknown as typeof fetch;
    const pending = decide(withKey, state, Q, { fetchImpl, timeoutMs: 50 });
    await vi.advanceTimersByTimeAsync(60);
    expect(await pending).toBeNull();
    vi.useRealTimers();
  });
  it('success returns model, rubric and latency, and jevRecord stores no state', async () => {
    const r = await decide(withKey, state, Q, { fetchImpl: async () => okResponse(goodBody()) });
    expect(r?.model).toBe('jev-1.13.0');
    expect(r?.rubric).toBe('v1');
    expect(typeof r?.latencyMs).toBe('number');
    const stored = jevRecord(r)!;
    expect(stored).not.toContain('Acme');
    expect(JSON.parse(stored).answers.route.choice).toBe('review');
    expect(jevRecord(null)).toBeNull();
  });
});

describe('summary and minimization', () => {
  it('jevSummary is a single escaped line per result', () => {
    const r: JevResult = {
      model: 'jev-latest',
      rubric: 'v1',
      latencyMs: 120,
      answers: {
        lead_fit: {
          type: 'score',
          score: 4.2,
          probabilities: [0, 0, 0.2, 0.5, 0.3],
          confidence: 0.8,
        },
        route: {
          type: 'choice',
          choice: 'approve',
          probability: { approve: 0.72, review: 0.2, decline: 0.08 },
          confidence: 0.7,
        },
        looks_like_spam: { type: 'noul', noul: 0.03 },
      },
    };
    const line = jevSummary(r);
    expect(line).toBe(
      'Jev advisory (jev-latest, rubric v1): lead_fit 4.2/5 · route approve (72%) · looks_like_spam 0.03',
    );
    expect(line).not.toMatch(/[<>&"']/);
    expect(jevSummary(null)).toBe('');
  });
  it('minimizeText redacts emails, phones and street addresses and bounds length', () => {
    const t = minimizeText(
      'Call me at (202) 555-0100 or jane@example.com, 1234 Placeholder Ave NW please. ' +
        'x'.repeat(2000),
    )!;
    expect(t).toContain('[phone]');
    expect(t).toContain('[email]');
    expect(t).toContain('[address]');
    expect(t).not.toContain('jane@');
    expect(t.length).toBeLessThanOrEqual(1200);
  });
  it('minimizeText refuses text that names financial or identity documents', () => {
    expect(minimizeText('my social security number is on file')).toBeNull();
    expect(
      minimizeState({ message: 'credit card number 4111 1111 1111 1111' }, ['message']),
    ).toBeNull();
  });
  it('minimizeState keeps only allowlisted fields', () => {
    const s = minimizeState(
      {
        name: 'Jane',
        email: 'j@x.com',
        firm: 'Studio',
        project_types: ['staging'],
        resale_cert_given: true,
      },
      ['firm', 'project_types', 'resale_cert_given'],
    )!;
    expect(Object.keys(s)).toEqual(['firm', 'project_types', 'resale_cert_given']);
  });
});

describe('rubric v1 question sets', () => {
  it('trade: five lead-fit levels and approve/review/decline', () => {
    expect((TRADE_QUESTIONS.lead_fit as { criteria: string[] }).criteria).toHaveLength(5);
    expect(
      Object.keys((TRADE_QUESTIONS.route as { criteria: Record<string, string> }).criteria),
    ).toEqual(['approve', 'review', 'decline']);
  });
  it('contact: seven routes including other_or_unclear', () => {
    expect(
      Object.keys((CONTACT_QUESTIONS.route as { criteria: Record<string, string> }).criteria),
    ).toEqual(['sales', 'shipping', 'returns', 'trade', 'press', 'spam', 'other_or_unclear']);
  });
  it('reviews: two nouls, negative reviews explicitly not spam', () => {
    expect(REVIEW_QUESTIONS.looks_like_spam!.type).toBe('noul');
    expect(REVIEW_QUESTIONS.publication_policy_signal!.type).toBe('noul');
    expect(REVIEW_QUESTIONS.looks_like_spam!.instructions).toMatch(/negative review is not spam/);
  });
});
