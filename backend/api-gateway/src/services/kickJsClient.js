const { createClient } = require('@retconned/kick-js');
const logger = require('../utils/logger');

class KickJsClient {
  constructor({ channelName, onMessage }) {
    this.channelName = channelName;
    this.onMessage = onMessage;
    this.client = null;
    this.isConnected = false;
  }

  async connect() {
    try {
      logger.info(`🔌 Connecting to Kick channel: ${this.channelName}`);
      
      // Create client - try without readOnly first
      this.client = createClient(this.channelName, { 
        logger: true // Enable logging to see what's happening
      });

      // Set up event listeners
      this.client.on('ready', () => {
        logger.info(`✅ Kick client ready for channel: ${this.channelName}`);
        this.isConnected = true;
      });

      this.client.on('ChatMessage', (message) => {
        try {
          const normalizedMessage = {
            id: message.id || `kick-${Date.now()}-${Math.random().toString(36).slice(2,8)}`,
            username: message.sender?.username || 'Anonymous',
            text: message.content || '',
            timestamp: new Date(message.created_at || Date.now()).getTime(),
            platform: 'kick',
            color: this.generateColor(message.sender?.username || 'Anonymous'),
            reactions: { like: 0, dislike: 0 },
            isBookmarked: false,
            userReaction: null
          };

          logger.info(`💬 Kick message: ${normalizedMessage.username}: ${normalizedMessage.text}`);
          
          if (this.onMessage) {
            this.onMessage(normalizedMessage);
          }
        } catch (error) {
          logger.error('Error processing Kick message:', error);
        }
      });

      this.client.on('error', (error) => {
        logger.error(`❌ Kick client error for ${this.channelName}:`, error);
        this.isConnected = false;
      });

      this.client.on('disconnect', () => {
        logger.warn(`🔌 Kick client disconnected from ${this.channelName}`);
        this.isConnected = false;
      });

      // Connect to the channel
      logger.info(`🔌 Attempting to connect kick-js client to ${this.channelName}...`);
      await this.client.connect();
      
      logger.info(`🎯 Kick client connected to ${this.channelName}`);
      return true;
      
    } catch (error) {
      logger.error(`❌ Failed to connect Kick client to ${this.channelName}:`, error);
      this.isConnected = false;
      return false;
    }
  }

  disconnect() {
    try {
      if (this.client) {
        this.client.disconnect();
        this.isConnected = false;
        logger.info(`🔌 Kick client disconnected from ${this.channelName}`);
      }
    } catch (error) {
      logger.error(`❌ Error disconnecting Kick client:`, error);
    }
  }

  generateColor(username) {
    // Generate a consistent color for the username
    let hash = 0;
    for (let i = 0; i < username.length; i++) {
      hash = username.charCodeAt(i) + ((hash << 5) - hash);
    }
    const hue = Math.abs(hash) % 360;
    return `hsl(${hue}, 70%, 60%)`;
  }

  isChannelConnected() {
    return this.isConnected;
  }
}

module.exports = KickJsClient;
