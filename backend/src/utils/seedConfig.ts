export interface SeedConfig {
  adminPassword: string;
}

export const getSeedConfig = (environment: NodeJS.ProcessEnv = process.env): SeedConfig => {
  if (environment.NODE_ENV === 'production') {
    throw new Error('Demo data import is disabled in production');
  }

  const adminPassword = environment.SEED_ADMIN_PASSWORD;

  if (!adminPassword) {
    throw new Error('SEED_ADMIN_PASSWORD must be set in the current process environment');
  }

  const legacyDemoPassword = ['password', '123'].join('');
  if (adminPassword === legacyDemoPassword) {
    throw new Error('SEED_ADMIN_PASSWORD must not use the legacy demo password');
  }

  if (adminPassword.length < 12) {
    throw new Error('SEED_ADMIN_PASSWORD must contain at least 12 characters');
  }

  return { adminPassword };
};
