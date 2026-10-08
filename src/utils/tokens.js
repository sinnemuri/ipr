const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const env = require('../config/env');

const REFRESH_COOKIE = 'refreshToken';

function signAccessToken(user) {
  return jwt.sign(
    { sub: user.id, role: user.role, email: user.email },
    env.jwtAccessSecret,
    { expiresIn: env.jwtAccessExpires }
  );
}

function signRefreshToken(user) {
  return jwt.sign(
    { sub: user.id, typ: 'refresh' },
    env.jwtRefreshSecret,
    { expiresIn: env.jwtRefreshExpires }
  );
}

function verifyAccessToken(token) {
  return jwt.verify(token, env.jwtAccessSecret);
}

function verifyRefreshToken(token) {
  return jwt.verify(token, env.jwtRefreshSecret);
}

function refreshCookieOptions() {
  return {
    httpOnly: true,
    secure: env.isProd,
    sameSite: 'strict',
    path: '/auth',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  };
}

async function hashToken(token) {
  return bcrypt.hash(token, 10);
}

async function compareToken(token, hash) {
  if (!hash) return false;
  return bcrypt.compare(token, hash);
}

function randomResetToken() {
  return crypto.randomBytes(32).toString('hex');
}

function hashResetToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

module.exports = {
  REFRESH_COOKIE,
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  refreshCookieOptions,
  hashToken,
  compareToken,
  randomResetToken,
  hashResetToken,
};
