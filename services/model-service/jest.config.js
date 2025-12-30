/**
 * Jest Configuration for Model Service
 * 
 * - TypeScript support via ts-jest
 * - Node.js environment
 * - Coverage reporting
 * - Module path aliases
 */

export default {
  preset: 'ts-jest',
  testEnvironment: 'node',
  extensionsToTreatAsEsm: ['.ts'],
  globals: {
    'ts-jest': {
      useESM: true,
      tsconfig: {
        esModuleInterop: true,
      },
    },
  },
  moduleNameMapper: {
    '^@package/(.*)$': '<rootDir>/../../packages/$1',
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  roots: ['<rootDir>/src', '<rootDir>/__tests__'],
  testMatch:  [
    '**/__tests__/**/*.test.ts',
    '**/?(*. )(spec|test).ts',
  ],
  collectCoverageFrom: [
    'src/**/*. ts',
    '!src/**/*.d.ts',
    '!src/server.ts',
    '!src/config/index.ts',
    '!src/types/index.ts',
  ],
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
  testTimeout: 10000,
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
};