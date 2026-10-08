# Платформа для обмена мемами — безопасный REST API

Индивидуальная работа: **разработка безопасного REST API** для курсового проекта (лайки, рейтинг, категории).

Стек: **Node.js + Express.js + PostgreSQL + Sequelize + JWT**.

Документация эндпоинтов: [API.md](./API.md) и Swagger UI `/api-docs`.  
Postman-коллекция: [postman/Meme-Exchange-API.postman_collection.json](./postman/Meme-Exchange-API.postman_collection.json).

## Быстрый старт

```bash
cp .env.example .env
# PostgreSQL: локальный Homebrew (уже создана БД meme_platform)
# или Docker: docker compose up -d
npm install
npm run seed
npm run dev
```

Если БД ещё нет (Homebrew PostgreSQL):

```bash
psql postgres -c "CREATE USER meme WITH PASSWORD 'meme' CREATEDB;"
psql postgres -c "CREATE DATABASE meme_platform OWNER meme;"
```

Сервер: http://localhost:3000  
Swagger: http://localhost:3000/api-docs

Тестовые учётки после `npm run seed`:

| Роль | Email | Пароль |
|------|--------|--------|
| admin | admin@memes.local | Admin#1234 |
| moderator | moderator@memes.local | Moder#1234 |
| user | user@memes.local | User#1234 |

В `.env` значения с символом `#` (пароли) нужно брать в кавычки, иначе dotenv обрежет строку как комментарий.

Без Docker можно указать `DATABASE_URL` облачной БД (Neon).

## Структура

```
src/
  config/          # env, Sequelize
  models/          # User, Category, Meme, Like
  middleware/      # auth, roleGuard, validate, rate limit, errors
  controllers/     # бизнес-логика
  routes/          # маршруты
  validators/      # Joi-схемы
  utils/           # JWT, sanitize, logger
  docs/            # OpenAPI
postman/           # коллекция для тестов
```

## Ролевая модель

- `user` — создаёт мемы, ставит лайки, правит свои записи  
- `moderator` — категории, скрытие мемов  
- `admin` — удаление пользователей/мемов, смена ролей  

Middleware: `roleGuard(requiredRole)` сравнивает иерархию `user < moderator < admin`.

## Обязательные меры защиты

| Мера | Реализация |
|------|------------|
| Helmet | CSP, `X-Frame-Options: DENY`, скрытие `X-Powered-By` |
| Rate limiting | глобальный лимит + отдельный на `/auth/login` |
| Валидация | Joi на всех телах, params и query |
| SQL-инъекции | только Sequelize (параметризованные запросы, `Op.iLike`) |
| XSS | `sanitize-html` удаляет теги на входе |
| JWT + bcrypt | access 15 мин, пароли `bcrypt.hash` / `bcrypt.compare` |
| Логи подозрительных действий | `logs/security-*.log`: неудачный вход, блокировка, чужие ресурсы, 403, rate limit |

## Дополнительные меры (таблица задания)

Выбраны как наиболее актуальные для публичной платформы с аккаунтами и пользовательским контентом:

3. Сложность пароля (8+ символов, цифра, спецсимвол)  
5. JWT + refresh в **httpOnly** cookie  
6. 5 неудачных входов → блокировка на 15 минут  
9. Защита от mass assignment (`pick` разрешённых полей, Joi `stripUnknown`)  
12. Лимит размера тела запроса (`express.json({ limit })`)  
13. Content Security Policy через helmet  
15. Валидация `Content-Type: application/json`  
16. Токен сброса пароля, TTL 1 час  
17. `bcrypt.compare` (устойчивость к timing-атакам)  
18. `X-Frame-Options: DENY`  
19. Санитизация HTML  
22. CORS white list  
24. Generic errors в production  
25. Rate limit по `userId`  
30. Логи ошибок в отдельный файл с ротацией (`winston-daily-rotate-file`)

Секреты только в `.env` (файл в git не попадает).

## Примеры

Регистрация:

```bash
curl -X POST http://localhost:3000/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"email":"demo@memes.local","username":"demo","password":"Passw0rd!"}'
```

Вход (сохраняет cookie):

```bash
curl -c cookies.txt -X POST http://localhost:3000/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"user@memes.local","password":"User#1234"}'
```

Список топ-мемов:

```bash
curl 'http://localhost:3000/memes?sort=top'
```

## Git

Рабочая ветка: `ipr21`.
