module.exports = {
  root: true,
  env: { node: true, es2020: true },
  extends: [require.resolve('@arena/config/eslint-base.cjs')],
  ignorePatterns: ['dist', 'coverage', '*.cjs', '*.js'],
};
