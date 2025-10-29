// Lightweight in-memory rate limiter middleware (dev-friendly)
const logger = require('../utils/logger');

class RateLimiter {
  constructor(limits) {
    this.limits = limits; // { windowMs, max }
    this.buckets = new Map(); // key -> [timestamps]
  }

  check(key) {
    const now = Date.now();
    const windowStart = now - this.limits.windowMs;

    const arr = this.buckets.get(key) || [];
    const filtered = arr.filter(ts => ts > windowStart);
    if (filtered.length >= this.limits.max) {
      const resetAt = filtered[0] + this.limits.windowMs;
      return { allowed: false, remaining: 0, resetAt };
    }
    filtered.push(now);
    this.buckets.set(key, filtered);
    return { allowed: true, remaining: this.limits.max - filtered.length, resetAt: now + this.limits.windowMs };
  }
}

function createRateLimiter({ windowMs = 60000, max = 100 } = {}) {
  const limiter = new RateLimiter({ windowMs, max });
  return (req, res, next) => {
    try {
      const key = req.user?.id || req.ip || 'anon';
      const result = limiter.check(key);
      res.set({
        'X-RateLimit-Limit': String(max),
        'X-RateLimit-Remaining': String(result.remaining),
        'X-RateLimit-Reset': new Date(result.resetAt).toISOString(),
      });
      if (!result.allowed) {
        return res.status(429).json({ error: 'Too many requests from this IP, please try again later.' });
      }
      next();
    } catch (e) {
      logger.error('RateLimiter error', { error: e.message });
      next();
    }
  };
}

module.exports = { createRateLimiter };

