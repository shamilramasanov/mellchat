FROM node:18-alpine

WORKDIR /app

# Копируем package.json и устанавливаем зависимости
COPY backend/api-gateway/package*.json ./
RUN npm ci --only=production

# Копируем исходный код
COPY backend/api-gateway/src ./src
COPY backend/api-gateway/apply-migrations.js ./
COPY backend/api-gateway/database ./database

# Создаем директории для логов и логирования
RUN mkdir -p logs

# Добавляем пользователя для безопасности
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 && \
    chown -R nodejs:nodejs /app

USER nodejs

EXPOSE 3001

# Запускаем миграции, затем сервер
CMD ["npm", "run", "start:with-migrations"]

