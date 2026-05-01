import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

export const requireEnv = (key) => {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }

  return value;
};

const getEnv = (key, fallback = '') => process.env[key] || fallback;

export const env = {
  nodeEnv: getEnv('NODE_ENV', 'development'),
  port: Number(requireEnv('PORT')),
  mongoUri: requireEnv('MONGODB_URI'),
  jwtSecret: requireEnv('JWT_SECRET'),
  jwtExpiresIn: requireEnv('JWT_EXPIRES_IN'),
  corsOrigins: requireEnv('CORS_ORIGINS')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
  bodyLimit: requireEnv('BODY_LIMIT'),
  uploadsDir: path.resolve(process.cwd(), requireEnv('UPLOADS_DIR')),
  vapidPublicKey: getEnv('VAPID_PUBLIC_KEY'),
  vapidPrivateKey: getEnv('VAPID_PRIVATE_KEY'),
  vapidSubject: requireEnv('VAPID_SUBJECT'),
  mongoAdminUri: requireEnv('MONGODB_ADMIN_URI'),
  legacyDatabaseName: requireEnv('LEGACY_DATABASE_NAME'),
  primaryDatabaseName: requireEnv('PRIMARY_DATABASE_NAME'),
};
