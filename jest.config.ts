/* eslint-disable */
export default {
  displayName: 'lambda-edge-openid-auth',
  preset: './jest.preset.js',
  testEnvironment: 'node',
  transform: {
    '^.+\\.[tj]s$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.spec.json' }],
  },
  transformIgnorePatterns: ['!node_modules/'],
  moduleFileExtensions: ['ts', 'js', 'html'],
  coverageDirectory: './coverage/lambda-edge-openid-auth',
  testMatch: [
    '<rootDir>/src/**/__tests__/**/*.[jt]s?(x)',
    '<rootDir>/src/**/*(*.)@(spec|test).[jt]s?(x)',
  ],
};
