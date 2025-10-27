// backend/api-gateway/src/routes/messages.js
const express = require('express');
const { Pool } = require('pg');
const logger = require('../utils/logger');

const router = express.Router();

// PostgreSQL connection
const pool = new Pool({
  user: 'apple',
  host: 'localhost',
  database: 'mellchat',
  password: '', // No password for local development
  port: 5432,
});

// GET /api/messages/stream/:streamId - получить сообщения стрима
router.get('/stream/:streamId', async (req, res) => {
  try {
    const { streamId } = req.params;
    const { limit = 50, offset = 0, isQuestion } = req.query;
    
    let query = `
      SELECT id, stream_id, platform, user_id, username, text, 
             created_at, is_question
      FROM messages 
      WHERE stream_id = $1 AND is_deleted = false
    `;
    
    const params = [streamId];
    
    // Фильтр по вопросам
    if (isQuestion === 'true') {
      query += ' AND is_question = true';
    }
    
    query += ' ORDER BY created_at DESC LIMIT $2 OFFSET $3';
    params.push(parseInt(limit), parseInt(offset));
    
    const result = await pool.query(query, params);
    
    res.json({
      success: true,
      messages: result.rows.reverse(), // Обращаем порядок для хронологического отображения
      total: result.rows.length,
      hasMore: result.rows.length === parseInt(limit)
    });
    
  } catch (error) {
    logger.error('Error fetching messages:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch messages'
    });
  }
});

// GET /api/messages/stream/:streamId/questions - получить только вопросы
router.get('/stream/:streamId/questions', async (req, res) => {
  try {
    const { streamId } = req.params;
    const { limit = 50, offset = 0 } = req.query;
    
    const query = `
      SELECT q.id, q.message_id, q.stream_id, q.user_id, q.snippet, 
             q.created_at, m.text, m.username, m.platform
      FROM questions q
      JOIN messages m ON m.id = q.message_id
      WHERE q.stream_id = $1
      ORDER BY q.created_at DESC
      LIMIT $2 OFFSET $3
    `;
    
    const result = await pool.query(query, [streamId, parseInt(limit), parseInt(offset)]);
    
    res.json({
      success: true,
      questions: result.rows.reverse(),
      total: result.rows.length,
      hasMore: result.rows.length === parseInt(limit)
    });
    
  } catch (error) {
    logger.error('Error fetching questions:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch questions'
    });
  }
});

// GET /api/messages/stream/:streamId/stats - статистика стрима
router.get('/stream/:streamId/stats', async (req, res) => {
  try {
    const { streamId } = req.params;
    
    // Общая статистика
    const totalMessages = await pool.query(
      'SELECT COUNT(*) as count FROM messages WHERE stream_id = $1 AND is_deleted = false',
      [streamId]
    );
    
    const totalQuestions = await pool.query(
      'SELECT COUNT(*) as count FROM messages WHERE stream_id = $1 AND is_question = true AND is_deleted = false',
      [streamId]
    );
    
    // Топ авторы вопросов
    const topQuestionAuthors = await pool.query(`
      SELECT username, COUNT(*) as question_count
      FROM messages 
      WHERE stream_id = $1 AND is_question = true AND is_deleted = false
      GROUP BY username
      ORDER BY question_count DESC
      LIMIT 10
    `, [streamId]);
    
    res.json({
      success: true,
      stats: {
        totalMessages: parseInt(totalMessages.rows[0].count),
        totalQuestions: parseInt(totalQuestions.rows[0].count),
        questionPercentage: totalMessages.rows[0].count > 0 
          ? Math.round((totalQuestions.rows[0].count / totalMessages.rows[0].count) * 100)
          : 0,
        topQuestionAuthors: topQuestionAuthors.rows
      }
    });
    
  } catch (error) {
    logger.error('Error fetching stream stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch stream stats'
    });
  }
});

// POST /api/messages/:messageId/rate - лайк/дизлайк
router.post('/:messageId/rate', async (req, res) => {
  try {
    const { messageId } = req.params;
    const { userId, score } = req.body;
    
    if (!userId || !score || (score !== 1 && score !== -1)) {
      return res.status(400).json({
        success: false,
        error: 'User ID and score (+1 or -1) are required'
      });
    }
    
    const query = `
      INSERT INTO ratings (user_id, message_id, score, created_at)
      VALUES ($1, $2, $3, now())
      ON CONFLICT (user_id, message_id) 
      DO UPDATE SET score = $3, created_at = now()
      RETURNING id
    `;
    
    const result = await pool.query(query, [userId, messageId, score]);
    
    res.json({
      success: true,
      rated: true,
      message: 'Message rated successfully'
    });
    
  } catch (error) {
    logger.error('Error rating message:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to rate message'
    });
  }
});

module.exports = router;
