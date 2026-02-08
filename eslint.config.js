import globals from 'globals'
import tseslint from 'typescript-eslint'
import js from '@eslint/js'

export default [
  { ignores: ['dist/**'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: { globals: globals.browser },
  },
]
