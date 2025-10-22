const express = require('express');
const questionsController = require('../controllers/questionsController');
const validator = require('../utils/validator');

const router = express.Router();

/**
 * GET /api/v1/questions
 * Get questions with pagination and filtering
 */
router.get('/', async (req, res, next) => {
  try {
    const { page = 1, limit = 50, platform, answered, channel } = req.query;
    
    // Validate query parameters
    const validation = validator.validateQuestionQuery({
      page: parseInt(page),
      limit: parseInt(limit),
      platform,
      answered: answered === 'true' ? true : answered === 'false' ? false : undefined,
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
    
    const result = await questionsController.getQuestions(validation.value);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/v1/questions
 * Create a new question
 */
router.post('/', async (req, res, next) => {
  try {
    const validation = validator.validateQuestion(req.body);
    
    if (validation.error) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid question data',
          details: validation.error.details,
        },
      });
    }
    
    const question = await questionsController.createQuestion(validation.value);
    res.status(201).json({ question });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/questions/:id
 * Get a specific question by ID
 */
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    
    if (!validator.isValidUUID(id)) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid question ID format',
        },
      });
    }
    
    const question = await questionsController.getQuestionById(id);
    
    if (!question) {
      return res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: 'Question not found',
        },
      });
    }
    
    res.json({ question });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/v1/questions/:id/answer
 * Mark question as answered
 */
router.put('/:id/answer', async (req, res, next) => {
  try {
    const { id } = req.params;
    
    if (!validator.isValidUUID(id)) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid question ID format',
        },
      });
    }
    
    const result = await questionsController.markAsAnswered(id);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/v1/questions/:id/upvote
 * Add upvote to a question
 */
router.put('/:id/upvote', async (req, res, next) => {
  try {
    const { id } = req.params;
    
    if (!validator.isValidUUID(id)) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid question ID format',
        },
      });
    }
    
    const result = await questionsController.upvoteQuestion(id, req.user);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/v1/questions/:id/upvote
 * Remove upvote from a question
 */
router.delete('/:id/upvote', async (req, res, next) => {
  try {
    const { id } = req.params;
    
    if (!validator.isValidUUID(id)) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid question ID format',
        },
      });
    }
    
    const result = await questionsController.removeUpvote(id, req.user);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
