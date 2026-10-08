const { User } = require('../models');
const { verifyAccessToken } = require('../utils/tokens');
const { logSuspicious } = require('../utils/logger');

function extractBearer(header) {
  if (!header || !header.startsWith('Bearer ')) return null;
  return header.slice(7).trim();
}

async function authenticate(req, res, next) {
  try {
    const token = extractBearer(req.headers.authorization);
    if (!token) {
      return res.status(401).json({ error: 'Требуется токен доступа' });
    }

    const payload = verifyAccessToken(token);
    const user = await User.findByPk(payload.sub);
    if (!user) {
      logSuspicious('access_token_user_missing', { userId: payload.sub, ip: req.ip });
      return res.status(401).json({ error: 'Пользователь не найден' });
    }

    req.user = user;
    return next();
  } catch (err) {
    logSuspicious('invalid_access_token', { ip: req.ip, reason: err.name });
    return res.status(401).json({ error: 'Недействительный или истёкший токен' });
  }
}

async function optionalAuth(req, res, next) {
  const token = extractBearer(req.headers.authorization);
  if (!token) return next();
  try {
    const payload = verifyAccessToken(token);
    const user = await User.findByPk(payload.sub);
    if (user) req.user = user;
  } catch {
    // публичные маршруты не падают из-за битого токена
  }
  return next();
}

module.exports = { authenticate, optionalAuth };
