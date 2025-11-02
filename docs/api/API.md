# MellChat API Documentation

## Base URL
- **Development**: `http://localhost:3001/api/v1`
- **Production**: `https://your-domain.com/api/v1`

## Authentication
Most endpoints require authentication via JWT token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

## Rate Limiting
- **General API**: 100 requests per minute
- **Auth endpoints**: 10 requests per minute
- **Message endpoints**: 200 requests per minute
- **Search endpoints**: 50 requests per minute

## Response Format
All API responses follow this format:
```json
{
  "success": true|false,
  "data": {...},
  "message": "Optional message",
  "error": "Error message if success is false"
}
```

---

## Messages API

### Get Messages for Stream
```http
GET /messages/stream/:streamId
```

**Parameters:**
- `streamId` (path) - Stream identifier
- `limit` (query, optional) - Number of messages to return (default: 50)
- `offset` (query, optional) - Number of messages to skip (default: 0)
- `isQuestion` (query, optional) - Filter by questions only (true/false)

**Response:**
```json
{
  "success": true,
  "messages": [
    {
      "id": "msg-123",
      "stream_id": "twitch-dyrachyo",
      "platform": "twitch",
      "user_id": "user-456",
      "username": "viewer123",
      "content": "Hello everyone!",
      "created_at": "2024-01-01T12:00:00Z",
      "is_question": false
    }
  ],
  "total": 1,
  "hasMore": false
}
```

### Get Questions for Stream
```http
GET /messages/stream/:streamId/questions
```

**Parameters:**
- `streamId` (path) - Stream identifier
- `limit` (query, optional) - Number of questions to return (default: 50)
- `offset` (query, optional) - Number of questions to skip (default: 0)

**Response:**
```json
{
  "success": true,
  "questions": [
    {
      "id": "q-123",
      "message_id": "msg-456",
      "stream_id": "twitch-dyrachyo",
      "user_id": "user-789",
      "snippet": "How are you doing?",
      "created_at": "2024-01-01T12:00:00Z",
      "content": "How are you doing?",
      "username": "viewer456",
      "platform": "twitch"
    }
  ],
  "total": 1,
  "hasMore": false
}
```

### Get Stream Statistics
```http
GET /messages/stream/:streamId/stats
```

**Response:**
```json
{
  "success": true,
  "stats": {
    "totalMessages": 1500,
    "totalQuestions": 150,
    "questionPercentage": 10,
    "topQuestionAuthors": [
      {
        "username": "viewer123",
        "question_count": 25
      }
    ]
  }
}
```

### Bookmark Message
```http
POST /messages/:messageId/bookmark
```

**Body:**
```json
{
  "userId": "user-123"
}
```

**Response:**
```json
{
  "success": true,
  "bookmarked": true,
  "message": "Message bookmarked"
}
```

### Rate Message
```http
POST /messages/:messageId/rate
```

**Body:**
```json
{
  "userId": "user-123",
  "score": 1
}
```

**Parameters:**
- `score` - Rating score: 1 (like) or -1 (dislike)

**Response:**
```json
{
  "success": true,
  "rated": true,
  "message": "Message rated successfully"
}
```

---

## Database API

### Get Messages from Database
```http
GET /database/messages/:streamId
```

**Parameters:**
- `streamId` (path) - Stream identifier
- `limit` (query, optional) - Number of messages to return (default: 100)
- `offset` (query, optional) - Number of messages to skip (default: 0)

### Get Questions from Database
```http
GET /database/questions/:streamId
```

**Parameters:**
- `streamId` (path) - Stream identifier
- `limit` (query, optional) - Number of questions to return (default: 50)
- `offset` (query, optional) - Number of questions to skip (default: 0)

### Search Messages
```http
GET /database/search/:streamId
```

**Parameters:**
- `streamId` (path) - Stream identifier
- `q` (query, required) - Search query
- `limit` (query, optional) - Number of results to return (default: 50)
- `offset` (query, optional) - Number of results to skip (default: 0)

### Get Database Statistics
```http
GET /database/stats/:streamId
```

### Database Health Check
```http
GET /database/health
```

**Response:**
```json
{
  "success": true,
  "database": {
    "connected": true,
    "version": "PostgreSQL 13.7",
    "uptime": "2 days, 5 hours"
  }
}
```

---

## Adaptive Messages API

### Get Messages with Adaptive Strategy
```http
GET /adaptive/messages/:streamId
```

**Parameters:**
- `streamId` (path) - Stream identifier
- `userId` (query, optional) - User identifier (default: 'anonymous')
- `deviceType` (query, optional) - Device type: mobile, tablet, desktop (default: 'desktop')
- `sessionType` (query, optional) - Session type: normal, clean_start, archive (default: 'normal')

**Response:**
```json
{
  "success": true,
  "messages": [...],
  "strategy": {
    "strategy": "recent_messages",
    "deviceType": "mobile",
    "limit": 50
  },
  "session": {
    "id": 123,
    "user_id": "user-123",
    "stream_id": "twitch-dyrachyo",
    "last_seen_at": "2024-01-01T12:00:00Z",
    "session_type": "normal"
  },
  "hasMore": true,
  "count": 50
}
```

### Load More Messages
```http
GET /adaptive/messages/:streamId/more
```

**Parameters:**
- `streamId` (path) - Stream identifier
- `userId` (query, optional) - User identifier (default: 'anonymous')
- `deviceType` (query, optional) - Device type (default: 'desktop')
- `offset` (query, optional) - Number of messages to skip (default: 0)
- `limit` (query, optional) - Number of messages to return (default: 20)

### Update Last Seen Time
```http
POST /adaptive/sessions/:streamId/seen
```

**Body:**
```json
{
  "userId": "user-123"
}
```

### Create Clean Session
```http
POST /adaptive/sessions/:streamId/clean
```

**Body:**
```json
{
  "userId": "user-123",
  "deviceType": "desktop"
}
```

### Get Session Information
```http
GET /adaptive/sessions/:streamId
```

**Parameters:**
- `streamId` (path) - Stream identifier
- `userId` (query, optional) - User identifier (default: 'anonymous')

---

## Platform Integration APIs

### Twitch Integration
```http
GET /twitch/connect/:channel
POST /twitch/disconnect/:channel
```

### YouTube Integration
```http
GET /youtube/connect/:videoId
POST /youtube/disconnect/:videoId
```

### Kick Integration
```http
GET /kick/connect/:channel
POST /kick/disconnect/:channel
```

---

## Utility APIs

### Health Check
```http
GET /health
```

**Response:**
```json
{
  "success": true,
  "status": "healthy",
  "timestamp": "2024-01-01T12:00:00Z",
  "uptime": "2 days, 5 hours",
  "version": "2.0.0"
}
```

### Metrics (Prometheus)
```http
GET /metrics
```

Returns Prometheus-formatted metrics for monitoring.

---

## Error Codes

| Code | Description |
|------|-------------|
| 400 | Bad Request - Invalid parameters |
| 401 | Unauthorized - Invalid or missing token |
| 403 | Forbidden - Insufficient permissions |
| 404 | Not Found - Resource not found |
| 429 | Too Many Requests - Rate limit exceeded |
| 500 | Internal Server Error - Server error |

## WebSocket Events

### Connection
```javascript
const ws = new WebSocket('ws://localhost:3001');
```

### Events
- `message` - New chat message received
- `question` - New question detected
- `user_joined` - User joined the stream
- `user_left` - User left the stream
- `stream_started` - Stream started
- `stream_ended` - Stream ended

### Message Format
```json
{
  "type": "message",
  "data": {
    "id": "msg-123",
    "streamId": "twitch-dyrachyo",
    "username": "viewer123",
    "content": "Hello!",
    "platform": "twitch",
    "timestamp": "2024-01-01T12:00:00Z",
    "isQuestion": false
  }
}
```
