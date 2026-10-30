const { Sequelize } = require('sequelize');
const env = require('./env');
const { logger } = require('../utils/logger');

const databaseUrl = new URL(env.databaseUrl);
const localDatabaseHosts = ['localhost', '127.0.0.1', 'postgres'];
const useSsl =
  databaseUrl.searchParams.get('sslmode') === 'require' ||
  (env.isProd && !localDatabaseHosts.includes(databaseUrl.hostname));

const sequelize = new Sequelize(env.databaseUrl, {
  dialect: 'postgres',
  logging: env.isProd ? false : (msg) => logger.debug(msg),
  dialectOptions: useSsl
    ? { ssl: { require: true, rejectUnauthorized: false } }
    : {},
});

async function connectDb() {
  await sequelize.authenticate();
  logger.info('Подключение к PostgreSQL установлено');
  await sequelize.sync({ alter: !env.isProd });
  logger.info('Модели синхронизированы');
}

module.exports = { sequelize, connectDb };
