import js from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['**/dist/**', '**/coverage/**', '**/node_modules/**'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.ts'],
    rules: {
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      // Twarda spacja zawsze jako escape — literal U+00A0 jest niewidoczny w diffie.
      'no-irregular-whitespace': ['error', { skipStrings: false, skipTemplates: false, skipRegExps: false, skipComments: false }],
    },
  },
);
