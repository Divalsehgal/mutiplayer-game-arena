module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/src/**/*.test.ts', '**/src/**/test.ts'],
  // Measure every source file, not just the ones a test happens to import.
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.test.ts',
    '!src/**/test.ts',
    '!src/models/index.ts', // type re-exports only
  ],
};
