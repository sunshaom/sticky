module.exports = {
  env: {
    browser: true,
    node: true
  },
  extends: ['eslint:recommended', 'prettier'],
  plugins: ['eslint-plugin-prettier'],
  parser: '@typescript-eslint/parser',
  rules: {
    'prettier/prettier': 'error',
    'no-multiple-empty-lines': [1, { max: 2 }]
  }
};
