const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const MEME_STATUSES = ['published', 'hidden'];

const Meme = sequelize.define(
  'Meme',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    title: {
      type: DataTypes.STRING(120),
      allowNull: false,
    },
    imageUrl: {
      type: DataTypes.STRING(500),
      allowNull: false,
      validate: { isUrl: true },
    },
    description: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM(...MEME_STATUSES),
      allowNull: false,
      defaultValue: 'published',
    },
    likesCount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    rating: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: 'Рейтинг = количество лайков (обновляется транзакционно)',
    },
    authorId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    categoryId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  },
  {
    tableName: 'memes',
    timestamps: true,
  }
);

Meme.STATUSES = MEME_STATUSES;

module.exports = Meme;
