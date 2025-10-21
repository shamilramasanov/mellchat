const express = require('express');
const messagesController = require('../controllers/messagesController');
const validator = require('../utils/validator');

const router = express.Router();

/**
 * GET /api/v1/messages
 * Get messages with pagination and filtering
 */
router.get('/', async (req, res, next) => {
  try {
    const { page = 1, limit = 50, platform, category, channel } = req.query;
    
    // Validate query parameters
    const validation = validator.validateMessageQuery({
      page: parseInt(page),
      limit: parseInt(limit),
      platform,
      category,
      channel,
    });
    
    if (validation.error) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid query parameters',
          details: validation.error.details,
        },
      });
    }
    
    const result = await messagesController.getMessages(validation.value);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/v1/messages
 * Create a new message (for testing purposes)
 */
router.post('/', async (req, res, next) => {
  try {
    const validation = validator.validateMessage(req.body);
    
    if (validation.error) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid message data',
          details: validation.error.details,
        },
      });
    }
    
    const message = await messagesController.createMessage(validation.value);
    res.status(201).json({ message });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/messages/:id
 * Get a specific message by ID
 */
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    
    if (!validator.isValidUUID(id)) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid message ID format',
        },
      });
    }
    
    const message = await messagesController.getMessageById(id);
    
    if (!message) {
      return res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: 'Message not found',
        },
      });
    }
    
    res.json({ message });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/v1/messages/:id/upvote
 * Add upvote to a message
 */
router.put('/:id/upvote', async (req, res, next) => {
  try {
    const { id } = req.params;
    
    if (!validator.isValidUUID(id)) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid message ID format',
        },
      });
    }
    
    const result = await messagesController.upvoteMessage(id, req.user);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/v1/messages/:id/upvote
 * Remove upvote from a message
 */
router.delete('/:id/upvote', async (req, res, next) => {
  try {
    const { id } = req.params;
    
    if (!validator.isValidUUID(id)) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid message ID format',
        },
      });
    }
    
    const result = await messagesController.removeUpvote(id, req.user);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
