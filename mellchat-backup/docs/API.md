# MellChat API Documentation

## Overview
MellChat API предоставляет RESTful интерфейс для управления сообщениями, вопросами и статистикой чатов с различных платформ стриминга.

## Base URL
```
http://localhost:3000/api/v1
```

## Authentication
API использует JWT токены для аутентификации. Добавьте токен в заголовок:
```
Authorization: Bearer <your_jwt_token>
```

## Endpoints

### Messages

#### GET /messages
Получить список сообщений с пагинацией

**Query Parameters:**
- `page` (int): Номер страницы (default: 1)
- `limit` (int): Количество сообщений на странице (default: 50)
- `platform` (string): Фильтр по платформе (twitch, youtube, kick)
- `category` (string): Фильтр по категории

**Response:**
```json
{
  "messages": [
    {
      "id": "uuid",
      "platform": "twitch",
      "channel": "streamer_name",
      "username": "viewer_name",
      "message": "Hello world!",
      "timestamp": "2024-01-01T12:00:00Z",
      "category": "general",
      "upvotes": 5
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 1000,
    "pages": 20
  }
}
```

#### POST /messages
Создать новое сообщение (для тестирования)

**Request Body:**
```json
{
  "platform": "twitch",
  "channel": "streamer_name",
  "username": "viewer_name",
  "message": "Test message",
  "category": "general"
}
```

### Questions

#### GET /questions
Получить список вопросов

**Query Parameters:**
- `page` (int): Номер страницы
- `limit` (int): Количество вопросов на странице
- `platform` (string): Фильтр по платформе
- `answered` (boolean): Фильтр по статусу ответа

**Response:**
```json
{
  "questions": [
    {
      "id": "uuid",
      "platform": "twitch",
      "channel": "streamer_name",
      "username": "viewer_name",
      "question": "How do I install the game?",
      "timestamp": "2024-01-01T12:00:00Z",
      "answered": false,
      "upvotes": 10
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 100,
    "pages": 2
  }
}
```

#### POST /questions
Создать новый вопрос

**Request Body:**
```json
{
  "platform": "twitch",
  "channel": "streamer_name",
  "username": "viewer_name",
  "question": "How do I install the game?"
}
```

#### PUT /questions/:id/answer
Отметить вопрос как отвеченный

**Response:**
```json
{
  "success": true,
  "question": {
    "id": "uuid",
    "answered": true,
    "answered_at": "2024-01-01T12:30:00Z"
  }
}
```

### Upvotes

#### POST /upvotes
Добавить голос за сообщение или вопрос

**Request Body:**
```json
{
  "type": "message", // или "question"
  "item_id": "uuid",
  "platform": "twitch",
  "channel": "streamer_name"
}
```

#### DELETE /upvotes/:id
Убрать голос

### Health Check

#### GET /health
Проверка состояния API

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T12:00:00Z",
  "services": {
    "postgres": "connected",
    "redis": "connected"
  }
}
```

## Error Responses

Все ошибки возвращаются в следующем формате:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": {
      "field": "username",
      "reason": "required"
    }
  }
}
```

### Error Codes
- `VALIDATION_ERROR`: Ошибка валидации данных
- `NOT_FOUND`: Ресурс не найден
- `UNAUTHORIZED`: Не авторизован
- `FORBIDDEN`: Доступ запрещен
- `RATE_LIMIT_EXCEEDED`: Превышен лимит запросов
- `INTERNAL_ERROR`: Внутренняя ошибка сервера

## Rate Limiting
API имеет ограничение на количество запросов:
- 100 запросов в 15 минут на IP
- Заголовки ответа содержат информацию о лимитах:
  - `X-RateLimit-Limit`: Максимальное количество запросов
  - `X-RateLimit-Remaining`: Оставшиеся запросы
  - `X-RateLimit-Reset`: Время сброса лимита

## WebSocket Events

### Connection
```
ws://localhost:8080/ws?token=<jwt_token>
```

### Events

#### new_message
```json
{
  "type": "new_message",
  "data": {
    "id": "uuid",
    "platform": "twitch",
    "channel": "streamer_name",
    "username": "viewer_name",
    "message": "Hello!",
    "timestamp": "2024-01-01T12:00:00Z",
    "category": "general"
  }
}
```

#### new_question
```json
{
  "type": "new_question",
  "data": {
    "id": "uuid",
    "platform": "twitch",
    "channel": "streamer_name",
    "username": "viewer_name",
    "question": "How do I install?",
    "timestamp": "2024-01-01T12:00:00Z"
  }
}
```

#### question_answered
```json
{
  "type": "question_answered",
  "data": {
    "id": "uuid",
    "answered": true,
    "answered_at": "2024-01-01T12:30:00Z"
  }
}
```
