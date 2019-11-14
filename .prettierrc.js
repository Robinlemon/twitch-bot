module.exports = {
    /**
     * Include parentheses around a sole arrow function parameter.
     *
     * avoid - Omit parens when possible. Example: `x => x`
     * always - Always include parens. Example: `(x) => x`
     */
    arrowParens: 'avoid',
    bracketSpacing: true,
    endOfLine: 'auto',
    printWidth: 160,
    proseWrap: 'preserve',

    /**
     * Change when properties in objects are quoted.
     *
     * as-needed - Only add quotes around object properties where required.
     * consistent - If at least one property in an object requires quotes, quote all properties.
     * preserve - Respect the input use of quotes in object properties.
     */
    quoteProps: 'as-needed',

    semi: true,
    singleQuote: true,
    tabWidth: 4,
    trailingComma: 'all',
    useTabs: false,
};
