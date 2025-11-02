# Railway will use this Dockerfile if it can't find Root Directory setting
# This Dockerfile builds from backend/api-gateway directory

FROM node:18-alpine

WORKDIR /app

# Change to backend/api-gateway directory
WORKDIR /app/backend/api-gateway

# Copy package files
COPY backend/api-gateway/package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY backend/api-gateway/src/ ./src/

# Copy migration scripts
COPY backend/api-gateway/apply-migrations.sh ./
COPY backend/api-gateway/database/ ./database/
RUN chmod +x ./apply-migrations.sh

# Create logs directory
RUN mkdir -p logs

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

# Change ownership
RUN chown -R nodejs:nodejs /app

USER nodejs

EXPOSE 3000

# Use start script with migrations
CMD ["npm", "run", "start:with-migrations"]

