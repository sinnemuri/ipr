const swaggerJsdoc = require('swagger-jsdoc');
const env = require('../config/env');

const spec = swaggerJsdoc({
  definition: {
    openapi: '3.0.3',
    info: {
      title: 'Meme Exchange API',
      version: '1.0.0',
      description:
        'Безопасный REST API платформы обмена мемами (лайки, рейтинг, категории). Access-токен передаётся в Authorization: Bearer, refresh-токен — в httpOnly cookie.',
    },
    servers: [{ url: `http://localhost:${env.port}`, description: 'Локальный сервер' }],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    security: [{ bearerAuth: [] }],
    tags: [
      { name: 'Auth', description: 'Регистрация и JWT' },
      { name: 'Users', description: 'Пользователи и роли' },
      { name: 'Categories', description: 'Категории мемов' },
      { name: 'Memes', description: 'CRUD мемов и лайки' },
    ],
  },
  apis: ['./src/docs/paths.js'],
});

module.exports = spec;
