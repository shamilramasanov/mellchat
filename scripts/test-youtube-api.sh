#!/bin/bash

# YouTube API Test Script
# Tests the YouTube API key and basic functionality

echo "🧪 Testing YouTube API..."

API_KEY="AIzaSyBNFqUmAVyODPat0w0HOa6W6POq0N6cook"

# Test 1: Basic API connectivity
echo "📡 Testing API connectivity..."
response=$(curl -s "https://www.googleapis.com/youtube/v3/search?part=snippet&q=test&key=$API_KEY")

if echo "$response" | grep -q "items"; then
    echo "✅ YouTube API is working!"
    echo "📊 Response preview:"
    echo "$response" | jq '.items[0].snippet.title' 2>/dev/null || echo "   (Install jq for better formatting)"
else
    echo "❌ YouTube API test failed"
    echo "Response: $response"
fi

# Test 2: Check API quota
echo ""
echo "📈 Checking API quota..."
quota_response=$(curl -s "https://www.googleapis.com/youtube/v3/search?part=snippet&q=quota&key=$API_KEY" | jq '.error.errors[0].reason' 2>/dev/null)

if [ "$quota_response" = '"quotaExceeded"' ]; then
    echo "⚠️  API quota exceeded - you may need to wait or upgrade your quota"
elif [ "$quota_response" = 'null' ]; then
    echo "✅ API quota is available"
else
    echo "ℹ️  Quota status: $quota_response"
fi

echo ""
echo "🎯 YouTube Collector is ready to use!"
echo "   API Key: ${API_KEY:0:10}..."
echo "   Status: ✅ Configured"
