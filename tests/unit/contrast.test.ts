import { describe, expect, it } from 'vitest';
import { contrastRatio, WCAG } from '@lib/contrast';
import { colors, textPairs } from '@lib/tokens';

describe('design token contrast (Section 3.1)', () => {
  for (const pair of textPairs) {
    it(`${pair.fg} on ${pair.bg} (${pair.where}) ≥ ${WCAG[pair.level]}:1`, () => {
      const ratio = contrastRatio(colors[pair.fg], colors[pair.bg]);
      expect(ratio, `${pair.fg} on ${pair.bg} is ${ratio.toFixed(2)}:1`).toBeGreaterThanOrEqual(
        WCAG[pair.level],
      );
    });
  }

  it('saffron is never used as text on ivory', () => {
    const bad = textPairs.find((p) => p.fg === 'saffron' && p.bg === 'ivory');
    expect(bad).toBeUndefined();
  });

  it('known reference value: white on black is 21:1', () => {
    expect(contrastRatio('#fff', '#000')).toBeCloseTo(21, 1);
  });
});
