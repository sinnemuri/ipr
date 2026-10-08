const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Like = sequelize.define(
  'Like',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    memeId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  },
  {
    tableName: 'likes',
    timestamps: true,
    updatedAt: false,
    indexes: [
      {
        unique: true,
        fields: ['userId', 'memeId'],
      },
    ],
  }
);

module.exports = Like;
