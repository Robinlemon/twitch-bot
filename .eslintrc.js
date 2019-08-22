module.exports = {
    parser: '@typescript-eslint/parser',
    parserOptions: {
        ecmaVersion: 2019,
        sourceType: 'module',
    },
    plugins: ['@typescript-eslint', 'jest', 'prettier', 'simple-import-sort'],
    env: {
        node: true,
        es6: true,
    },
    extends: [
        'plugin:@typescript-eslint/recommended',
        'prettier',
        'prettier/@typescript-eslint',
        'plugin:jest/recommended',
        'plugin:import/errors',
        'plugin:import/warnings',
        'plugin:import/typescript',
    ],
    rules: {
        /**
         * Plugins
         */
        'prettier/prettier': 'error',
        'simple-import-sort/sort': 'error',

        /**
         * ESLint
         */
        'quote-props': ['error', 'as-needed'],
        'max-len': [
            'error',
            {
                ignoreComments: true,
                code: 300,
            },
        ],

        /**
         * @typescript-eslint
         */
        '@typescript-eslint/no-unused-vars': [
            'warn',
            {
                argsIgnorePattern: '^_',
                varsIgnorePattern: '^_',
            },
        ],
        '@typescript-eslint/explicit-function-return-type': 'off',
        '@typescript-eslint/interface-name-prefix': 'off',
        '@typescript-eslint/no-parameter-properties': 'off',
        '@typescript-eslint/camelcase': 'off',
        '@typescript-eslint/no-var-requires': 'off',
        '@typescript-eslint/class-name-casing': 'warn',
        '@typescript-eslint/no-namespace': 'off',
        '@typescript-eslint/member-ordering': 'error',
    },
    overrides: [
        {
            files: './__tests__/**/*',
            env: {
                'jest/globals': true,
            },
        },
        {
            files: ['./declarations/**/*', './src/lib/**/*'],
            rules: {
                '@typescript-eslint/no-explicit-any': 'off',
            },
        },
    ],
};
