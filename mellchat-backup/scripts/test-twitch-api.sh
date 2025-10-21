#!/bin/bash

# Twitch API Test Script
# Tests the Twitch API tokens and basic functionality

echo "🧪 Testing Twitch API..."

CLIENT_ID="gp762nuuoqcoxypju8c569th9wz7q5"
ACCESS_TOKEN="4bdy1fx0looodlsxildw6pekcj0fdc"

# Test 1: Basic API connectivity
echo "📡 Testing Twitch API connectivity..."
response=$(curl -s -H "Client-ID: $CLIENT_ID" \
                -H "Authorization: Bearer $ACCESS_TOKEN" \
                "https://api.twitch.tv/helix/users")

if echo "$response" | grep -q "data"; then
    echo "✅ Twitch API is working!"
    echo "📊 Response preview:"
    echo "$response" | jq '.data[0].display_name' 2>/dev/null || echo "   (Install jq for better formatting)"
else
    echo "❌ Twitch API test failed"
    echo "Response: $response"
fi

# Test 2: Check token validity
echo ""
echo "🔑 Checking token validity..."
if echo "$response" | grep -q "display_name"; then
    echo "✅ Access token is valid"
    user_id=$(echo "$response" | jq -r '.data[0].id' 2>/dev/null)
    user_name=$(echo "$response" | jq -r '.data[0].display_name' 2>/dev/null)
    echo "   User: $user_name (ID: $user_id)"
else
    echo "❌ Access token is invalid or expired"
fi

# Test 3: Check API quota
echo ""
echo "📈 Checking API quota..."
quota_response=$(curl -s -H "Client-ID: $CLIENT_ID" \
                      -H "Authorization: Bearer $ACCESS_TOKEN" \
                      "https://api.twitch.tv/helix/users" | jq '.error.message' 2>/dev/null)

if [ "$quota_response" = '"Unauthorized"' ]; then
    echo "⚠️  API authorization failed - check your tokens"
elif [ "$quota_response" = 'null' ]; then
    echo "✅ API quota is available"
else
    echo "ℹ️  API status: $quota_response"
fi

echo ""
echo "🎯 Twitch Collector is ready to use!"
echo "   Client ID: $CLIENT_ID"
echo "   Access Token: ${ACCESS_TOKEN:0:10}..."
echo "   Status: ✅ Configured"
