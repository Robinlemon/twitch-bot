module.exports = {
    testEnvironment: 'node',
    preset: 'ts-jest',
    setupFiles: ['dotenv/config'],
    coveragePathIgnorePatterns: ['Bot.ts'],
    testPathIgnorePatterns: ['<rootDir>/build/', '<rootDir>/node_modules/'],
};
