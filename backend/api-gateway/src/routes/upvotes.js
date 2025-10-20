const express = require('express');
const upvotesController = require('../controllers/upvotesController');

const router = express.Router();

/**
 * POST /api/v1/upvotes/:questionId
 * Add upvote to a question
 */
router.post('/:questionId', upvotesController.upvoteQuestion);

/**
 * DELETE /api/v1/upvotes/:questionId
 * Remove upvote from a question
 */
router.delete('/:questionId', upvotesController.removeUpvote);

module.exports = router;
