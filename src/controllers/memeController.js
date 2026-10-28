const { Op, fn, col } = require('sequelize');
const { sequelize, Meme, Category, User, Like } = require('../models');
const { pick } = require('../utils/sanitize');
const { logSuspicious } = require('../utils/logger');
const { ROLE_RANK } = require('../middleware/roleGuard');

const MEME_CREATE_FIELDS = ['title', 'imageUrl', 'description', 'categoryId'];
const MEME_UPDATE_FIELDS = ['title', 'imageUrl', 'description', 'categoryId', 'status'];

function canModerate(user) {
  return ROLE_RANK[user.role] >= ROLE_RANK.moderator;
}

exports.list = async (req, res, next) => {
  try {
    const { page, limit, categoryId, category, search, q, sort } = req.query;
    const where = { status: 'published' };

    if (categoryId) where.categoryId = categoryId;
    if (search || q) {
      const searchTerm = search || q;
      where[Op.or] = [
        { title: { [Op.iLike]: `%${searchTerm}%` } },
        { description: { [Op.iLike]: `%${searchTerm}%` } },
      ];
    }

    const order = sort === 'top' ? [['rating', 'DESC'], ['id', 'DESC']] : [['createdAt', 'DESC']];

    const { rows, count } = await Meme.findAndCountAll({
      where,
      include: [
        { model: User, as: 'author', attributes: ['id', 'username', 'role'] },
        {
          model: Category,
          as: 'category',
          attributes: ['id', 'name', 'slug'],
          ...(category ? { where: { slug: category }, required: true } : {}),
        },
      ],
      order,
      limit,
      offset: (page - 1) * limit,
    });

    res.json({
      memes: rows,
      pagination: { page, limit, total: count, pages: Math.ceil(count / limit) },
    });
  } catch (err) {
    next(err);
  }
};

exports.getStats = async (req, res, next) => {
  try {
    const [count, likesSum, groupedByCategory] = await Promise.all([
      Meme.count(),
      Meme.sum('likesCount'),
      Meme.findAll({
        attributes: ['categoryId', [fn('COUNT', col('id')), 'count']],
        group: ['categoryId'],
        raw: true,
      }),
    ]);

    return res.json({
      count,
      sum: Number(likesSum || 0),
      byCategory: groupedByCategory.map(({ categoryId, count: categoryCount }) => ({
        categoryId,
        count: Number(categoryCount),
      })),
    });
  } catch (err) {
    return next(err);
  }
};

exports.getById = async (req, res, next) => {
  try {
    const meme = await Meme.findByPk(req.params.id, {
      include: [
        { model: User, as: 'author', attributes: ['id', 'username', 'role'] },
        { model: Category, as: 'category', attributes: ['id', 'name', 'slug'] },
      ],
    });
    if (!meme) return res.status(404).json({ error: 'Мем не найден' });

    if (meme.status === 'hidden') {
      const allowed =
        req.user && (req.user.id === meme.authorId || canModerate(req.user));
      if (!allowed) return res.status(404).json({ error: 'Мем не найден' });
    }

    return res.json({ meme });
  } catch (err) {
    next(err);
  }
};

exports.create = async (req, res, next) => {
  try {
    const category = await Category.findByPk(req.body.categoryId);
    if (!category) return res.status(400).json({ error: 'Категория не найдена' });

    const data = pick(req.body, MEME_CREATE_FIELDS);
    const meme = await Meme.create({ ...data, authorId: req.user.id });
    return res.status(201).json({ meme });
  } catch (err) {
    next(err);
  }
};

exports.update = async (req, res, next) => {
  try {
    const meme = await Meme.findByPk(req.params.id);
    if (!meme) return res.status(404).json({ error: 'Мем не найден' });

    const isOwner = meme.authorId === req.user.id;
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      logSuspicious('update_foreign_meme_denied', {
        actorId: req.user.id,
        memeId: meme.id,
        ip: req.ip,
      });
      return res.status(403).json({ error: 'Нельзя изменять чужой мем' });
    }

    const patch = pick(req.body, MEME_UPDATE_FIELDS);
    if (patch.status && !isAdmin) {
      return res.status(403).json({ error: 'Статус может менять только администратор' });
    }
    if (patch.categoryId) {
      const category = await Category.findByPk(patch.categoryId);
      if (!category) return res.status(400).json({ error: 'Категория не найдена' });
    }

    await meme.update(patch);
    return res.json({ meme });
  } catch (err) {
    next(err);
  }
};

exports.remove = async (req, res, next) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Удалять мемы может только администратор' });
    }

    const meme = await Meme.findByPk(req.params.id);
    if (!meme) return res.status(404).json({ error: 'Мем не найден' });
    await meme.destroy();
    return res.json({ message: 'Мем удалён' });
  } catch (err) {
    next(err);
  }
};

exports.like = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const meme = await Meme.findByPk(req.params.id, { transaction: t, lock: t.LOCK.UPDATE });
    if (!meme || meme.status === 'hidden') {
      await t.rollback();
      return res.status(404).json({ error: 'Мем не найден' });
    }

    const [, created] = await Like.findOrCreate({
      where: { userId: req.user.id, memeId: meme.id },
      defaults: { userId: req.user.id, memeId: meme.id },
      transaction: t,
    });

    if (!created) {
      await t.rollback();
      return res.status(409).json({ error: 'Вы уже поставили лайк' });
    }

    await meme.increment(['likesCount', 'rating'], { by: 1, transaction: t });
    await t.commit();
    await meme.reload();
    return res.status(201).json({ liked: true, memeId: meme.id, likesCount: meme.likesCount });
  } catch (err) {
    await t.rollback();
    next(err);
  }
};

exports.unlike = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const meme = await Meme.findByPk(req.params.id, { transaction: t, lock: t.LOCK.UPDATE });
    if (!meme) {
      await t.rollback();
      return res.status(404).json({ error: 'Мем не найден' });
    }

    const deleted = await Like.destroy({
      where: { userId: req.user.id, memeId: meme.id },
      transaction: t,
    });

    if (!deleted) {
      await t.rollback();
      return res.status(404).json({ error: 'Лайк не найден' });
    }

    if (meme.likesCount > 0) {
      await meme.decrement(['likesCount', 'rating'], { by: 1, transaction: t });
    }
    await t.commit();
    await meme.reload();
    return res.json({ liked: false, memeId: meme.id, likesCount: meme.likesCount });
  } catch (err) {
    await t.rollback();
    next(err);
  }
};
