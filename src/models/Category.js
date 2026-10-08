const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Category = sequelize.define(
  'Category',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.STRING(80),
      allowNull: false,
      unique: true,
    },
    slug: {
      type: DataTypes.STRING(80),
      allowNull: false,
      unique: true,
    },
    description: {
      type: DataTypes.STRING(300),
      allowNull: true,
    },
  },
  {
    tableName: 'categories',
    timestamps: true,
  }
);

module.exports = Category;
