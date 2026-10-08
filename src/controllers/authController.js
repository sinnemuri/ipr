const bcrypt = require('bcrypt');
const { User } = require('../models');
const { logSuspicious } = require('../utils/logger');
const {
  REFRESH_COOKIE,
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  refreshCookieOptions,
  hashToken,
  compareToken,
  randomResetToken,
  hashResetToken,
} = require('../utils/tokens');

const MAX_FAILED = 5;
const LOCK_MS = 15 * 60 * 1000;
const RESET_TTL_MS = 60 * 60 * 1000;

exports.register = async (req, res, next) => {
  try {
    const { email, username, password } = req.body;
    const passwordHash = await bcrypt.hash(password, 12);
    const user = await User.create({
      email: email.toLowerCase(),
      username,
      passwordHash,
      role: 'user',
    });
    res.status(201).json({ user: user.toPublicJSON() });
  } catch (err) {
    next(err);
  }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.unscoped().findOne({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      logSuspicious('login_failed_unknown_email', { email, ip: req.ip });
      return res.status(401).json({ error: 'Неверный email или пароль' });
    }

    if (user.isLocked()) {
      logSuspicious('login_blocked_locked_account', { userId: user.id, ip: req.ip });
      return res.status(423).json({
        error: 'Аккаунт временно заблокирован из-за неудачных попыток входа',
        lockUntil: user.lockUntil,
      });
    }

    const matches = await bcrypt.compare(password, user.passwordHash);
    if (!matches) {
      user.failedLoginAttempts += 1;
      if (user.failedLoginAttempts >= MAX_FAILED) {
        user.lockUntil = new Date(Date.now() + LOCK_MS);
        user.failedLoginAttempts = 0;
        logSuspicious('account_locked', { userId: user.id, ip: req.ip, minutes: 15 });
      } else {
        logSuspicious('login_failed', {
          userId: user.id,
          ip: req.ip,
          attempts: user.failedLoginAttempts,
        });
      }
      await user.save();
      return res.status(401).json({ error: 'Неверный email или пароль' });
    }

    user.failedLoginAttempts = 0;
    user.lockUntil = null;
    const accessToken = signAccessToken(user);
    const refreshToken = signRefreshToken(user);
    user.refreshTokenHash = await hashToken(refreshToken);
    await user.save();
    res.cookie(REFRESH_COOKIE, refreshToken, refreshCookieOptions());

    return res.json({
      accessToken,
      tokenType: 'Bearer',
      expiresIn: '15m',
      user: user.toPublicJSON(),
    });
  } catch (err) {
    next(err);
  }
};

exports.refresh = async (req, res, next) => {
  try {
    const token = req.cookies[REFRESH_COOKIE];
    if (!token) {
      return res.status(401).json({ error: 'Refresh-токен отсутствует' });
    }

    let payload;
    try {
      payload = verifyRefreshToken(token);
    } catch {
      logSuspicious('invalid_refresh_token', { ip: req.ip });
      return res.status(401).json({ error: 'Недействительный refresh-токен' });
    }

    const user = await User.unscoped().findByPk(payload.sub);
    if (!user) {
      return res.status(401).json({ error: 'Пользователь не найден' });
    }

    const valid = await compareToken(token, user.refreshTokenHash);
    if (!valid) {
      logSuspicious('refresh_token_reuse_or_mismatch', { userId: user.id, ip: req.ip });
      user.refreshTokenHash = null;
      await user.save();
      res.clearCookie(REFRESH_COOKIE, refreshCookieOptions());
      return res.status(401).json({ error: 'Refresh-токен отозван' });
    }

    const accessToken = signAccessToken(user);
    const nextRefresh = signRefreshToken(user);
    user.refreshTokenHash = await hashToken(nextRefresh);
    await user.save();
    res.cookie(REFRESH_COOKIE, nextRefresh, refreshCookieOptions());

    return res.json({ accessToken, tokenType: 'Bearer', expiresIn: '15m' });
  } catch (err) {
    next(err);
  }
};

exports.logout = async (req, res, next) => {
  try {
    if (req.user) {
      const user = await User.unscoped().findByPk(req.user.id);
      if (user) {
        user.refreshTokenHash = null;
        await user.save();
      }
    }
    res.clearCookie(REFRESH_COOKIE, refreshCookieOptions());
    return res.json({ message: 'Выход выполнен' });
  } catch (err) {
    next(err);
  }
};

exports.me = async (req, res) => {
  res.json({ user: req.user.toPublicJSON() });
};

exports.forgotPassword = async (req, res, next) => {
  try {
    const user = await User.unscoped().findOne({
      where: { email: req.body.email.toLowerCase() },
    });

    // Всегда одинаковый ответ — не раскрываем, существует ли email
    if (!user) {
      return res.json({
        message: 'Если аккаунт существует, письмо со ссылкой отправлено',
      });
    }

    const token = randomResetToken();
    user.passwordResetTokenHash = hashResetToken(token);
    user.passwordResetExpires = new Date(Date.now() + RESET_TTL_MS);
    await user.save();

    return res.json({
      message: 'Если аккаунт существует, письмо со ссылкой отправлено',
      resetToken: process.env.NODE_ENV === 'production' ? undefined : token,
      expiresIn: '1h',
    });
  } catch (err) {
    next(err);
  }
};

exports.resetPassword = async (req, res, next) => {
  try {
    const hash = hashResetToken(req.body.token);
    const user = await User.unscoped().findOne({
      where: { passwordResetTokenHash: hash },
    });

    if (!user || !user.passwordResetExpires || user.passwordResetExpires < new Date()) {
      logSuspicious('invalid_or_expired_reset_token', { ip: req.ip });
      return res.status(400).json({ error: 'Токен сброса недействителен или истёк' });
    }

    user.passwordHash = await bcrypt.hash(req.body.password, 12);
    user.passwordResetTokenHash = null;
    user.passwordResetExpires = null;
    user.refreshTokenHash = null;
    user.failedLoginAttempts = 0;
    user.lockUntil = null;
    await user.save();

    res.clearCookie(REFRESH_COOKIE, refreshCookieOptions());
    return res.json({ message: 'Пароль обновлён' });
  } catch (err) {
    next(err);
  }
};
