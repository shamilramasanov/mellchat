const WebSocket = require('ws');
const logger = require('../utils/logger');

class KickSimpleClient {
  constructor({ channelName, onMessage }) {
    this.channelName = channelName;
    this.onMessage = onMessage;
    this.ws = null;
    this.isConnected = false;
    this.chatroomId = null;
  }

  async connect() {
    try {
      logger.info(`🔌 Connecting to Kick channel: ${this.channelName}`);
      
      // First, try to get chatroom ID from Kick API
      await this.fetchChatroomId();
      
      if (!this.chatroomId) {
        logger.warn(`⚠️ Could not get chatroom ID for ${this.channelName}, using fallback`);
        this.chatroomId = 4598; // Fallback ID from the example
      }
      
      // Use actual Pusher app key from environment
      const pusherAppKey = process.env.KICK_PUSHER_APP_KEY || '32cbd69e4b950bf97679';
      const pusherCluster = process.env.KICK_PUSHER_CLUSTER || 'us2';
      
      // Create WebSocket connection using actual Kick Pusher keys
      this.ws = new WebSocket(
        `wss://ws-${pusherCluster}.pusher.com/app/${pusherAppKey}?protocol=7&client=js&version=7.6.0&flash=false`
      );

      this.ws.on('open', () => {
        logger.info(`✅ Kick WebSocket connected for ${this.channelName} (chatroom: ${this.chatroomId})`);
        
        // Subscribe to the chatroom
        this.ws.send(JSON.stringify({
          event: "pusher:subscribe",
          data: { 
            auth: "", 
            channel: `chatrooms.${this.chatroomId}.v2` 
          }
        }));
        
        this.isConnected = true;
      });

      this.ws.on('message', (data) => {
        try {
          const dataString = data.toString();
          const jsonData = JSON.parse(dataString);
          
          if (jsonData.data) {
            const jsonDataSub = JSON.parse(jsonData.data);
            
            // Check if this is a chat message
            if (jsonDataSub.sender && jsonDataSub.content) {
              const normalizedMessage = {
                id: jsonDataSub.id || `kick-${Date.now()}-${Math.random().toString(36).slice(2,8)}`,
                username: jsonDataSub.sender.username || 'Anonymous',
                text: jsonDataSub.content || '',
                timestamp: new Date(jsonDataSub.created_at || Date.now()),
                platform: 'kick',
                color: this.generateColor(jsonDataSub.sender.username || 'Anonymous'),
                reactions: { like: 0, dislike: 0 },
                isBookmarked: false,
                userReaction: null
              };

              logger.info(`💬 Kick message: ${normalizedMessage.username}: ${normalizedMessage.text}`);
              
              if (this.onMessage) {
                this.onMessage(normalizedMessage);
              }
            }
          }
        } catch (error) {
          // Ignore parsing errors for non-message events
          logger.debug(`Kick WebSocket message parsing error: ${error.message}`);
        }
      });

      this.ws.on('error', (error) => {
        logger.error(`❌ Kick WebSocket error for ${this.channelName}:`, error);
        this.isConnected = false;
      });

      this.ws.on('close', () => {
        logger.warn(`🔌 Kick WebSocket closed for ${this.channelName}`);
        this.isConnected = false;
      });

      return true;
      
    } catch (error) {
      logger.error(`❌ Failed to connect Kick client to ${this.channelName}:`, error);
      this.isConnected = false;
      return false;
    }
  }

  async fetchChatroomId() {
    try {
      // Try to get chatroom ID from Kick API
      const response = await fetch(`https://kick.com/api/v2/channels/${this.channelName}`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        this.chatroomId = data.chatroom?.id || data.id;
        logger.info(`📡 Got chatroom ID ${this.chatroomId} for ${this.channelName}`);
      } else {
        logger.warn(`⚠️ Kick API blocked for ${this.channelName}, using fallback`);
      }
    } catch (error) {
      logger.warn(`⚠️ Failed to fetch chatroom ID for ${this.channelName}: ${error.message}`);
    }
  }

  disconnect() {
    try {
      if (this.ws) {
        this.ws.close();
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

module.exports = KickSimpleClient;
