FROM node:18-alpine

WORKDIR /app

# Copy package files from backend/api-gateway
COPY backend/api-gateway/package*.json ./

# Install dependencies
RUN npm install --omit=dev

# Copy source code from backend/api-gateway
COPY backend/api-gateway/ .

# Expose port
EXPOSE 3001

# Start the application
CMD ["npm", "start"]
