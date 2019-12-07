module.exports = {
    hooks: {
        'pre-commit': 'yarn lint:fix && yarn test && yarn build',
    },
};
