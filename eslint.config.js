import js from '@eslint/js'
import globals from 'globals'
import hooks from 'eslint-plugin-react-hooks'
import react from 'eslint-plugin-react'
export default [
  {ignores: ['dist']},
  js.configs.recommended,
  {files: ['api/**/*.js', 'server/**/*.js', 'tests/**/*.{js,mjs}', 'vite.config.js', 'pwa/build.js'], languageOptions: {globals: globals.node}},
  {files: ['**/*.{js,jsx}'], languageOptions: {globals: globals.browser, parserOptions: {ecmaFeatures: {jsx: true}}},
    plugins: {react, 'react-hooks':hooks},
    rules: {'react/jsx-uses-vars':'error', 'react-hooks/rules-of-hooks':'error', 'react-hooks/exhaustive-deps':'warn'}},
]
