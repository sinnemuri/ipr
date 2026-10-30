const fs = require('fs');
const path = require('path');
const winston = require('winston');
const { Logtail } = require('@logtail/node');
const { LogtailTransport } = require('@logtail/winston');
require('winston-daily-rotate-file');

const logsDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

const fileFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    const extra = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
    return `${timestamp} ${level}: ${message}${extra}`;
  })
);

const errorRotate = new winston.transports.DailyRotateFile({
  dirname: logsDir,
  filename: 'errors-%DATE%.log',
  datePattern: 'YYYY-MM-DD',
  level: 'error',
  maxFiles: '14d',
  maxSize: '5m',
  format: fileFormat,
});

const appRotate = new winston.transports.DailyRotateFile({
  dirname: logsDir,
  filename: 'app-%DATE%.log',
  datePattern: 'YYYY-MM-DD',
  maxFiles: '14d',
  maxSize: '10m',
  format: fileFormat,
});

const securityRotate = new winston.transports.DailyRotateFile({
  dirname: logsDir,
  filename: 'security-%DATE%.log',
  datePattern: 'YYYY-MM-DD',
  maxFiles: '30d',
  maxSize: '5m',
  format: fileFormat,
});

const logtail = process.env.LOGTAIL_TOKEN
  ? new Logtail(process.env.LOGTAIL_TOKEN)
  : null;
const appCloudTransport = logtail ? new LogtailTransport(logtail) : null;
const securityCloudTransport = logtail ? new LogtailTransport(logtail) : null;

const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  transports: [
    new winston.transports.Console({ format: consoleFormat }),
    errorRotate,
    appRotate,
    ...(appCloudTransport ? [appCloudTransport] : []),
  ],
});

const securityLogger = winston.createLogger({
  level: 'info',
  transports: [
    new winston.transports.Console({ format: consoleFormat }),
    securityRotate,
    ...(securityCloudTransport ? [securityCloudTransport] : []),
  ],
});

function logSuspicious(event, details = {}) {
  securityLogger.warn(event, {
    event,
    ...details,
    at: new Date().toISOString(),
  });
}

function logAdminAction(event, details = {}) {
  securityLogger.info(event, {
    event,
    ...details,
    at: new Date().toISOString(),
  });
}

module.exports = { logger, securityLogger, logSuspicious, logAdminAction };
