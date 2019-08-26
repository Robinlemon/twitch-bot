module.exports = {
    testEnvironment: 'node',
    preset: 'ts-jest',
    setupFiles: ['dotenv/config'],
    coveragePathIgnorePatterns: ['TriviaBot.ts'],
    testPathIgnorePatterns: ['<rootDir>/build/', '<rootDir>/node_modules/'],
    testRegex: '/__tests__/.*\\.[jt]sx?$',
};
