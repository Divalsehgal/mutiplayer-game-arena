module.exports = {
  root: true,
  env: { browser: true, es2020: true },
  extends: [
    require.resolve('@arena/config/eslint-base.cjs'),
    'plugin:react-hooks/recommended',
  ],
  ignorePatterns: ['dist', 'coverage', '.eslintrc.cjs'],
  plugins: ['react-refresh'],
  rules: {
    'react-refresh/only-export-components': [
      'warn',
      { allowConstantExport: true },
    ],
  },
  overrides: [
    {
      // Kept in an override so the base config's test-file exemption still wins.
      files: ['**/*.ts', '**/*.tsx'],
      excludedFiles: require('@arena/config/eslint-base.cjs').overrides[0].files,
      rules: {
        '@typescript-eslint/no-magic-numbers': ['error', {
          ignore: [-20, -10, -5, -1, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 15, 20, 24, 30, 36, 50, 60, 100, 120, 160, 200, 201, 204, 300, 400, 401, 403, 404, 409, 429, 500, 1000, 3000, 3030, 3600, 5000, 10000, 3600000, 86400000, 0.03, 0.05, 0.1, 0.15, 0.2, 0.3, 0.4],
          ignoreArrayIndexes: true,
          ignoreDefaultValues: true,
          enforceConst: true,
        }],
      },
    },
  ],
};
