const { createClient } = require('redis');
const logger = require('../utils/logger');

let client;

function ensureClient() {
  if (client) return client;
  const url = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
  client = createClient({ url });
  client.on('error', (err) => logger.error('Redis Client Error', { error: err.message }));
  client.connect().catch((err) => logger.error('Redis connect failed', { error: err.message }));
  return client;
}

const redisService = {
  async get(key) {
    try {
      const c = ensureClient();
      return await c.get(key);
    } catch (e) { logger.error('redis.get error', { error: e.message }); return null; }
  },
  async set(key, value, ttlSeconds) {
    try {
      const c = ensureClient();
      if (ttlSeconds) {
        await c.set(key, value, { EX: ttlSeconds });
      } else {
        await c.set(key, value);
      }
      return true;
    } catch (e) { logger.error('redis.set error', { error: e.message }); return false; }
  },
  async setex(key, ttlSeconds, value) {
    try {
      const c = ensureClient();
      await c.set(key, value, { EX: ttlSeconds });
      return true;
    } catch (e) { logger.error('redis.setex error', { error: e.message }); return false; }
  },
  async del(key) {
    try { const c = ensureClient(); await c.del(key); return true; }
    catch (e) { logger.error('redis.del error', { error: e.message }); return false; }
  },
  async keys(pattern) {
    try { const c = ensureClient(); return await c.keys(pattern); }
    catch (e) { logger.error('redis.keys error', { error: e.message }); return []; }
  },
  async publish(channel, message) {
    try { const c = ensureClient(); await c.publish(channel, typeof message === 'string' ? message : JSON.stringify(message)); return true; }
    catch (e) { logger.error('redis.publish error', { error: e.message }); return false; }
  },
  async subscribe(channel, callback) {
    try {
      const sub = createClient({ url: process.env.REDIS_URL || 'redis://127.0.0.1:6379' });
      sub.on('error', (err) => logger.error('Redis Sub Error', { error: err.message }));
      await sub.connect();
      await sub.subscribe(channel, (msg) => {
        try { callback(msg); } catch {}
      });
      return true;
    } catch (e) { logger.error('redis.subscribe error', { error: e.message }); return false; }
  }
  ,
  async ping() {
    try { const c = ensureClient(); return await c.ping(); }
    catch (e) { throw e; }
  }
};

module.exports = redisService;
