/**
 * @openapi
 * /health:
 *   get:
 *     tags: [Auth]
 *     security: []
 *     summary: Проверка доступности
 *     responses:
 *       200:
 *         description: OK
 *
 * /auth/register:
 *   post:
 *     tags: [Auth]
 *     security: []
 *     summary: Регистрация пользователя
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, username, password]
 *             properties:
 *               email: { type: string, example: user@memes.local }
 *               username: { type: string, example: memeuser }
 *               password: { type: string, example: Passw0rd! }
 *     responses:
 *       201: { description: Создан }
 *       400: { description: Слабый пароль или ошибка валидации }
 *       409: { description: Email или username заняты }
 *
 * /auth/login:
 *   post:
 *     tags: [Auth]
 *     security: []
 *     summary: Вход, выдача JWT и refresh-cookie
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email: { type: string }
 *               password: { type: string }
 *     responses:
 *       200: { description: accessToken в теле, refreshToken в cookie }
 *       401: { description: Неверные учётные данные }
 *       423: { description: Аккаунт заблокирован на 15 минут }
 *
 * /auth/refresh:
 *   post:
 *     tags: [Auth]
 *     security: []
 *     summary: Обновить access-токен по httpOnly cookie
 *     responses:
 *       200: { description: Новый accessToken }
 *       401: { description: Нет или невалидный refresh }
 *
 * /auth/logout:
 *   post:
 *     tags: [Auth]
 *     summary: Выход и отзыв refresh-токена
 *     responses:
 *       200: { description: OK }
 *
 * /auth/me:
 *   get:
 *     tags: [Auth]
 *     summary: Текущий пользователь
 *     responses:
 *       200: { description: Профиль }
 *       401: { description: Нет токена }
 *
 * /auth/forgot-password:
 *   post:
 *     tags: [Auth]
 *     security: []
 *     summary: Запрос токена сброса пароля (TTL 1 час)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email: { type: string }
 *     responses:
 *       200: { description: Универсальный ответ (в dev возвращается resetToken) }
 *
 * /auth/reset-password:
 *   post:
 *     tags: [Auth]
 *     security: []
 *     summary: Сброс пароля по одноразовому токену
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [token, password]
 *             properties:
 *               token: { type: string }
 *               password: { type: string }
 *     responses:
 *       200: { description: Пароль обновлён }
 *       400: { description: Токен истёк }
 *
 * /users:
 *   get:
 *     tags: [Users]
 *     summary: Список пользователей (admin)
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, minimum: 1, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, minimum: 1, maximum: 50, default: 20 }
 *     responses:
 *       200: { description: OK }
 *       403: { description: Нет прав }
 *
 * /users/{id}:
 *   get:
 *     tags: [Users]
 *     summary: Пользователь по id
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: OK }
 *   patch:
 *     tags: [Users]
 *     summary: Обновить свой профиль (mass assignment запрещён)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username: { type: string }
 *               email: { type: string }
 *     responses:
 *       200: { description: OK }
 *       403: { description: Чужой профиль }
 *   delete:
 *     tags: [Users]
 *     summary: Удалить пользователя (admin)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       204: { description: Удалён }
 *
 * /users/{id}/role:
 *   patch:
 *     tags: [Users]
 *     summary: Сменить роль (admin)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [role]
 *             properties:
 *               role: { type: string, enum: [user, moderator, admin] }
 *     responses:
 *       200: { description: OK }
 *
 * /categories:
 *   get:
 *     tags: [Categories]
 *     security: []
 *     summary: Список категорий (публичный)
 *     responses:
 *       200: { description: OK }
 *   post:
 *     tags: [Categories]
 *     summary: Создать категорию (moderator+)
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, slug]
 *             properties:
 *               name: { type: string, example: Коты }
 *               slug: { type: string, example: cats }
 *               description: { type: string }
 *     responses:
 *       201: { description: Создана }
 *
 * /categories/{id}:
 *   patch:
 *     tags: [Categories]
 *     summary: Обновить категорию (moderator+)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: OK }
 *   delete:
 *     tags: [Categories]
 *     summary: Удалить категорию (admin)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       204: { description: Удалена }
 *
 * /memes:
 *   get:
 *     tags: [Memes]
 *     security: []
 *     summary: Список опубликованных мемов
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer }
 *       - in: query
 *         name: limit
 *         schema: { type: integer }
 *       - in: query
 *         name: categoryId
 *         schema: { type: integer }
 *       - in: query
 *         name: q
 *         schema: { type: string }
 *       - in: query
 *         name: sort
 *         schema: { type: string, enum: [new, top] }
 *     responses:
 *       200: { description: OK }
 *   post:
 *     tags: [Memes]
 *     summary: Создать мем (authenticated)
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title, imageUrl, categoryId]
 *             properties:
 *               title: { type: string }
 *               imageUrl: { type: string, example: https://example.com/meme.jpg }
 *               description: { type: string }
 *               categoryId: { type: integer }
 *     responses:
 *       201: { description: Создан }
 *
 * /memes/{id}:
 *   get:
 *     tags: [Memes]
 *     security: []
 *     summary: Мем по id
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: OK }
 *   patch:
 *     tags: [Memes]
 *     summary: Обновить мем (автор или moderator+)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: OK }
 *   delete:
 *     tags: [Memes]
 *     summary: Удалить мем (admin)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       204: { description: Удалён }
 *
 * /memes/{id}/like:
 *   post:
 *     tags: [Memes]
 *     summary: Поставить лайк (повышает рейтинг)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       201: { description: Лайк поставлен }
 *       409: { description: Уже лайкнут }
 *   delete:
 *     tags: [Memes]
 *     summary: Убрать лайк
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Лайк снят }
 */
module.exports = {};
