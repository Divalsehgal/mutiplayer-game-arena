const path = require('path');

// Shared Jest setup for Node workspaces. Each workspace adds its own testMatch and coverage globs.
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  // Test against the shared package's source, so tests don't need it built first.
  moduleNameMapper: { '^@arena/shared$': path.resolve(__dirname, '../shared/src') },
  coverageReporters: ['text-summary', 'lcov'],
};
