import { afterEach, describe, expect, it } from 'vitest';
import { getAllowedOrigins, getJwtSecret, validateEnvironment } from './env';

const originalEnv = { ...process.env };

afterEach(() => {
  process.env = { ...originalEnv };
});

describe('environment configuration', () => {
  it('rejects a production environment without a JWT secret', () => {
    process.env.NODE_ENV = 'production';
    delete process.env.JWT_SECRET;
    process.env.MONGODB_URI = 'mongodb://example.test/unimove';
    process.env.FRONTEND_URL = 'https://unimove.example';

    expect(() => validateEnvironment()).toThrow(/JWT_SECRET/);
  });

  it('rejects short production secrets', () => {
    process.env.NODE_ENV = 'production';
    process.env.JWT_SECRET = 'too-short';

    expect(() => getJwtSecret()).toThrow(/32 characters/);
  });

  it('parses multiple configured frontend origins', () => {
    process.env.FRONTEND_URL = 'https://one.example, https://two.example ';

    expect(getAllowedOrigins()).toEqual([
      'https://one.example',
      'https://two.example'
    ]);
  });
});
