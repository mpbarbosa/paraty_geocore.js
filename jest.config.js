/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['<rootDir>/test/**/*.test.ts', '<rootDir>/test/**/*.benchmark.ts'],
  // Strip .js extensions from TypeScript ESM-style imports (e.g. '../utils/distance.js' → '../utils/distance')
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  cacheDirectory: '.jest-cache',  // persisted across runs; cached in CI for faster startup
  maxWorkers: '50%',              // cap parallelism to leave headroom on CI runners
  collectCoverageFrom: ['src/**/*.ts'],
  coverageThreshold: {
    global: { lines: 80, branches: 80, functions: 80, statements: 80 },
  },
  coverageReporters: ['text', 'lcov'],
};
