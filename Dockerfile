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

# Create logs directory
RUN mkdir -p logs

# Make script executable (before switching user, so permissions are set)
RUN chmod +x ./apply-migrations.sh && \
    ls -la ./apply-migrations.sh && \
    echo "--- Script content first 5 lines:" && \
    head -5 ./apply-migrations.sh

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Change ownership of entire /app directory (includes script)
RUN chown -R nodejs:nodejs /app

USER nodejs

# Verify script is accessible after user switch
RUN ls -la /app/apply-migrations.sh || echo "Script missing!" && \
    test -f /app/apply-migrations.sh && echo "Script exists!" || echo "Script NOT found!"

EXPOSE 3000

# Start command with migrations (use absolute path to script)
WORKDIR /app
CMD ["sh", "-c", "pwd && ls -la apply-migrations.sh && chmod +x apply-migrations.sh && /app/apply-migrations.sh && node /app/src/index.js"]

