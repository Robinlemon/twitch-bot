/* eslint-disable sort-keys */
/* eslint-disable sort-keys-fix/sort-keys-fix */
module.exports = {
    env: {
        node: true,
        es2020: true,
    },
    parserOptions: {
        sourceType: 'module',
    },
    extends: [
        /* Base ESLint Config */
        'eslint:recommended',

        /* Lint JSON Files */
        'plugin:json/recommended-with-comments',

        /* Prettier Integration */
        'prettier',
        'plugin:prettier/recommended',
    ],
    plugins: ['@typescript-eslint', 'simple-import-sort', 'json', 'markdown', 'optimize-regex', 'sort-keys-fix', 'prettier'],
    rules: {
        /* Object Formatting */
        'object-shorthand': ['error', 'always', { avoidQuotes: true }],
        'sort-keys': ['error', 'asc', { caseSensitive: true, natural: false, minKeys: 2 }],
        'sort-keys-fix/sort-keys-fix': 'error',

        /* JSON */
        'json/*': 'error',

        /* Regular Expressions */
        'optimize-regex/optimize-regex': 'error',

        /* Sorting */
        'simple-import-sort/sort': 'error',
    },
    globals: { Atomics: 'readonly', SharedArrayBuffer: 'readonly' },
    overrides: [
        {
            files: ['*.ts'],
            parser: '@typescript-eslint/parser',
            parserOptions: {
                project: './tsconfig.json',
                sourceType: 'module',
            },
            plugins: ['@typescript-eslint'],
            extends: [
                /* TypeScript ESLint */
                'plugin:@typescript-eslint/recommended',
                'plugin:@typescript-eslint/eslint-recommended',
                'plugin:@typescript-eslint/recommended-requiring-type-checking',

                /* Import */
                'plugin:import/errors',
                'plugin:import/warnings',
                'plugin:import/typescript',
            ],
            rules: {
                /* TypeScript Linting */
                '@typescript-eslint/member-ordering': 'error',
                '@typescript-eslint/interface-name-prefix': 'off',
                '@typescript-eslint/no-non-null-assertion': 'off',
                '@typescript-eslint/camelcase': 'off',

                /**
                 * Extra Type Linting
                 */
                '@typescript-eslint/no-misused-promises': 'off',
            },
            overrides: [
                {
                    files: ['**/__tests__/**/*', '**/*.{spec,test}.ts'],
                    env: {
                        'jest/globals': true,
                    },
                    extends: [
                        /* Jest */
                        'plugin:jest/recommended',
                    ],
                },
            ],
        },
    ],
};
