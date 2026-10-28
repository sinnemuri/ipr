# MemeHub API

Базовый URL: `http://localhost:3000`. Все тела запросов передаются в формате JSON с заголовком `Content-Type: application/json`.

Для защищённых маршрутов передавайте access-токен в заголовке `Authorization` со схемой `Bearer`.

Токен возвращается при успешном входе. Примеры ответов ниже показывают JSON-тело; фактическое представление мемов и пользователей также содержит дополнительные поля модели.

## Аутентификация

### Регистрация

`POST /auth/register` — публичный маршрут.

Тело запроса:

```json
{
  "email": "user@example.com",
  "username": "memeuser",
  "password": "Passw0rd!"
}
```

Проверки: корректный email (до 255 символов), имя пользователя из 3–50 букв или цифр, пароль из 8–72 символов с цифрой и спецсимволом. Роль при регистрации устанавливается в `user`; передавать её в теле не нужно.

`201 Created`:

```json
{
  "user": {
    "id": 1,
    "email": "user@example.com",
    "username": "memeuser",
    "role": "user"
  }
}
```

При некорректном вводе возвращается `400 Bad Request`, при занятом email или username — `409 Conflict`.

### Вход

`POST /auth/login` — публичный маршрут.

Тело запроса:

```json
{
  "email": "user@example.com",
  "password": "Passw0rd!"
}
```

`200 OK` (refresh-токен устанавливается в cookie `refreshToken`):

```json
{
  "accessToken": "<JWT>",
  "tokenType": "Bearer",
  "expiresIn": "15m",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "username": "memeuser",
    "role": "user"
  }
}
```

Неверные учётные данные дают `401 Unauthorized`; временно заблокированный аккаунт — `423 Locked`.

### Текущий пользователь

`GET /auth/me` — требуется access-токен в заголовке `Authorization` со схемой `Bearer`.

`200 OK`:

```json
{
  "user": {
    "id": 1,
    "email": "user@example.com",
    "username": "memeuser",
    "role": "user"
  }
}
```

Если токен отсутствует или недействителен, возвращается `401 Unauthorized`.

## Мемы

### Список мемов

`GET /memes` — публичный маршрут.

Параметры запроса:

| Параметр | Назначение |
|---|---|
| `page` | Номер страницы, от 1; по умолчанию `1` |
| `limit` | Размер страницы, от 1 до 50; по умолчанию `10` |
| `category` | Slug категории, например `cats` |
| `search` | Поиск подстроки в названии и описании, до 80 символов |
| `sort` | `new` (по умолчанию) или `top` |

Например: `GET /memes?category=cats&search=кот&page=1&limit=10`.

`200 OK`:

```json
{
  "memes": [
    {
      "id": 12,
      "title": "Кот-мем",
      "imageUrl": "https://example.com/meme.jpg",
      "description": "Описание",
      "status": "published",
      "likesCount": 3,
      "rating": 3,
      "authorId": 1,
      "categoryId": 2,
      "author": { "id": 1, "username": "memeuser", "role": "user" },
      "category": { "id": 2, "name": "Коты", "slug": "cats" }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 1,
    "pages": 1
  }
}
```

### Статистика мемов

`GET /memes/stats` — публичный маршрут.

`200 OK`:

```json
{
  "count": 12,
  "sum": 37,
  "byCategory": [
    { "categoryId": 1, "count": 5 },
    { "categoryId": 2, "count": 7 }
  ]
}
```

`count` — общее число мемов, `sum` — сумма значений `likesCount`, `byCategory` — число мемов в каждой категории.

### Получение мема

`GET /memes/:id` — публичный маршрут. Скрытый мем доступен только автору и модератору/администратору.

`200 OK`:

```json
{
  "meme": {
    "id": 12,
    "title": "Кот-мем",
    "imageUrl": "https://example.com/meme.jpg",
    "description": "Описание",
    "status": "published",
    "likesCount": 3,
    "rating": 3,
    "authorId": 1,
    "categoryId": 2
  }
}
```

Если мем не существует или недоступен, возвращается `404 Not Found`.

### Создание мема

`POST /memes` — требуется access-токен; автором назначается текущий пользователь.

Тело запроса:

```json
{
  "title": "Кот-мем",
  "imageUrl": "https://example.com/meme.jpg",
  "description": "Описание",
  "categoryId": 2
}
```

`title` (2–120 символов), URL изображения (`http` или `https`, до 500 символов) и положительный целочисленный `categoryId` обязательны. `description` необязателен (до 500 символов).

`201 Created`:

```json
{
  "meme": {
    "id": 12,
    "title": "Кот-мем",
    "imageUrl": "https://example.com/meme.jpg",
    "description": "Описание",
    "status": "published",
    "likesCount": 0,
    "rating": 0,
    "authorId": 1,
    "categoryId": 2
  }
}
```

Без токена возвращается `401 Unauthorized`, при некорректном теле или отсутствующей категории — `400 Bad Request`.

### Обновление мема

`PUT /memes/:id` — требуется access-токен. Изменять мем может только его автор или пользователь с ролью `admin`; `moderator` без роли `admin` этим правом не обладает.

Тело запроса содержит одно или несколько полей:

```json
{
  "title": "Новое название",
  "description": "Обновлённое описание",
  "categoryId": 2,
  "imageUrl": "https://example.com/updated.jpg"
}
```

Допускаются `title` (2–120 символов), `imageUrl` (HTTP(S), до 500 символов), `description` (до 500 символов), положительный `categoryId` и `status` (`published` или `hidden`). Поле `status` может менять только администратор.

`200 OK`:

```json
{
  "meme": {
    "id": 12,
    "title": "Новое название",
    "imageUrl": "https://example.com/updated.jpg",
    "description": "Обновлённое описание",
    "status": "published",
    "likesCount": 3,
    "rating": 3,
    "authorId": 1,
    "categoryId": 2
  }
}
```

`403 Forbidden` возвращается, если мем пытается изменить не автор и не администратор, либо пользователь без роли admin передаёт `status`. Несуществующий мем даёт `404 Not Found`.

### Удаление мема

`DELETE /memes/:id` — требуется access-токен; удалять мемы может строго пользователь с ролью `admin`.

`200 OK`:

```json
{
  "message": "Мем удалён"
}
```

Запрос от пользователя без роли admin получает `403 Forbidden`; без токена — `401 Unauthorized`. Несуществующий мем даёт `404 Not Found`.
