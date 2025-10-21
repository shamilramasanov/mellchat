# MellChat Architecture

## System Overview

MellChat - это система для агрегации и анализа сообщений чата с различных платформ стриминга (Twitch, YouTube, Kick). Система построена на микросервисной архитектуре с использованием современных технологий.

## High-Level Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Twitch        │    │   YouTube       │    │   Kick          │
│   Collector     │    │   Collector     │    │   Collector     │
└─────────┬───────┘    └─────────┬───────┘    └─────────┬───────┘
          │                      │                      │
          └──────────────────────┼──────────────────────┘
                                 │
                    ┌─────────────▼─────────────┐
                    │        Redis              │
                    │    (Message Queue)        │
                    └─────────────┬─────────────┘
                                 │
                    ┌─────────────▼─────────────┐
                    │     Sync Worker          │
                    │  (Redis → PostgreSQL)    │
                    └─────────────┬─────────────┘
                                 │
                    ┌─────────────▼─────────────┐
                    │      PostgreSQL           │
                    │    (Persistent Storage)   │
                    └─────────────┬─────────────┘
                                 │
          ┌──────────────────────┼──────────────────────┐
          │                      │                      │
┌─────────▼───────┐    ┌─────────▼───────┐    ┌─────────▼───────┐
│  API Gateway    │    │ WebSocket Proxy │    │   Frontend      │
│  (REST API)     │    │ (Real-time)     │    │   (PWA)         │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Component Details

### 1. Collectors (Go)

#### Purpose
Сбор сообщений и вопросов с платформ стриминга в реальном времени.

#### Architecture
- **Language**: Go
- **Pattern**: Event-driven
- **Communication**: Redis Pub/Sub

#### Components
- **Client**: HTTP/WebSocket клиенты для каждой платформы
- **Parser**: Парсинг и нормализация сообщений
- **Categorizer**: Автоматическая категоризация сообщений
- **Publisher**: Отправка в Redis

#### Data Flow
```
Platform API → Client → Parser → Categorizer → Redis Pub/Sub
```

### 2. Message Queue (Redis)

#### Purpose
Буферизация сообщений между коллекторами и обработчиками.

#### Configuration
- **Mode**: Cluster (для масштабирования)
- **Persistence**: RDB + AOF
- **Memory**: 2GB+ для production

#### Channels
- `messages:twitch` - сообщения с Twitch
- `messages:youtube` - сообщения с YouTube
- `messages:kick` - сообщения с Kick
- `questions:*` - вопросы с всех платформ

### 3. Sync Worker (Node.js)

#### Purpose
Синхронизация данных из Redis в PostgreSQL для персистентного хранения.

#### Architecture
- **Pattern**: Background worker
- **Batch Processing**: Группировка сообщений для эффективности
- **Error Handling**: Retry mechanism с exponential backoff

#### Process Flow
```
Redis → Batch Collection → Validation → PostgreSQL → Cleanup
```

### 4. API Gateway (Node.js)

#### Purpose
Предоставление REST API для фронтенда и внешних клиентов.

#### Architecture
- **Framework**: Express.js
- **Pattern**: MVC
- **Authentication**: JWT tokens
- **Rate Limiting**: Redis-based

#### Layers
- **Routes**: HTTP endpoints
- **Controllers**: Business logic
- **Services**: Data access layer
- **Middleware**: Auth, validation, error handling

### 5. WebSocket Proxy (Go)

#### Purpose
Реальное время обновления для фронтенда через WebSocket соединения.

#### Architecture
- **Pattern**: Hub-based WebSocket server
- **Scaling**: Horizontal scaling с Redis pub/sub
- **Authentication**: JWT validation

#### Features
- Connection management
- Message broadcasting
- Client authentication
- Graceful shutdown

### 6. Frontend (React PWA)

#### Purpose
Пользовательский интерфейс для просмотра и управления сообщениями.

#### Architecture
- **Framework**: React 18
- **Pattern**: Component-based
- **State Management**: Context API + useReducer
- **PWA**: Service Worker, offline support

#### Components
- **Header**: Навигация и настройки
- **QuestionsPanel**: Список вопросов
- **ChatPanel**: Поток сообщений
- **ConnectionPanel**: Статус подключений
- **Stats**: Статистика и аналитика

## Data Models

### Message
```go
type Message struct {
    ID        string    `json:"id"`
    Platform  string    `json:"platform"`
    Channel   string    `json:"channel"`
    Username  string    `json:"username"`
    Message   string    `json:"message"`
    Timestamp time.Time `json:"timestamp"`
    Category  string    `json:"category"`
    Upvotes   int       `json:"upvotes"`
}
```

### Question
```go
type Question struct {
    ID         string     `json:"id"`
    Platform   string     `json:"platform"`
    Channel    string     `json:"channel"`
    Username   string     `json:"username"`
    Question   string     `json:"question"`
    Timestamp  time.Time  `json:"timestamp"`
    Answered   bool       `json:"answered"`
    AnsweredAt *time.Time `json:"answered_at,omitempty"`
    Upvotes    int        `json:"upvotes"`
}
```

## Database Schema

### PostgreSQL Tables

#### messages
```sql
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    platform VARCHAR(20) NOT NULL,
    channel VARCHAR(100) NOT NULL,
    username VARCHAR(100) NOT NULL,
    message TEXT NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    category VARCHAR(50) DEFAULT 'general',
    upvotes INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### questions
```sql
CREATE TABLE questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    platform VARCHAR(20) NOT NULL,
    channel VARCHAR(100) NOT NULL,
    username VARCHAR(100) NOT NULL,
    question TEXT NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    answered BOOLEAN DEFAULT FALSE,
    answered_at TIMESTAMP WITH TIME ZONE,
    upvotes INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### upvotes
```sql
CREATE TABLE upvotes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type VARCHAR(20) NOT NULL, -- 'message' or 'question'
    item_id UUID NOT NULL,
    platform VARCHAR(20) NOT NULL,
    channel VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Communication Patterns

### 1. Event-Driven Architecture
- Collectors публикуют события в Redis
- Sync Worker подписывается на события
- WebSocket Proxy транслирует события клиентам

### 2. Request-Response
- API Gateway обрабатывает HTTP запросы
- Синхронное взаимодействие с базой данных

### 3. Pub/Sub
- Redis используется как message broker
- Decoupled communication между сервисами

## Scalability Considerations

### Horizontal Scaling
- **Collectors**: Множественные инстансы для каждой платформы
- **API Gateway**: Load balancer + multiple instances
- **WebSocket Proxy**: Cluster mode с Redis pub/sub
- **Sync Worker**: Multiple workers с message partitioning

### Vertical Scaling
- **Redis**: Увеличение памяти для кэширования
- **PostgreSQL**: Read replicas для запросов
- **Monitoring**: Prometheus + Grafana для метрик

### Caching Strategy
- **Redis**: Hot data caching
- **Application**: In-memory caching для частых запросов
- **CDN**: Static assets для фронтенда

## Security Architecture

### Authentication & Authorization
- **JWT Tokens**: Stateless authentication
- **Role-based Access**: Different permission levels
- **API Keys**: For external integrations

### Data Protection
- **Encryption**: TLS для всех соединений
- **Input Validation**: Sanitization всех пользовательских данных
- **Rate Limiting**: Protection от DDoS атак

### Infrastructure Security
- **Container Security**: Non-root users, minimal images
- **Network Security**: Private networks, firewall rules
- **Secrets Management**: Environment variables, secret rotation

## Monitoring & Observability

### Metrics
- **Application Metrics**: Request rates, response times, error rates
- **Infrastructure Metrics**: CPU, memory, disk usage
- **Business Metrics**: Message counts, user activity

### Logging
- **Structured Logging**: JSON format для всех сервисов
- **Log Aggregation**: Centralized logging system
- **Log Levels**: DEBUG, INFO, WARN, ERROR

### Tracing
- **Distributed Tracing**: Request flow across services
- **Performance Monitoring**: Bottleneck identification
- **Error Tracking**: Exception monitoring

## Technology Stack

### Backend
- **Go**: Collectors, WebSocket Proxy
- **Node.js**: API Gateway, Sync Worker
- **PostgreSQL**: Primary database
- **Redis**: Message queue, caching

### Frontend
- **React**: UI framework
- **PWA**: Progressive Web App features
- **WebSocket**: Real-time communication

### Infrastructure
- **Docker**: Containerization
- **Docker Compose**: Local development
- **Kubernetes**: Production orchestration
- **Terraform**: Infrastructure as Code

### Monitoring
- **Prometheus**: Metrics collection
- **Grafana**: Visualization
- **AlertManager**: Alerting

## Development Workflow

### Local Development
1. `docker-compose up` - Start all services
2. Develop features in respective services
3. Run tests: `npm test` / `go test`
4. Commit changes with conventional commits

### CI/CD Pipeline
1. **Build**: Docker images for all services
2. **Test**: Unit tests, integration tests
3. **Security**: Vulnerability scanning
4. **Deploy**: Rolling deployment to staging/production

### Code Organization
- **Monorepo**: Single repository для всех сервисов
- **Shared Libraries**: Common utilities и models
- **API Versioning**: Semantic versioning для API changes
- **Documentation**: Auto-generated API docs
