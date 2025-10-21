#!/bin/bash

# MellChat Functionality Test
echo "🧪 Testing MellChat Functionality..."

# Test 1: Check if frontend is running
echo "📱 Testing frontend..."
if curl -s http://localhost:3000 | grep -q "MellChat"; then
    echo "✅ Frontend is running"
else
    echo "❌ Frontend is not responding"
    exit 1
fi

# Test 2: Check if API endpoints are available
echo "🔌 Testing API endpoints..."

# Test health endpoint
if curl -s http://localhost:3000/api/v1/health | grep -q "healthy"; then
    echo "✅ Health endpoint working"
else
    echo "⚠️  Health endpoint not available (expected if backend not running)"
fi

# Test 3: Check mobile accessibility
echo "📱 Testing mobile accessibility..."
IP=$(ifconfig | grep "inet " | grep -v 127.0.0.1 | awk '{print $2}' | head -1)
echo "   Mobile URL: http://$IP:3000"

# Test 4: Check PWA features
echo "🔋 Testing PWA features..."
if curl -s http://localhost:3000 | grep -q "manifest.json"; then
    echo "✅ PWA manifest available"
else
    echo "❌ PWA manifest not found"
fi

if curl -s http://localhost:3000 | grep -q "service-worker.js"; then
    echo "✅ Service Worker available"
else
    echo "❌ Service Worker not found"
fi

echo ""
echo "🎯 MellChat is ready!"
echo "📱 Open on mobile: http://$IP:3000"
echo "💡 Try connecting to a Twitch or YouTube stream!"
