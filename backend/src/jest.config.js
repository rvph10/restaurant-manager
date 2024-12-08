module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    moduleNameMapper: {
      '^@/(.*)$': '<rootDir>/src/$1'
    },
    testMatch: ['**/*.test.ts', '**/*.spec.ts'],
    setupFilesAfterEnv: ['<rootDir>/jest.setup.ts']
  };