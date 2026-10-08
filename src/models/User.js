const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const ROLES = ['user', 'moderator', 'admin'];

const User = sequelize.define(
  'User',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
      validate: { isEmail: true },
    },
    username: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
    },
    passwordHash: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    role: {
      type: DataTypes.ENUM(...ROLES),
      allowNull: false,
      defaultValue: 'user',
    },
    failedLoginAttempts: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    lockUntil: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    refreshTokenHash: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    passwordResetTokenHash: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    passwordResetExpires: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    tableName: 'users',
    timestamps: true,
    defaultScope: {
      attributes: { exclude: ['passwordHash', 'refreshTokenHash', 'passwordResetTokenHash'] },
    },
    scopes: {
      withSecrets: { attributes: {} },
    },
  }
);

User.ROLES = ROLES;

User.prototype.isLocked = function isLocked() {
  return Boolean(this.lockUntil && this.lockUntil > new Date());
};

User.prototype.toPublicJSON = function toPublicJSON() {
  return {
    id: this.id,
    email: this.email,
    username: this.username,
    role: this.role,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };
};

module.exports = User;
