const { v4: uuidv4 } = require('uuid');
const postgresService = require('../services/postgresService');
const redisService = require('../services/redisService');
const logger = require('../utils/logger');

class QuestionsController {
  /**
   * Get questions with pagination and filtering
   */
  async getQuestions(options) {
    const {
      page = 1,
      limit = 50,
      platform,
      answered,
      channel,
    } = options;
    
    const offset = (page - 1) * limit;
    
    try {
      // Build query with filters
      let query = `
        SELECT 
          id, platform, channel, username, question, 
          timestamp, answered, answered_at, upvotes, created_at
        FROM questions 
        WHERE 1=1
      `;
      
      const queryParams = [];
      let paramIndex = 1;
      
      if (platform) {
        query += ` AND platform = $${paramIndex}`;
        queryParams.push(platform);
        paramIndex++;
      }
      
      if (answered !== undefined) {
        query += ` AND answered = $${paramIndex}`;
        queryParams.push(answered);
        paramIndex++;
      }
      
      if (channel) {
        query += ` AND channel = $${paramIndex}`;
        queryParams.push(channel);
        paramIndex++;
      }
      
      query += ` ORDER BY timestamp DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
      queryParams.push(limit, offset);
      
      // Get questions
      const questions = await postgresService.query(query, queryParams);
      
      // Get total count for pagination
      let countQuery = 'SELECT COUNT(*) FROM questions WHERE 1=1';
      const countParams = [];
      let countParamIndex = 1;
      
      if (platform) {
        countQuery += ` AND platform = $${countParamIndex}`;
        countParams.push(platform);
        countParamIndex++;
      }
      
      if (answered !== undefined) {
        countQuery += ` AND answered = $${countParamIndex}`;
        countParams.push(answered);
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
        questions,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      logger.error('Error getting questions:', error);
      throw error;
    }
  }
  
  /**
   * Get a specific question by ID
   */
  async getQuestionById(id) {
    try {
      const query = `
        SELECT 
          id, platform, channel, username, question, 
          timestamp, answered, answered_at, upvotes, created_at
        FROM questions 
        WHERE id = $1
      `;
      
      const result = await postgresService.query(query, [id]);
      return result[0] || null;
    } catch (error) {
      logger.error('Error getting question by ID:', error);
      throw error;
    }
  }
  
  /**
   * Create a new question
   */
  async createQuestion(questionData) {
    const {
      platform,
      channel,
      username,
      question,
    } = questionData;
    
    const id = uuidv4();
    const timestamp = new Date();
    
    try {
      const query = `
        INSERT INTO questions (id, platform, channel, username, question, timestamp)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
      `;
      
      const result = await postgresService.query(query, [
        id,
        platform,
        channel,
        username,
        question,
        timestamp,
      ]);
      
      // Publish to Redis for real-time updates
      await redisService.publish('new_question', {
        type: 'new_question',
        data: result[0],
      });
      
      logger.info('Question created:', {
        questionId: id,
        platform,
        channel,
        username,
      });
      
      return result[0];
    } catch (error) {
      logger.error('Error creating question:', error);
      throw error;
    }
  }
  
  /**
   * Mark question as answered
   */
  async markAsAnswered(questionId) {
    try {
      const query = `
        UPDATE questions 
        SET answered = true, answered_at = NOW() 
        WHERE id = $1 
        RETURNING *
      `;
      
      const result = await postgresService.query(query, [questionId]);
      
      if (result.length === 0) {
        throw new Error('Question not found');
      }
      
      // Publish answer event
      await redisService.publish('question_answered', {
        type: 'question_answered',
        data: result[0],
      });
      
      logger.info('Question marked as answered:', {
        questionId,
        answeredAt: result[0].answered_at,
      });
      
      return {
        success: true,
        question: result[0],
      };
    } catch (error) {
      logger.error('Error marking question as answered:', error);
      throw error;
    }
  }
  
  /**
   * Add upvote to a question
   */
  async upvoteQuestion(questionId, user) {
    try {
      // Check if question exists
      const question = await this.getQuestionById(questionId);
      if (!question) {
        throw new Error('Question not found');
      }
      
      // Check if user already upvoted
      const existingUpvote = await postgresService.query(
        'SELECT id FROM upvotes WHERE type = $1 AND item_id = $2 AND platform = $3 AND channel = $4',
        ['question', questionId, question.platform, question.channel]
      );
      
      if (existingUpvote.length > 0) {
        throw new Error('Already upvoted');
      }
      
      // Create upvote
      const upvoteId = uuidv4();
      await postgresService.query(
        'INSERT INTO upvotes (id, type, item_id, platform, channel) VALUES ($1, $2, $3, $4, $5)',
        [upvoteId, 'question', questionId, question.platform, question.channel]
      );
      
      // Update question upvote count
      await postgresService.query(
        'UPDATE questions SET upvotes = upvotes + 1 WHERE id = $1',
        [questionId]
      );
      
      // Publish upvote event
      await redisService.publish('question_upvoted', {
        type: 'question_upvoted',
        data: { questionId, upvotes: question.upvotes + 1 },
      });
      
      return {
        success: true,
        questionId,
        upvotes: question.upvotes + 1,
      };
    } catch (error) {
      logger.error('Error upvoting question:', error);
      throw error;
    }
  }
  
  /**
   * Remove upvote from a question
   */
  async removeUpvote(questionId, user) {
    try {
      // Check if question exists
      const question = await this.getQuestionById(questionId);
      if (!question) {
        throw new Error('Question not found');
      }
      
      // Find and delete upvote
      const result = await postgresService.query(
        'DELETE FROM upvotes WHERE type = $1 AND item_id = $2 AND platform = $3 AND channel = $4 RETURNING id',
        ['question', questionId, question.platform, question.channel]
      );
      
      if (result.length === 0) {
        throw new Error('Upvote not found');
      }
      
      // Update question upvote count
      await postgresService.query(
        'UPDATE questions SET upvotes = GREATEST(upvotes - 1, 0) WHERE id = $1',
        [questionId]
      );
      
      // Publish upvote removal event
      await redisService.publish('question_upvote_removed', {
        type: 'question_upvote_removed',
        data: { questionId, upvotes: Math.max(question.upvotes - 1, 0) },
      });
      
      return {
        success: true,
        questionId,
        upvotes: Math.max(question.upvotes - 1, 0),
      };
    } catch (error) {
      logger.error('Error removing upvote from question:', error);
      throw error;
    }
  }
}

module.exports = new QuestionsController();
