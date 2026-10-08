const { User } = require('../models');
const { pick } = require('../utils/sanitize');
const { logSuspicious } = require('../utils/logger');

const USER_UPDATE_FIELDS = ['username', 'email'];

exports.list = async (req, res, next) => {
  try {
    const { page, limit } = req.query;
    const { rows, count } = await User.findAndCountAll({
      order: [['id', 'ASC']],
      limit,
      offset: (page - 1) * limit,
    });
    res.json({
      users: rows.map((user) => user.toPublicJSON()),
      pagination: { page, limit, total: count, pages: Math.ceil(count / limit) },
    });
  } catch (err) {
    next(err);
  }
};

exports.getById = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ error: 'Пользователь не найден' });
    return res.json({ user: user.toPublicJSON() });
  } catch (err) {
    next(err);
  }
};

exports.update = async (req, res, next) => {
  try {
    const targetId = Number(req.params.id);
    const isSelf = req.user.id === targetId;
    const isAdmin = req.user.role === 'admin';

    if (!isSelf && !isAdmin) {
      logSuspicious('update_foreign_user_denied', {
        actorId: req.user.id,
        targetId,
        ip: req.ip,
      });
      return res.status(403).json({ error: 'Нельзя изменять чужой профиль' });
    }

    const user = await User.findByPk(targetId);
    if (!user) return res.status(404).json({ error: 'Пользователь не найден' });

    const patch = pick(req.body, USER_UPDATE_FIELDS);
    if (patch.email) patch.email = patch.email.toLowerCase();
    await user.update(patch);

    return res.json({ user: user.toPublicJSON() });
  } catch (err) {
    next(err);
  }
};

exports.updateRole = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ error: 'Пользователь не найден' });

    if (user.id === req.user.id) {
      return res.status(400).json({ error: 'Нельзя изменить собственную роль' });
    }

    await user.update({ role: req.body.role });
    return res.json({ user: user.toPublicJSON() });
  } catch (err) {
    next(err);
  }
};

exports.remove = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ error: 'Пользователь не найден' });
    if (user.id === req.user.id) {
      return res.status(400).json({ error: 'Нельзя удалить собственный аккаунт этой командой' });
    }
    await user.destroy();
    return res.status(204).send();
  } catch (err) {
    next(err);
  }
};
