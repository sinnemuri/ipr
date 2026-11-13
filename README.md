# Платформа для обмена мемами — безопасный REST API

Индивидуальная работа: **разработка безопасного REST API** для курсового проекта (лайки, рейтинг, категории).

Стек: **Node.js + Express.js + PostgreSQL + Sequelize + JWT**.

Документация эндпоинтов: [API.md](./API.md) и Swagger UI `/api-docs`.  
Postman-коллекция: [postman/Meme-Exchange-API.postman_collection.json](./postman/Meme-Exchange-API.postman_collection.json).

## Быстрый старт

```bash
cp .env.example .env
```

Замени демонстрационные `JWT_ACCESS_SECRET` и `JWT_REFRESH_SECRET` в `.env` на случайные секреты. Затем собери и запусти PostgreSQL, seed и API одной командой:

```bash
docker compose up --build
```

После запуска:

- API: http://localhost:3000
- Swagger: http://localhost:3000/api-docs
- Проверка: http://localhost:3000/health
- PostgreSQL из локальных приложений: `localhost:5433` (в контейнерах API использует внутренний адрес `postgres:5432`)

Seed запускается автоматически после готовности PostgreSQL. Для фонового запуска используй `docker compose up --build -d`; логи API смотри командой `docker compose logs -f api`.

Остановка: `Ctrl+C` для foreground-запуска или `docker compose down` для фонового. Данные PostgreSQL сохраняются в Docker volume; `docker compose down -v` удалит базу.

Для запуска без Docker можно использовать локальный PostgreSQL, затем `npm install`, `npm run seed` и `npm run dev`.

Тестовые учётки после запуска Compose (или `npm run seed` при локальном запуске):

| Роль | Email | Пароль |
|------|--------|--------|
| admin | admin@memes.local | Admin#1234 |
| moderator | moderator@memes.local | Moder#1234 |
| user | user@memes.local | User#1234 |

В `.env` значения с символом `#` (пароли) нужно брать в кавычки, иначе dotenv обрежет строку как комментарий.

Без Docker можно указать `DATABASE_URL` облачной БД (Neon).

## React-клиент и CI

Клиент находится в `client/` и использует API из корня репозитория. Установка и запуск из корня:

```bash
npm ci
npm ci --prefix client
cp client/.env.example client/.env
npm run dev --prefix client
```

Для первоначального создания приложения и установки его зависимостей:

```bash
npm create vite@latest client -- --template react
npm --prefix client install
npm --prefix client install axios tailwindcss @tailwindcss/vite
```

`client/.env` задаёт `VITE_API_URL` (локально `http://localhost:3000`, в Netlify — URL Render API). API разрешает `http://localhost:5173` и origin, заданные в `CLIENT_URL` или `CORS_ORIGINS`.

Клиент предоставляет ленту мемов с поиском (debounce), категориями, отложенной загрузкой изображений и формами регистрации/входа/CRUD. Создание требует входа, изменение доступно автору или администратору, удаление — администратору.

Workflow `.github/workflows/deploy.yml` запускается при push в `ipr22` и `kr22`: устанавливает backend/frontend, проверяет синтаксис сервера, запускает backend-тесты, проверяет lint и production-сборку клиента, затем отправляет результат в Telegram. Для уведомлений добавьте GitHub Actions secrets `TELEGRAM_TO` (chat ID) и `TELEGRAM_TOKEN` (токен бота). Render и Netlify должны быть подключены к GitHub и настроены на автоматический deploy при push в `ipr22`; сам workflow выполняет CI, а деплой запускают интеграции хостингов.

Workflow `.github/workflows/uptime-telegram.yml` проверяет backend и (если настроен `FRONTEND_URL`) frontend каждые 5 минут и отправляет Telegram-сообщение при переходе сервиса в состояние недоступности и при восстановлении. В GitHub Actions repository variables задайте `BACKEND_HEALTH_URL` (полный HTTPS URL Render `/health`) и `FRONTEND_URL` (публичный URL Netlify, отвечающий без авторизации HTTP 2xx). Workflow использует secrets `TELEGRAM_TO` и `TELEGRAM_TOKEN`, а текущее состояние хранит в GitHub Actions cache. Для расписания `ipr22` должна быть default branch.

В Render задайте `NODE_ENV=production`, `DATABASE_URL` от Neon, JWT-секреты, `CLIENT_URL` (полный Netlify origin; несколько значений можно разделить запятыми), `SENTRY_DSN`, `LOGTAIL_TOKEN`, `LOGTAIL_INGESTING_HOST`, `TELEGRAM_BOT_TOKEN` и `TELEGRAM_CHAT_ID`. Последние две переменные нужны, чтобы Telegram получал уведомление при HTTP 5xx; токен бота задавайте только в Render Environment, не в коде и не в GitHub variables. Уведомления дедуплицируются по маршруту и статусу на пять минут.

Для Sentry backend DSN задаётся в Render как `SENTRY_DSN`. Для frontend создайте проект React в Sentry и задайте его DSN в Netlify как `VITE_SENTRY_DSN`. В настройках сборки Netlify дополнительно задайте `SENTRY_AUTH_TOKEN`, `SENTRY_ORG` и `SENTRY_PROJECT`: Vite плагин загрузит source maps в Sentry и удалит карты из собранного `dist`. Не добавляйте `SENTRY_AUTH_TOKEN` к переменным с префиксом `VITE_`. React Error Boundary показывает безопасную страницу ошибки и отправляет исключение в Sentry. Если параметры загрузки карт не заданы, production source maps не генерируются.

Для проверки логов задайте `LOGTAIL_TOKEN` и `LOGTAIL_INGESTING_HOST` из настроек Better Stack source. Тестовый маршрут Sentry удалён после backend-проверки; его не следует открывать на production.

Sentry backend инициализируется до загрузки модулей через `instrument.mjs`; команды `npm start` и `npm run dev` подключают его автоматически. Frontend SDK инициализируется до рендера React в `client/src/main.jsx`.

## Production ссылки и уведомления

- Frontend (Netlify): https://memehubci.netlify.app
- Backend (Render): https://memehub-api.onrender.com
- Health: https://memehub-api.onrender.com/health
- Metrics: https://memehub-api.onrender.com/metrics
- Публичная status page UptimeRobot: https://stats.uptimerobot.com/xyxPttnCmP
- Better Stack Logs: https://telemetry.betterstack.com/team/0/tail
- Sentry: https://sentry.io/
- Контакт по проекту: https://github.com/sinnemuri/ipr/issues

Не публикуйте bot token, Sentry auth token, chat ID или другие секреты. Telegram-оповещения отправляются в настроенный приватный чат.

## Структура

```
client/           # React + Vite frontend
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
| Audit log администратора | `logs/security-*.log`: все изменяющие запросы с токеном администратора, включая отклонённые попытки |

## Дополнительные меры (таблица задания)

Выбраны как наиболее актуальные для публичной платформы с аккаунтами и пользовательским контентом:

3. Сложность пароля (8+ символов, цифра, спецсимвол)  
5. JWT + refresh в **httpOnly** cookie  
6. 5 неудачных входов → блокировка на 15 минут  
7. Audit log действий администратора в отдельном security-логе  
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

Рабочая ветка: `ipr22`.
