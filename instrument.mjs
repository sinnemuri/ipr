import 'dotenv/config';
import * as Sentry from '@sentry/node';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV || 'development',
  enabled: Boolean(process.env.SENTRY_DSN),
  sendDefaultPii: false,
});
