const express = require('express');
const postgresService = require('../services/postgresService');
const redisService = require('../services/redisService');

const router = express.Router();

/**
 * GET /api/v1/health
 * Health check endpoint
 */
router.get('/', async (req, res) => {
  try {
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {},
    };
    
    // Check PostgreSQL connection
    try {
      await postgresService.query('SELECT 1');
      health.services.postgres = 'connected';
    } catch (error) {
      health.services.postgres = 'disconnected';
      health.status = 'unhealthy';
    }
    
    // Check Redis connection
    try {
      await redisService.ping();
      health.services.redis = 'connected';
    } catch (error) {
      health.services.redis = 'disconnected';
      health.status = 'unhealthy';
    }
    
    const statusCode = health.status === 'healthy' ? 200 : 503;
    res.status(statusCode).json(health);
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message,
    });
  }
});

/**
 * GET /api/v1/health/ready
 * Readiness check endpoint
 */
router.get('/ready', async (req, res) => {
  try {
    // Check if all required services are available
    await postgresService.query('SELECT 1');
    await redisService.ping();
    
    res.status(200).json({
      status: 'ready',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(503).json({
      status: 'not ready',
      timestamp: new Date().toISOString(),
      error: error.message,
    });
  }
});

/**
 * GET /api/v1/health/live
 * Liveness check endpoint
 */
router.get('/live', (req, res) => {
  res.status(200).json({
    status: 'alive',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

module.exports = router;
