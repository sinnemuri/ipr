require('dotenv').config();

function required(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Отсутствует обязательная переменная окружения: ${name}`);
  }
  return value;
}

const clientUrl = process.env.CLIENT_URL || '';

const env = {
  port: Number(process.env.PORT) || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  isProd: process.env.NODE_ENV === 'production',
  sentryDsn: process.env.SENTRY_DSN || '',
  logtailToken: process.env.LOGTAIL_TOKEN || '',
  clientUrl,
  databaseUrl: required('DATABASE_URL'),
  jwtAccessSecret: required('JWT_ACCESS_SECRET'),
  jwtRefreshSecret: required('JWT_REFRESH_SECRET'),
  jwtAccessExpires: process.env.JWT_ACCESS_EXPIRES || '15m',
  jwtRefreshExpires: process.env.JWT_REFRESH_EXPIRES || '7d',
  corsOrigins: [
    'http://localhost:5173',
    ...(process.env.CORS_ORIGINS || 'http://localhost:3000')
      .split(',')
      .map((origin) => origin.trim())
      .filter(Boolean),
    ...clientUrl.split(',').map((origin) => origin.trim()).filter(Boolean),
  ].filter((origin, index, origins) => origins.indexOf(origin) === index),
  jsonBodyLimit: process.env.JSON_BODY_LIMIT || '100kb',
  adminEmail: process.env.ADMIN_EMAIL || 'admin@memes.local',
  adminPassword: process.env.ADMIN_PASSWORD || 'Admin#1234',
};

module.exports = env;
