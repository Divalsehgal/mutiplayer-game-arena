module.exports = {
  root: true,
  env: { node: true, es2020: true },
  extends: [
    require.resolve('@arena/config/eslint-base.cjs'),
  ],
  ignorePatterns: ['dist', 'coverage', '.eslintrc.cjs', 'node_modules'],
  overrides: [
    {
      // Kept in an override so the base config's test-file exemption still wins.
      files: ['**/*.ts', '**/*.tsx'],
      excludedFiles: require('@arena/config/eslint-base.cjs').overrides[0].files,
      rules: {
        '@typescript-eslint/no-magic-numbers': ['error', {
          ignore: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 15, 24, 36, 50, 60, 100, 120, 160, 200, 201, 204, 300, 400, 401, 403, 404, 409, 429, 500, 1000, 3030, 3600, 5000, 3600000, 86400000],
          ignoreArrayIndexes: true,
          ignoreDefaultValues: true,
          enforceConst: true,
        }],
      },
    },
  ],
};
