module.exports = {
  ...require('@arena/config/jest-preset.js'),
  testMatch: ['<rootDir>/src/**/*.test.ts'],
  collectCoverageFrom: ['src/**/*.ts', '!src/**/*.test.ts', '!src/index.ts'],
  coverageThreshold: { global: { lines: 95, branches: 90, functions: 95, statements: 95 } },
};
