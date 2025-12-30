/**
 * Jest Configuration
 * 
 * - TypeScript support (ts-jest)
 * - Test environment (node)
 * - Coverage reporting
 * - Module aliases
 */

export default {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src', '<rootDir>/__tests__'],
  testMatch: ['**/__tests__/**/*. test.ts', '**/?(*.)+(spec|test).ts'],
  moduleNameMapper: {
    '^@package/(. *)$': '<rootDir>/../../packages/$1',
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/**/index.ts',
    '!src/server.ts',
  ],
  coverageThreshold:  {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  testTimeout: 10000,
};