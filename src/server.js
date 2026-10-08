const env = require('./config/env');
const { connectDb } = require('./config/database');
const { logger } = require('./utils/logger');
const app = require('./app');

async function start() {
  try {
    require('./models');
    await connectDb();
    app.listen(env.port, () => {
      logger.info(`API запущен на http://localhost:${env.port}`);
      logger.info(`Swagger: http://localhost:${env.port}/api-docs`);
    });
  } catch (err) {
    logger.error('Не удалось запустить сервер', { message: err.message, stack: err.stack });
    process.exit(1);
  }
}

start();
