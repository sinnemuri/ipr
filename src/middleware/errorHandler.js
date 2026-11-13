const env = require('../config/env');
const { logger } = require('../utils/logger');
const alertCooldowns = new Map();
const ALERT_COOLDOWN_MS = 5 * 60 * 1000;

function notifyCriticalError(req, status) {
  if (!env.telegramBotToken || !env.telegramChatId) return;

  const alertKey = `${status}:${req.method}:${req.path}`;
  const now = Date.now();
  const lastSentAt = alertCooldowns.get(alertKey) || 0;
  if (now - lastSentAt < ALERT_COOLDOWN_MS) return;

  alertCooldowns.set(alertKey, now);
  if (alertCooldowns.size > 500) {
    for (const [key, sentAt] of alertCooldowns) {
      if (now - sentAt >= ALERT_COOLDOWN_MS) alertCooldowns.delete(key);
    }
  }

  const text = [
    'MemeHub: критическая ошибка API',
    `HTTP: ${status}`,
    `Маршрут: ${req.method} ${req.route?.path || req.path}`,
    `Время UTC: ${new Date(now).toISOString()}`,
  ].join('\n');

  fetch(`https://api.telegram.org/bot${env.telegramBotToken}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: env.telegramChatId, text }),
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error(`Telegram API returned HTTP ${response.status}`);
      }
    })
    .catch((notifyError) => {
      logger.error('telegram_critical_alert_failed', {
        message: notifyError.message,
      });
    });
}

function notFound(req, res) {
  res.status(404).json({ error: 'Маршрут не найден' });
}

function errorHandler(err, req, res, _next) {
  const logDetails = {
    errorName: err.name,
    path: req.route?.path || req.path,
    method: req.method,
  };
  if (!env.isProd) {
    logDetails.message = err.message;
    logDetails.stack = err.stack;
  }
  logger.error('unhandled_error', logDetails);

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
  if (status >= 500) notifyCriticalError(req, status);
  const payload = { error: env.isProd ? 'Внутренняя ошибка сервера' : err.message };

  if (!env.isProd && err.stack) {
    payload.stack = err.stack;
  }

  return res.status(status).json(payload);
}

module.exports = { notFound, errorHandler };
