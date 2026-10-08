# API платформы обмена мемами

Базовый URL: `http://localhost:3000`

Интерактивная документация: `/api-docs`  
OpenAPI JSON: `/api-docs.json`

Access-токен: заголовок `Authorization: Bearer <token>` (срок жизни 15 минут).  
Refresh-токен: httpOnly cookie `refreshToken` (путь `/auth`, SameSite=strict).

Все запросы с телом должны иметь `Content-Type: application/json`.

## Роли

| Роль | Возможности |
|------|-------------|
| `user` | Регистрация контента, лайки, правка своих мемов и профиля |
| `moderator` | Всё, что user + категории, скрытие любых мемов |
| `admin` | Всё + удаление пользователей и мемов, смена ролей |

## Аутентификация

### POST `/auth/register`

```json
{ "email": "user@memes.local", "username": "memeuser", "password": "Passw0rd!" }
```

Пароль: минимум 8 символов, цифра и спецсимвол. Роль всегда `user` (mass assignment роли невозможен).

Ответы: `201`, `400` (валидация), `409` (email/username заняты).

### POST `/auth/login`

```json
{ "email": "user@memes.local", "password": "User#1234" }
```

Ответы: `200` (accessToken + cookie), `401`, `423` (5 неудач → блокировка 15 минут).

### POST `/auth/refresh`

Cookie `refreshToken`. Ответ: новый `accessToken`. Старый refresh ротируется.

### POST `/auth/logout`

Требует access-токен. Отзывает refresh в БД и чистит cookie.

### GET `/auth/me`

Текущий пользователь. `401` без токена.

### POST `/auth/forgot-password`

```json
{ "email": "user@memes.local" }
```

Всегда одинаковое сообщение. В `development` дополнительно возвращается `resetToken` (TTL 1 час).

### POST `/auth/reset-password`

```json
{ "token": "<hex 64>", "password": "NewPass#1" }
```

## Пользователи

| Метод | Путь | Доступ |
|-------|------|--------|
| GET | `/users` | admin |
| GET | `/users/:id` | любой аутентифицированный |
| PATCH | `/users/:id` | владелец или admin. Разрешены только `username`, `email` |
| PATCH | `/users/:id/role` | admin `{ "role": "moderator" }` |
| DELETE | `/users/:id` | admin |

Попытка править чужой профиль → `403` и запись в security-лог.

## Категории

| Метод | Путь | Доступ |
|-------|------|--------|
| GET | `/categories` | публичный |
| POST | `/categories` | moderator+ `{ name, slug, description? }` |
| PATCH | `/categories/:id` | moderator+ |
| DELETE | `/categories/:id` | admin |

## Мемы

Рейтинг равен числу лайков и обновляется транзакционно.

| Метод | Путь | Доступ |
|-------|------|--------|
| GET | `/memes` | публичный. Query: `page`, `limit`, `categoryId`, `q`, `sort=new\|top` |
| GET | `/memes/:id` | публичный (скрытые — автор/модератор) |
| POST | `/memes` | authenticated `{ title, imageUrl, description?, categoryId }` |
| PATCH | `/memes/:id` | автор или moderator+. `status` только moderator+ |
| DELETE | `/memes/:id` | admin |
| POST | `/memes/:id/like` | authenticated |
| DELETE | `/memes/:id/like` | authenticated |

HTML-теги во входных строках удаляются.

## Служебные

- `GET /health` — `{ "status": "ok" }`
- `413` — тело больше лимита (`JSON_BODY_LIMIT`, по умолчанию 100kb)
- `415` — неверный Content-Type
- `429` — rate limit (глобальный или per-user)
- В production детали ошибок не отдаются клиенту
