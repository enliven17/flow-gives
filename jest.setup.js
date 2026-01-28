// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom'

// Polyfill for TextEncoder/TextDecoder (required for @onflow/fcl)
import { TextEncoder, TextDecoder } from 'util';
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Mock fetch for tests
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({}),
    text: () => Promise.resolve(''),
    status: 200,
    statusText: 'OK',
  })
);

// Mock @onflow/fcl to avoid ESM issues in tests
jest.mock('@onflow/fcl', () => ({
  authenticate: jest.fn(),
  unauthenticate: jest.fn(),
  currentUser: {
    subscribe: jest.fn(() => jest.fn()),
    snapshot: jest.fn(),
  },
  query: jest.fn(),
  mutate: jest.fn(),
  tx: jest.fn(),
  config: jest.fn(),
}));
