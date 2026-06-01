const tsParser = require('@typescript-eslint/parser');
const tsPlugin = require('@typescript-eslint/eslint-plugin');

module.exports = [
  {
    ignores: [
      'node_modules/**',
      'dist/**',
      'tmp/**',
      '.bmad-sandbox/**',
      '.agent/**',
      'artifacts/**',
      '**/_bmad-output/**',
      '**/_iwish-output/**'
    ]
  },
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parser: tsParser,
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
    },
    rules: {
      ...tsPlugin.configs.recommended.rules,
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': ['warn'],
      '@typescript-eslint/no-explicit-any': 'warn',
      // Enforce Magic Number Rule (Architecture Gate)
      '@typescript-eslint/no-magic-numbers': ['warn', {
        'ignore': [-1, 0, 1, 2, 10, 100, 1000],
        'ignoreArrayIndexes': true,
        'ignoreEnums': true,
        'ignoreNumericLiteralTypes': true,
        'ignoreTypeIndexes': true,
        'ignoreReadonlyClassProperties': true
      }],
      // Prevent Context Leaks (Architecture Gate)
      'no-restricted-globals': [
        'warn',
        { name: 'window', message: 'Use an injected provider or check for SSR/environment boundaries to avoid context leaks.' },
        { name: 'document', message: 'Avoid direct DOM access. Use React refs or injected DOM services.' },
        { name: 'localStorage', message: 'Use an injected Storage service instead of global localStorage.' },
        { name: 'sessionStorage', message: 'Use an injected Storage service instead of global sessionStorage.' }
      ],
    },
  },
];
