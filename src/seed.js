require('dotenv').config();
const bcrypt = require('bcrypt');
const env = require('./config/env');
const { connectDb } = require('./config/database');
const { User, Category, Meme } = require('./models');
const { logger } = require('./utils/logger');

async function seed() {
  await connectDb();

  const passwordHash = await bcrypt.hash(env.adminPassword, 12);

  const [admin] = await User.findOrCreate({
    where: { email: env.adminEmail.toLowerCase() },
    defaults: {
      email: env.adminEmail.toLowerCase(),
      username: 'admin',
      passwordHash,
      role: 'admin',
    },
  });
  await admin.update({ passwordHash, failedLoginAttempts: 0, lockUntil: null });

  const moderatorHash = await bcrypt.hash('Moder#1234', 12);
  const [moderator] = await User.findOrCreate({
    where: { email: 'moderator@memes.local' },
    defaults: {
      email: 'moderator@memes.local',
      username: 'moderator',
      passwordHash: moderatorHash,
      role: 'moderator',
    },
  });
  await moderator.update({ passwordHash: moderatorHash, failedLoginAttempts: 0, lockUntil: null });

  const userHash = await bcrypt.hash('User#1234', 12);
  const [user] = await User.findOrCreate({
    where: { email: 'user@memes.local' },
    defaults: {
      email: 'user@memes.local',
      username: 'memeuser',
      passwordHash: userHash,
      role: 'user',
    },
  });
  await user.update({ passwordHash: userHash, failedLoginAttempts: 0, lockUntil: null });

  const cats = [
    { name: 'Коты', slug: 'cats', description: 'Кошачьи мемы' },
    { name: 'Программирование', slug: 'it', description: 'IT-юмор' },
    { name: 'Учёба', slug: 'study', description: 'Сессия и дедлайны' },
  ];

  const createdCats = [];
  for (const cat of cats) {
    const [row] = await Category.findOrCreate({ where: { slug: cat.slug }, defaults: cat });
    createdCats.push(row);
  }

  await Meme.findOrCreate({
    where: { title: 'Когда дедлайн уже завтра' },
    defaults: {
      title: 'Когда дедлайн уже завтра',
      imageUrl: 'https://placehold.co/600x400/png?text=Deadline',
      description: 'Классика студенческой жизни',
      categoryId: createdCats[2].id,
      authorId: user.id,
    },
  });

  logger.info('Seed выполнен', {
    admin: admin.email,
    moderator: moderator.email,
    user: user.email,
  });
  process.exit(0);
}

seed().catch((err) => {
  logger.error(err.message, { stack: err.stack });
  process.exit(1);
});
