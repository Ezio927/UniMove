const isProduction = (): boolean => process.env.NODE_ENV === 'production';

export const getJwtSecret = (): string => {
  const secret = process.env.JWT_SECRET;

  if (secret && (!isProduction() || secret.length >= 32)) {
    return secret;
  }

  if (isProduction()) {
    throw new Error('JWT_SECRET must be configured with at least 32 characters in production');
  }

  return 'development-only-secret-change-me';
};

export const getJwtExpiresIn = (): string => process.env.JWT_EXPIRES_IN || '7d';

export const getAllowedOrigins = (): string[] => {
  const configuredOrigins = process.env.FRONTEND_URL
    ?.split(',')
    .map(origin => origin.trim())
    .filter(Boolean);

  if (configuredOrigins?.length) {
    return configuredOrigins;
  }

  return isProduction()
    ? []
    : ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:3000'];
};

export const validateEnvironment = (): void => {
  getJwtSecret();

  if (isProduction() && !process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI must be configured in production');
  }

  if (isProduction() && getAllowedOrigins().length === 0) {
    throw new Error('FRONTEND_URL must be configured in production');
  }
};
