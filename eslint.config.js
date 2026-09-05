// @ts-check
const eslint = require('@eslint/js');
const { defineConfig } = require('eslint/config');
const tseslint = require('typescript-eslint');
const angular = require('angular-eslint');

module.exports = defineConfig([
  {
    files: ['**/*.ts'],
    extends: [
      eslint.configs.recommended,
      tseslint.configs.recommended,
      tseslint.configs.stylistic,
      angular.configs.tsRecommended,
    ],
    processor: angular.processInlineTemplates,
    rules: {
      '@angular-eslint/directive-selector': [
        'error',
        {
          type: 'attribute',
          prefix: 'app',
          style: 'camelCase',
        },
      ],
      '@angular-eslint/component-selector': [
        'error',
        {
          type: 'element',
          prefix: 'app',
          style: 'kebab-case',
        },
      ],

      // OnPush is the house default; the two change-detection demo panels opt
      // out explicitly with an inline disable comment, which is the point of
      // that module.
      '@angular-eslint/prefer-on-push-component-change-detection': 'error',

      // A leading underscore marks a parameter that exists only to satisfy a
      // signature (pipe transforms, trackBy, guard callbacks).
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrors: 'none' },
      ],

      // Rules that catch the mistakes this application is most likely to make.
      '@typescript-eslint/no-explicit-any': 'error',
      'no-console': ['error', { allow: ['warn', 'error'] }],
      eqeqeq: ['error', 'smart'],
      'prefer-const': 'error',
      'no-var': 'error',
    },
  },
  // -------------------------------------------------------------------------
  // Architectural boundaries. The source is partitioned into three layers and
  // imports may only travel in one direction:
  //
  //     features  ->  shared  ->  core
  //
  // core knows nothing about the UI, shared knows nothing about any feature,
  // and no feature may reach into another feature's internals. Nx enforces the
  // same idea across projects with tags; within one project these rules do it.
  // -------------------------------------------------------------------------
  {
    files: ['src/app/core/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            { group: ['@shared/*', '**/shared/**'], message: 'core must not depend on shared.' },
            { group: ['@features/*', '**/features/**'], message: 'core must not depend on features.' },
          ],
        },
      ],
    },
  },
  {
    files: ['src/app/shared/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@features/*', '**/features/**'],
              message: 'shared must not depend on features.',
            },
          ],
        },
      ],
    },
  },
  {
    // The Express entry point is a Node program: startup logging is expected there.
    files: ['src/server.ts', 'src/main.server.ts'],
    rules: {
      'no-console': 'off',
    },
  },
  {
    files: ['**/*.html'],
    extends: [angular.configs.templateRecommended, angular.configs.templateAccessibility],
    rules: {
      '@angular-eslint/template/prefer-control-flow': 'error',
    },
  },
]);
