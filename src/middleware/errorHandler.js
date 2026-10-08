const env = require('../config/env');
const { logger } = require('../utils/logger');

function notFound(req, res) {
  res.status(404).json({ error: 'Маршрут не найден' });
}

function errorHandler(err, req, res, _next) {
  logger.error('unhandled_error', {
    message: err.message,
    stack: err.stack,
    path: req.originalUrl,
    method: req.method,
  });

  if (err.message && err.message.includes('CORS')) {
    return res.status(403).json({ error: 'Origin не разрешён политикой CORS' });
  }

  if (err.type === 'entity.too.large') {
    return res.status(413).json({ error: 'Тело запроса слишком большое' });
  }

  if (err.name === 'SequelizeUniqueConstraintError') {
    return res.status(409).json({ error: 'Запись с такими данными уже существует' });
  }

  if (err.name === 'SequelizeValidationError') {
    return res.status(400).json({
      error: 'Ошибка валидации',
      details: env.isProd ? undefined : err.errors?.map((item) => item.message),
    });
  }

  const status = err.status || 500;
  const payload = { error: env.isProd ? 'Внутренняя ошибка сервера' : err.message };

  if (!env.isProd && err.stack) {
    payload.stack = err.stack;
  }

  return res.status(status).json(payload);
}

module.exports = { notFound, errorHandler };
