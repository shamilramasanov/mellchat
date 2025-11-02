FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY src/ ./src/

# Copy migration scripts
COPY apply-migrations.sh ./
COPY apply-migrations.js ./
COPY database/ ./database/
RUN chmod +x ./apply-migrations.sh

# Create logs directory
RUN mkdir -p logs

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

# Change ownership
RUN chown -R nodejs:nodejs /app

USER nodejs

EXPOSE 3001

# Use start script with migrations
CMD ["npm", "run", "start:with-migrations"]
