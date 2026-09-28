// Lighthouse CI budgets (Section 12). Runs against the built site.
module.exports = {
  ci: {
    collect: {
      staticDistDir: './dist',
      url: [
        'http://localhost/index.html',
        'http://localhost/rugs.html',
        'http://localhost/rugs/sample-vintage-oushak-faded-coral-sage.html',
      ],
      numberOfRuns: 2,
      settings: {
        preset: 'desktop',
        formFactor: 'mobile',
        screenEmulation: {
          mobile: true,
          width: 390,
          height: 844,
          deviceScaleFactor: 3,
          disabled: false,
        },
        throttlingMethod: 'simulate',
        budgetPath: './budget.json',
      },
    },
    assert: {
      assertions: {
        'categories:performance': ['error', { minScore: 0.95 }],
        'categories:accessibility': ['error', { minScore: 1 }],
        'categories:best-practices': ['error', { minScore: 1 }],
        'categories:seo': ['error', { minScore: 1 }],
        'largest-contentful-paint': ['error', { maxNumericValue: 2500 }],
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }],
        'total-blocking-time': ['warn', { maxNumericValue: 200 }],
      },
    },
    upload: { target: 'temporary-public-storage' },
  },
};
