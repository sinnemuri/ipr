const { logSuspicious } = require('../utils/logger');

const ROLE_RANK = {
  user: 1,
  moderator: 2,
  admin: 3,
};

function roleGuard(requiredRole) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Требуется аутентификация' });
    }

    const userRank = ROLE_RANK[req.user.role] || 0;
    const neededRank = ROLE_RANK[requiredRole] || 99;

    if (userRank < neededRank) {
      logSuspicious('forbidden_role_access', {
        userId: req.user.id,
        role: req.user.role,
        requiredRole,
        path: req.originalUrl,
        method: req.method,
        ip: req.ip,
      });
      return res.status(403).json({ error: 'Недостаточно прав' });
    }

    return next();
  };
}

module.exports = { roleGuard, ROLE_RANK };
