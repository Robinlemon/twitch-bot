module.exports = {
    testEnvironment: 'node',
    preset: 'ts-jest',
    setupFiles: ['dotenv/config'],
    coveragePathIgnorePatterns: ['TriviaBot.ts'],
};
