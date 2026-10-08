const rateLimit = require('express-rate-limit');
const { logSuspicious } = require('../utils/logger');

function onLimitReached(req) {
  logSuspicious('rate_limit_hit', {
    ip: req.ip,
    path: req.originalUrl,
    userId: req.user?.id,
  });
}

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    onLimitReached(req);
    res.status(429).json({ error: 'Слишком много запросов, повторите позже' });
  },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    onLimitReached(req);
    res.status(429).json({ error: 'Слишком много попыток входа' });
  },
});

const perUserLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 80,
  keyGenerator: (req) => `user:${req.user.id}`,
  validate: { ip: false },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    onLimitReached(req);
    res.status(429).json({ error: 'Превышен лимит запросов для пользователя' });
  },
});

module.exports = { globalLimiter, authLimiter, perUserLimiter };
