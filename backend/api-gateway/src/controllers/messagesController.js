const { v4: uuidv4 } = require('uuid');
const postgresService = require('../services/postgresService');
const redisService = require('../services/redisService');
const categorizer = require('../services/categorizer');
const logger = require('../utils/logger');

class MessagesController {
  /**
   * Get messages with pagination and filtering
   */
  async getMessages(options) {
    const {
      page = 1,
      limit = 50,
      platform,
      category,
      channel,
    } = options;
    
    const offset = (page - 1) * limit;
    
    try {
      // Build query with filters
      let query = `
        SELECT 
          id, platform, channel, username, message, 
          timestamp, category, upvotes, created_at
        FROM messages 
        WHERE 1=1
      `;
      
      const queryParams = [];
      let paramIndex = 1;
      
      if (platform) {
        query += ` AND platform = $${paramIndex}`;
        queryParams.push(platform);
        paramIndex++;
      }
      
      if (category) {
        query += ` AND category = $${paramIndex}`;
        queryParams.push(category);
        paramIndex++;
      }
      
      if (channel) {
        query += ` AND channel = $${paramIndex}`;
        queryParams.push(channel);
        paramIndex++;
      }
      
      query += ` ORDER BY timestamp DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
      queryParams.push(limit, offset);
      
      // Get messages
      const messages = await postgresService.query(query, queryParams);
      
      // Get total count for pagination
      let countQuery = 'SELECT COUNT(*) FROM messages WHERE 1=1';
      const countParams = [];
      let countParamIndex = 1;
      
      if (platform) {
        countQuery += ` AND platform = $${countParamIndex}`;
        countParams.push(platform);
        countParamIndex++;
      }
      
      if (category) {
        countQuery += ` AND category = $${countParamIndex}`;
        countParams.push(category);
        countParamIndex++;
      }
      
      if (channel) {
        countQuery += ` AND channel = $${countParamIndex}`;
        countParams.push(channel);
        countParamIndex++;
      }
      
      const countResult = await postgresService.query(countQuery, countParams);
      const total = parseInt(countResult[0].count);
      
      return {
        messages,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      logger.error('Error getting messages:', error);
      throw error;
    }
  }
  
  /**
   * Get a specific message by ID
   */
  async getMessageById(id) {
    try {
      const query = `
        SELECT 
          id, platform, channel, username, message, 
          timestamp, category, upvotes, created_at
        FROM messages 
        WHERE id = $1
      `;
      
      const result = await postgresService.query(query, [id]);
      return result[0] || null;
    } catch (error) {
      logger.error('Error getting message by ID:', error);
      throw error;
    }
  }
  
  /**
   * Create a new message
   */
  async createMessage(messageData) {
    const {
      platform,
      channel,
      username,
      message,
      category = 'general',
    } = messageData;
    
    const id = uuidv4();
    const timestamp = new Date();
    
    try {
      // Auto-categorize if not provided
      const finalCategory = category === 'general' 
        ? await categorizer.categorizeMessage(message)
        : category;
      
      const query = `
        INSERT INTO messages (id, platform, channel, username, message, timestamp, category)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `;
      
      const result = await postgresService.query(query, [
        id,
        platform,
        channel,
        username,
        message,
        timestamp,
        finalCategory,
      ]);
      
      // Publish to Redis for real-time updates
      await redisService.publish('new_message', {
        type: 'new_message',
        data: result[0],
      });
      
      logger.info('Message created:', {
        messageId: id,
        platform,
        channel,
        username,
      });
      
      return result[0];
    } catch (error) {
      logger.error('Error creating message:', error);
      throw error;
    }
  }
  
  /**
   * Add upvote to a message
   */
  async upvoteMessage(messageId, user) {
    try {
      // Check if message exists
      const message = await this.getMessageById(messageId);
      if (!message) {
        throw new Error('Message not found');
      }
      
      // Check if user already upvoted
      const existingUpvote = await postgresService.query(
        'SELECT id FROM upvotes WHERE type = $1 AND item_id = $2 AND platform = $3 AND channel = $4',
        ['message', messageId, message.platform, message.channel]
      );
      
      if (existingUpvote.length > 0) {
        throw new Error('Already upvoted');
      }
      
      // Create upvote
      const upvoteId = uuidv4();
      await postgresService.query(
        'INSERT INTO upvotes (id, type, item_id, platform, channel) VALUES ($1, $2, $3, $4, $5)',
        [upvoteId, 'message', messageId, message.platform, message.channel]
      );
      
      // Update message upvote count
      await postgresService.query(
        'UPDATE messages SET upvotes = upvotes + 1 WHERE id = $1',
        [messageId]
      );
      
      // Publish upvote event
      await redisService.publish('message_upvoted', {
        type: 'message_upvoted',
        data: { messageId, upvotes: message.upvotes + 1 },
      });
      
      return {
        success: true,
        messageId,
        upvotes: message.upvotes + 1,
      };
    } catch (error) {
      logger.error('Error upvoting message:', error);
      throw error;
    }
  }
  
  /**
   * Remove upvote from a message
   */
  async removeUpvote(messageId, user) {
    try {
      // Check if message exists
      const message = await this.getMessageById(messageId);
      if (!message) {
        throw new Error('Message not found');
      }
      
      // Find and delete upvote
      const result = await postgresService.query(
        'DELETE FROM upvotes WHERE type = $1 AND item_id = $2 AND platform = $3 AND channel = $4 RETURNING id',
        ['message', messageId, message.platform, message.channel]
      );
      
      if (result.length === 0) {
        throw new Error('Upvote not found');
      }
      
      // Update message upvote count
      await postgresService.query(
        'UPDATE messages SET upvotes = GREATEST(upvotes - 1, 0) WHERE id = $1',
        [messageId]
      );
      
      // Publish upvote removal event
      await redisService.publish('message_upvote_removed', {
        type: 'message_upvote_removed',
        data: { messageId, upvotes: Math.max(message.upvotes - 1, 0) },
      });
      
      return {
        success: true,
        messageId,
        upvotes: Math.max(message.upvotes - 1, 0),
      };
    } catch (error) {
      logger.error('Error removing upvote from message:', error);
      throw error;
    }
  }
}

module.exports = new MessagesController();
