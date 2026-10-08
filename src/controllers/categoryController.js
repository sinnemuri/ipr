const { Category } = require('../models');
const { pick } = require('../utils/sanitize');

exports.list = async (req, res, next) => {
  try {
    const categories = await Category.findAll({ order: [['name', 'ASC']] });
    res.json({ categories });
  } catch (err) {
    next(err);
  }
};

exports.create = async (req, res, next) => {
  try {
    const data = pick(req.body, ['name', 'slug', 'description']);
    const category = await Category.create(data);
    res.status(201).json({ category });
  } catch (err) {
    next(err);
  }
};

exports.update = async (req, res, next) => {
  try {
    const category = await Category.findByPk(req.params.id);
    if (!category) return res.status(404).json({ error: 'Категория не найдена' });
    await category.update(pick(req.body, ['name', 'slug', 'description']));
    return res.json({ category });
  } catch (err) {
    next(err);
  }
};

exports.remove = async (req, res, next) => {
  try {
    const category = await Category.findByPk(req.params.id);
    if (!category) return res.status(404).json({ error: 'Категория не найдена' });
    await category.destroy();
    return res.status(204).send();
  } catch (err) {
    next(err);
  }
};
