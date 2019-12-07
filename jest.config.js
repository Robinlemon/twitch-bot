module.exports = {
    coverageDirectory: './coverage/',
    preset: 'ts-jest',
    setupFiles: ['dotenv/config', './scripts/setupTests.ts'],
    testEnvironment: 'node',
    testPathIgnorePatterns: ['<rootDir>/build/', '<rootDir>/node_modules/'],
};
