#!/bin/bash

# MellChat Setup Script
# This script sets up the development environment for MellChat

set -e

echo "🚀 Setting up MellChat development environment..."

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Copy environment file
if [ ! -f .env ]; then
    echo "📝 Creating .env file from template..."
    cp env.example .env
    echo "⚠️  Please edit .env file with your API keys and configuration"
fi

# Create logs directories
echo "📁 Creating log directories..."
mkdir -p logs/{api,collectors,workers}

# Set permissions
echo "🔐 Setting permissions..."
chmod +x scripts/*.sh

# Build and start services
echo "🏗️  Building Docker images..."
docker-compose build

echo "🚀 Starting services..."
docker-compose up -d

# Wait for services to be ready
echo "⏳ Waiting for services to be ready..."
sleep 10

# Check health
echo "🔍 Checking service health..."
if curl -f http://localhost:3000/api/v1/health > /dev/null 2>&1; then
    echo "✅ API Gateway is healthy"
else
    echo "❌ API Gateway is not responding"
fi

echo "🎉 Setup complete!"
echo ""
echo "📋 Next steps:"
echo "1. Edit .env file with your API keys"
echo "2. Visit http://localhost:3001 for the frontend"
echo "3. Visit http://localhost:3000/api/v1/health for API health check"
echo "4. Visit http://localhost:3002 for Grafana monitoring (admin/admin)"
echo ""
echo "📚 Documentation:"
echo "- API docs: docs/API.md"
echo "- Architecture: docs/ARCHITECTURE.md"
echo "- Deployment: docs/DEPLOYMENT.md"
echo "- Contributing: docs/CONTRIBUTING.md"
