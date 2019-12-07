module.exports = {
    apps: [
        {
            args: ['--color'],
            interpreter: 'node',
            interpreter_args: '-r source-map-support/register',
            name: 'Twitch Chat Bot',
            script: './build/src/index.js',
        },
    ],
};
