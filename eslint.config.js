import js from '@eslint/js';
import tseslint from 'typescript-eslint';

export default [
  {
    ignores: [
      'node_modules/**',
      '**/dist/**',
      '**/build/**',
      '**/coverage/**',
      '**/cdk.out/**',
      'package-lock.json',
      '.github/**',
      '**/shadcn/*.tsx',
    ],
  },
  {
    files: ['**/*.js', '**/*.mjs', '**/*.cjs'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
    },
    rules: js.configs.recommended.rules,
  },
  ...tseslint.configs.recommended,
  {
    files: ['**/*.ts', '**/*.tsx'],
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
        },
      ],
    },
  },
];
