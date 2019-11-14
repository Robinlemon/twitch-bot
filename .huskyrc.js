module.exports = {
    hooks: {
        'pre-commit': 'npm run lint:fix && npm test && npm run clean && npm run build',
    },
};
