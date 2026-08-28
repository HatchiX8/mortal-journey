import js from '@eslint/js'
import prettier from 'eslint-config-prettier'
import pluginVue from 'eslint-plugin-vue'
import globals from 'globals'
import tseslint from 'typescript-eslint'
import vueParser from 'vue-eslint-parser'

export default tseslint.config(
  { ignores: ['dist/', 'node_modules/'] },
  js.configs.recommended,
  ...pluginVue.configs['flat/recommended'],
  ...tseslint.configs.recommended,
  {
    files: ['src/**/*.{ts,vue}'],
    languageOptions: {
      globals: globals.browser,
      parser: vueParser,
      parserOptions: { parser: tseslint.parser },
    },
    rules: {
      '@typescript-eslint/consistent-type-imports': ['error', { prefer: 'type-imports' }],
      curly: ['error', 'all'],
      eqeqeq: ['error', 'always'],
      'no-console': 'warn',
      'vue/html-button-has-type': 'error',
      'vue/multi-word-component-names': ['error', { ignores: ['App', 'index'] }],
    },
  },
  prettier,
)
