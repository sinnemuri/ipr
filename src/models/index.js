const { sequelize } = require('../config/database');
const User = require('./User');
const Category = require('./Category');
const Meme = require('./Meme');
const Like = require('./Like');

User.hasMany(Meme, { foreignKey: 'authorId', as: 'memes' });
Meme.belongsTo(User, { foreignKey: 'authorId', as: 'author' });

Category.hasMany(Meme, { foreignKey: 'categoryId', as: 'memes' });
Meme.belongsTo(Category, { foreignKey: 'categoryId', as: 'category' });

User.belongsToMany(Meme, { through: Like, foreignKey: 'userId', as: 'likedMemes' });
Meme.belongsToMany(User, { through: Like, foreignKey: 'memeId', as: 'likedBy' });
Like.belongsTo(User, { foreignKey: 'userId' });
Like.belongsTo(Meme, { foreignKey: 'memeId' });
User.hasMany(Like, { foreignKey: 'userId' });
Meme.hasMany(Like, { foreignKey: 'memeId' });

module.exports = { sequelize, User, Category, Meme, Like };
