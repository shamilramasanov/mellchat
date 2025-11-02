FROM node:18-alpine

WORKDIR /app

# Copy package files first (for better caching)
COPY backend/api-gateway/package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY backend/api-gateway/src/ ./src/

# Copy migration scripts and database folder
COPY backend/api-gateway/apply-migrations.js ./apply-migrations.js
COPY backend/api-gateway/database/ ./database/

# Create logs directory
RUN mkdir -p logs

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 && \
    chown -R nodejs:nodejs /app

USER nodejs

EXPOSE 3001

# Start command with migrations (use Node.js script directly)
WORKDIR /app
CMD ["sh", "-c", "node /app/apply-migrations.js && node /app/src/index.js"]

