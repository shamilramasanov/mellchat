# Contributing to MellChat

## Getting Started

### Prerequisites
- Docker 20.10+
- Docker Compose 2.0+
- Node.js 18+ (для локальной разработки)
- Go 1.21+ (для коллекторов)
- Git

### Development Setup

1. **Fork и Clone репозитория**
```bash
git clone https://github.com/your-username/mellchat.git
cd mellchat
```

2. **Настройка окружения**
```bash
cp env.example .env
# Отредактируйте .env с вашими настройками
```

3. **Запуск сервисов**
```bash
docker-compose up -d
```

4. **Проверка работоспособности**
```bash
curl http://localhost:3000/api/v1/health
```

## Development Guidelines

### Code Style

#### Go (Collectors, WebSocket Proxy)
- Используйте `gofmt` для форматирования
- Следуйте стандартам Go: https://golang.org/doc/effective_go.html
- Используйте `golint` для проверки стиля
- Максимальная длина строки: 120 символов

```go
// Good
func (c *TwitchClient) GetMessages(channel string) ([]Message, error) {
    // implementation
}

// Bad
func (c *TwitchClient)GetMessages(channel string)([]Message,error){
    // implementation
}
```

#### Node.js (API Gateway, Sync Worker)
- Используйте ESLint с конфигурацией проекта
- Следуйте стандартам Airbnb JavaScript Style Guide
- Используйте Prettier для форматирования
- Максимальная длина строки: 100 символов

```javascript
// Good
const getMessages = async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const messages = await messageService.getMessages(page, limit);
    res.json({ messages, pagination: { page, limit } });
  } catch (error) {
    next(error);
  }
};

// Bad
const getMessages=async(req,res)=>{
try{
const {page=1,limit=50}=req.query;
const messages=await messageService.getMessages(page,limit);
res.json({messages,pagination:{page,limit}});
}catch(error){
next(error);
}
};
```

#### React (Frontend)
- Используйте функциональные компоненты с хуками
- Следуйте правилам React Hooks
- Используйте PropTypes или TypeScript для типизации
- Компоненты должны быть в отдельных файлах

```javascript
// Good
import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';

const MessageList = ({ messages, onMessageClick }) => {
  const [filteredMessages, setFilteredMessages] = useState(messages);

  useEffect(() => {
    setFilteredMessages(messages);
  }, [messages]);

  return (
    <div className="message-list">
      {filteredMessages.map(message => (
        <Message
          key={message.id}
          message={message}
          onClick={() => onMessageClick(message)}
        />
      ))}
    </div>
  );
};

MessageList.propTypes = {
  messages: PropTypes.arrayOf(PropTypes.object).isRequired,
  onMessageClick: PropTypes.func.isRequired,
};

// Bad
import React from 'react';

const MessageList = (props) => {
  return (
    <div>
      {props.messages.map(m => <div key={m.id}>{m.message}</div>)}
    </div>
  );
};
```

### Git Workflow

#### Branch Naming
- `feature/description` - новые функции
- `bugfix/description` - исправления багов
- `hotfix/description` - критические исправления
- `refactor/description` - рефакторинг кода
- `docs/description` - обновление документации

#### Commit Messages
Используйте Conventional Commits:

```
type(scope): description

[optional body]

[optional footer]
```

**Types:**
- `feat`: новая функция
- `fix`: исправление бага
- `docs`: изменения в документации
- `style`: форматирование кода
- `refactor`: рефакторинг
- `test`: добавление тестов
- `chore`: изменения в build процессе

**Examples:**
```
feat(api): add pagination to messages endpoint
fix(collector): handle twitch API rate limits
docs(api): update authentication examples
refactor(frontend): extract message component
```

#### Pull Request Process

1. **Создайте feature branch**
```bash
git checkout -b feature/new-feature
```

2. **Делайте коммиты**
```bash
git add .
git commit -m "feat(api): add new endpoint"
```

3. **Push в ваш fork**
```bash
git push origin feature/new-feature
```

4. **Создайте Pull Request**
- Заполните шаблон PR
- Добавьте описание изменений
- Укажите связанные issues
- Добавьте скриншоты для UI изменений

5. **Code Review**
- Дождитесь review от maintainers
- Исправьте замечания
- Обновите PR при необходимости

### Testing

#### Unit Tests
```bash
# Go tests
cd collectors/twitch
go test ./...

# Node.js tests
cd backend/api-gateway
npm test

# React tests
cd frontend/pwa
npm test
```

#### Integration Tests
```bash
# Run all integration tests
./scripts/test.sh
```

#### Test Coverage
- Минимум 80% покрытие для новых функций
- Используйте `jest --coverage` для Node.js
- Используйте `go test -cover` для Go

### Documentation

#### API Documentation
- Обновляйте `docs/API.md` при изменении API
- Используйте JSDoc для Node.js функций
- Используйте Go doc comments для Go функций

#### Code Comments
```go
// TwitchClient handles communication with Twitch API
type TwitchClient struct {
    clientID     string
    clientSecret string
    accessToken  string
}

// GetMessages retrieves messages from a specific channel
// Returns slice of Message structs and any error encountered
func (c *TwitchClient) GetMessages(channel string) ([]Message, error) {
    // implementation
}
```

```javascript
/**
 * Retrieves messages with pagination
 * @param {Object} options - Query options
 * @param {number} options.page - Page number (default: 1)
 * @param {number} options.limit - Items per page (default: 50)
 * @param {string} options.platform - Platform filter
 * @returns {Promise<Object>} Messages and pagination info
 */
const getMessages = async (options = {}) => {
  // implementation
};
```

### Performance Guidelines

#### Database Queries
- Используйте индексы для часто запрашиваемых полей
- Избегайте N+1 queries
- Используйте connection pooling

```sql
-- Good: используйте индексы
CREATE INDEX idx_messages_timestamp ON messages(timestamp);
CREATE INDEX idx_messages_platform_channel ON messages(platform, channel);

-- Bad: запросы без индексов
SELECT * FROM messages WHERE username = 'user' AND platform = 'twitch';
```

#### Caching
- Используйте Redis для кэширования частых запросов
- Устанавливайте разумные TTL для кэша
- Инвалидируйте кэш при обновлении данных

```javascript
// Good: кэширование с TTL
const getCachedMessages = async (channel) => {
  const cacheKey = `messages:${channel}`;
  let messages = await redis.get(cacheKey);
  
  if (!messages) {
    messages = await fetchMessagesFromDB(channel);
    await redis.setex(cacheKey, 300, JSON.stringify(messages)); // 5 min TTL
  }
  
  return JSON.parse(messages);
};
```

#### Memory Management
- Освобождайте ресурсы после использования
- Используйте streaming для больших данных
- Мониторьте использование памяти

### Security Guidelines

#### Input Validation
```javascript
// Good: валидация входных данных
const validateMessage = (message) => {
  const schema = Joi.object({
    platform: Joi.string().valid('twitch', 'youtube', 'kick').required(),
    channel: Joi.string().min(1).max(100).required(),
    username: Joi.string().min(1).max(100).required(),
    message: Joi.string().min(1).max(1000).required(),
  });
  
  return schema.validate(message);
};
```

#### Authentication
- Всегда проверяйте JWT токены
- Используйте HTTPS в production
- Не логируйте чувствительные данные

#### Error Handling
```javascript
// Good: безопасная обработка ошибок
const handleError = (error, req, res, next) => {
  logger.error('API Error:', {
    error: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
  });
  
  // Не раскрывайте внутренние детали
  res.status(500).json({
    error: 'Internal server error',
    requestId: req.id,
  });
};
```

### Debugging

#### Logging
```javascript
// Good: структурированное логирование
logger.info('Message processed', {
  messageId: message.id,
  platform: message.platform,
  channel: message.channel,
  processingTime: Date.now() - startTime,
});

// Bad: неструктурированное логирование
console.log('Message processed:', message);
```

#### Debug Tools
- Используйте `docker-compose logs` для просмотра логов
- Используйте `kubectl logs` для Kubernetes
- Используйте browser dev tools для фронтенда

### Release Process

#### Versioning
- Используйте Semantic Versioning (MAJOR.MINOR.PATCH)
- Обновляйте версии в package.json и go.mod
- Создавайте git tags для релизов

#### Changelog
- Ведите CHANGELOG.md
- Документируйте breaking changes
- Указывайте даты релизов

## Community Guidelines

### Code of Conduct
- Будьте уважительны к другим участникам
- Конструктивная критика приветствуется
- Помогайте новичкам

### Getting Help
- Используйте GitHub Issues для багов
- Используйте Discussions для вопросов
- Проверьте документацию перед обращением

### Recognition
- Contributors будут указаны в README
- Активные участники могут стать maintainers
- Специальные достижения отмечаются в релизах

## Resources

### Documentation
- [API Documentation](API.md)
- [Architecture Overview](ARCHITECTURE.md)
- [Deployment Guide](DEPLOYMENT.md)

### External Resources
- [Go Best Practices](https://golang.org/doc/effective_go.html)
- [Node.js Style Guide](https://github.com/airbnb/javascript)
- [React Best Practices](https://react.dev/learn)
- [Docker Best Practices](https://docs.docker.com/develop/dev-best-practices/)

### Tools
- [ESLint Configuration](../frontend/pwa/.eslintrc.js)
- [Prettier Configuration](../frontend/pwa/.prettierrc)
- [Go Lint Configuration](../collectors/twitch/.golangci.yml)
