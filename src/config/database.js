const { Sequelize } = require('sequelize');
const env = require('./env');
const { logger } = require('../utils/logger');

const sequelize = new Sequelize(env.databaseUrl, {
  dialect: 'postgres',
  logging: env.isProd ? false : (msg) => logger.debug(msg),
  dialectOptions: env.databaseUrl.includes('sslmode=require')
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
