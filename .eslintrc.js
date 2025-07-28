module.exports = {
  root: true,
  env: {
    browser: true,  // если проект фронтенд
    node: true,     // если проект на Node.js
    es2021: true
  },
  extends: [
    'eslint:recommended'
  ],
  parserOptions: {
    ecmaVersion: 12,      // или 2021
    sourceType: 'module'
  },
  rules: {

    }
};