export default {
  displayName: 'memory-service',
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.ts', '**/*.test.ts', '**/*.spec.ts'],
  moduleNameMapper: {
    '^@package/shared-types$': '<rootDir>/../../packages/shared-types/src',
    '^@package/shared-types/(.*)$': '<rootDir>/../../packages/shared-types/src/$1',
    '^@package/shared-utils$': '<rootDir>/../../packages/shared-utils/src',
    '^@package/shared-utils/(.*)$': '<rootDir>/../../packages/shared-utils/src/$1',
  },
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/server.ts',
    '!src/index.ts',
  ],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  testTimeout: 10000,
}