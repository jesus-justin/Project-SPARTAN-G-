import dotenv from 'dotenv';

dotenv.config();

const required = ['DATABASE_URL', 'JWT_SECRET', 'ALLOWED_ORIGINS'];

for (const key of required) {
  if (!process.env[key] || process.env[key].trim() === '') {
    throw new Error(`Missing required environment variable: ${key}`);
  }
}

const allowedOrigins = process.env.ALLOWED_ORIGINS.split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

if (allowedOrigins.length === 0) {
  throw new Error('ALLOWED_ORIGINS must contain at least one origin');
}

export const env = {
  port: Number(process.env.PORT || 3001),
  nodeEnv: process.env.NODE_ENV || 'development',
  databaseUrl: process.env.DATABASE_URL,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  allowedOrigins,
};
