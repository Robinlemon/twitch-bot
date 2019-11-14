module.exports = {
    coverageDirectory: './coverage/',
    preset: 'ts-jest',
    setupFiles: ['dotenv/config'],
    testEnvironment: 'node',
    testPathIgnorePatterns: ['<rootDir>/build/', '<rootDir>/node_modules/'],
};
