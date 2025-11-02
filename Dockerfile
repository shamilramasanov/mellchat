FROM node:18-alpine

WORKDIR /app

# Copy package files first (for better caching)
COPY backend/api-gateway/package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY backend/api-gateway/src/ ./src/

# Copy migration scripts and database folder
COPY backend/api-gateway/apply-migrations.sh ./apply-migrations.sh
COPY backend/api-gateway/database/ ./database/

# Make script executable (before switching user)
RUN chmod +x ./apply-migrations.sh && \
    ls -la ./apply-migrations.sh && \
    cat ./apply-migrations.sh | head -5

# Create logs directory
RUN mkdir -p logs

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 && \
    chown -R nodejs:nodejs /app

USER nodejs

EXPOSE 3000

# Start command with migrations (use sh to run the script)
CMD ["sh", "-c", "./apply-migrations.sh && node src/index.js"]

