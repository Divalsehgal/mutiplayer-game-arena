module.exports = {
  ...require('@arena/config/jest-preset.js'),
  testMatch: ['**/src/**/*.test.ts', '**/src/**/test.ts'],
  // Measure every source file, not just the ones a test happens to import.
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.test.ts',
    '!src/**/test.ts',
    '!src/models/index.ts', // type re-exports only
  ],
  coverageThreshold: { global: { lines: 95, branches: 90, functions: 95, statements: 95 } },
};
