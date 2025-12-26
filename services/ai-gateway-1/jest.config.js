export default {
  displayName: 'ai-gateway',
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.ts', '**/*. test.ts', '**/*. spec.ts'],
  moduleNameMapper: {
    '^@packages/shared-types$': '<rootDir>/../../packages/shared-types/src',
    '^@packages/shared-types/(. *)$': '<rootDir>/../../packages/shared-types/src/$1',
    '^@packages/shared-utils$': '<rootDir>/../../packages/shared-utils/src',
    '^@packages/shared-utils/(.*)$': '<rootDir>/../../packages/shared-utils/src/$1',
  },
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/server. ts',
    '!src/index.ts',
  ],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  testTimeout: 10000,
}