const express = require('express');
const router = express.Router();
const logger = require('../utils/logger');

// YouTube Data API integration
const { google } = require('googleapis');

// Initialize YouTube API
const youtube = google.youtube({
  version: 'v3',
  auth: process.env.YOUTUBE_API_KEY
});

// Store active connections
const activeConnections = new Map();

// Connect to YouTube Live chat
router.post('/youtube', async (req, res) => {
  try {
    const { videoId } = req.body;
    
    if (!videoId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Video ID is required' 
      });
    }

    logger.info(`Connecting to YouTube Live chat: ${videoId}`);

    // Get video details to verify it's a live stream
    const videoResponse = await youtube.videos.list({
      part: 'snippet,liveStreamingDetails',
      id: videoId
    });

    if (!videoResponse.data.items || videoResponse.data.items.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Video not found or not accessible'
      });
    }

    const video = videoResponse.data.items[0];
    
    // Check if it's a live stream
    if (!video.liveStreamingDetails) {
      return res.status(400).json({
        success: false,
        message: 'This video is not a live stream'
      });
    }

    // Get live chat ID
    const liveChatId = video.liveStreamingDetails.activeLiveChatId;
    
    if (!liveChatId) {
      return res.status(400).json({
        success: false,
        message: 'Live chat is not available for this stream'
      });
    }

    // Store connection
    const connectionId = `youtube-${videoId}-${Date.now()}`;
    activeConnections.set(connectionId, {
      platform: 'youtube',
      videoId,
      liveChatId,
      title: video.snippet.title,
      channelTitle: video.snippet.channelTitle,
      connectedAt: new Date(),
      lastMessageId: null
    });

    logger.info(`YouTube Live chat connected: ${connectionId}`);

    // Start polling for messages
    startYouTubeChatPolling(connectionId);

    res.json({
      success: true,
      connectionId,
      message: `Connected to YouTube Live chat: ${video.snippet.title}`,
      data: {
        videoId,
        title: video.snippet.title,
        channelTitle: video.snippet.channelTitle,
        liveChatId
      }
    });

  } catch (error) {
    logger.error('YouTube connection error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to connect to YouTube Live chat',
      error: error.message
    });
  }
});

// Start polling YouTube Live chat for messages
async function startYouTubeChatPolling(connectionId) {
  const connection = activeConnections.get(connectionId);
  if (!connection) return;

  try {
    // Get messages from live chat
    const response = await youtube.liveChatMessages.list({
      liveChatId: connection.liveChatId,
      part: 'snippet,authorDetails',
      maxResults: 50,
      pageToken: connection.lastMessageId
    });

    if (response.data.items && response.data.items.length > 0) {
      const messages = response.data.items.map(item => ({
        id: item.id,
        username: item.authorDetails.displayName,
        message: item.snippet.displayMessage,
        timestamp: new Date(item.snippet.publishedAt),
        platform: 'youtube',
        connectionId
      }));

      // Store messages in connection
      connection.messages = [...(connection.messages || []), ...messages];
      connection.messages = connection.messages.slice(-100); // Keep last 100 messages
      
      logger.info(`Received ${messages.length} messages from YouTube chat`);
      
      // Update last message ID
      connection.lastMessageId = response.data.nextPageToken;
    }

    // Schedule next poll
    setTimeout(() => {
      startYouTubeChatPolling(connectionId);
    }, 5000); // Poll every 5 seconds

  } catch (error) {
    logger.error('YouTube chat polling error:', error);
    
    // Retry after delay
    setTimeout(() => {
      startYouTubeChatPolling(connectionId);
    }, 10000); // Retry after 10 seconds
  }
}

// Disconnect from YouTube Live chat
router.delete('/youtube/:connectionId', (req, res) => {
  const { connectionId } = req.params;
  
  if (activeConnections.has(connectionId)) {
    activeConnections.delete(connectionId);
    logger.info(`YouTube connection disconnected: ${connectionId}`);
    
    res.json({
      success: true,
      message: 'Disconnected from YouTube Live chat'
    });
  } else {
    res.status(404).json({
      success: false,
      message: 'Connection not found'
    });
  }
});

// Get messages for a specific connection
router.get('/messages/:connectionId', (req, res) => {
  const { connectionId } = req.params;
  
  const connection = activeConnections.get(connectionId);
  if (!connection) {
    return res.status(404).json({
      success: false,
      message: 'Connection not found'
    });
  }

  // Return cached messages (in real app, this would be from database)
  res.json({
    success: true,
    messages: connection.messages || [],
    connectionId
  });
});

// Get active connections
router.get('/active', (req, res) => {
  const connections = Array.from(activeConnections.entries()).map(([id, data]) => ({
    id,
    ...data
  }));

  res.json({
    success: true,
    connections
  });
});

module.exports = router;
