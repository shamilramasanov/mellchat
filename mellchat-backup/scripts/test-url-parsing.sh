#!/bin/bash

# Test URL parsing for MellChat
echo "🧪 Testing URL parsing..."

# Test YouTube Live URL
TEST_URL="https://www.youtube.com/live/WY8sDvZdWEA?si=qgF8bzeMH0shuOP8"
echo "Testing URL: $TEST_URL"

# Extract video ID using regex
VIDEO_ID=$(echo "$TEST_URL" | grep -o 'youtube\.com/live/[^&?]*' | sed 's/youtube\.com\/live\///')
echo "Extracted Video ID: $VIDEO_ID"

if [ -n "$VIDEO_ID" ]; then
    echo "✅ YouTube Live URL parsing successful!"
    echo "   Platform: YouTube"
    echo "   Video ID: $VIDEO_ID"
else
    echo "❌ Failed to parse YouTube Live URL"
fi

echo ""
echo "📱 Now try this URL in MellChat:"
echo "   $TEST_URL"
echo ""
echo "💡 Open browser console (F12) to see debug logs when connecting"
