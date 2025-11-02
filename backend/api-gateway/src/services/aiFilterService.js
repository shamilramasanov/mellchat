// AI Filter Service - сервис для обучения и применения AI фильтра спама
const logger = require('../utils/logger');
const databaseService = require('./databaseService');
const geminiService = require('./geminiService');
const redisService = require('./redisService');

class AIFilterService {
  constructor() {
    this.MAX_TRAININGS_PER_DAY = 3;
    this.RATE_LIMIT_KEY_PREFIX = 'ai_filter_trainings:';
  }

  /**
   * Получить правила пользователя
   * @param {string} userId - ID пользователя
   * @returns {Promise<Object|null>} - Правила или null
   */
  async getRules(userId) {
    try {
      const query = `
        SELECT 
          id, user_id, rules_json, sample_size, spam_found, 
          spam_detected_rate, training_mode, created_at, updated_at
        FROM user_spam_rules
        WHERE user_id = $1
        LIMIT 1
      `;
      
      const result = await databaseService.query(query, [userId]);
      
      if (!result.rows || result.rows.length === 0) {
        return null;
      }
      
      const row = result.rows[0];
      return {
        hasRules: true,
        rules: row.rules_json,
        stats: {
          sampleSize: row.sample_size,
          spamFound: row.spam_found,
          spamRate: parseFloat(row.spam_detected_rate) || 0
        },
        trainingMode: row.training_mode,
        updatedAt: row.updated_at
      };
    } catch (error) {
      logger.error('Error getting AI filter rules:', error);
      throw error;
    }
  }

  /**
   * Проверить rate limit на обучение
   * @param {string} userId - ID пользователя
   * @returns {Promise<{allowed: boolean, count: number, resetAt: number}>}
   */
  async checkRateLimit(userId) {
    try {
      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
      const key = `${this.RATE_LIMIT_KEY_PREFIX}${userId}:${today}`;
      
      const count = await redisService.get(key);
      const countNum = count ? parseInt(count, 10) : 0;
      
      // Вычисляем время до сброса (конец дня)
      const now = new Date();
      const endOfDay = new Date(now);
      endOfDay.setHours(23, 59, 59, 999);
      const resetAt = Math.floor((endOfDay.getTime() - now.getTime()) / 1000);
      
      return {
        allowed: countNum < this.MAX_TRAININGS_PER_DAY,
        count: countNum,
        resetAt: resetAt > 0 ? resetAt : 86400 // Если уже прошел день, возвращаем 24 часа
      };
    } catch (error) {
      logger.error('Error checking rate limit:', error);
      // В случае ошибки Redis разрешаем обучение (fail open)
      return { allowed: true, count: 0, resetAt: 86400 };
    }
  }

  /**
   * Обновить счетчик обучения
   * @param {string} userId - ID пользователя
   */
  async updateRateLimit(userId) {
    try {
      const today = new Date().toISOString().split('T')[0];
      const key = `${this.RATE_LIMIT_KEY_PREFIX}${userId}:${today}`;
      
      // Получаем текущее значение
      const current = await redisService.get(key);
      const count = current ? parseInt(current, 10) + 1 : 1;
      
      // Вычисляем TTL до конца дня
      const now = new Date();
      const endOfDay = new Date(now);
      endOfDay.setHours(23, 59, 59, 999);
      const ttl = Math.floor((endOfDay.getTime() - now.getTime()) / 1000);
      
      // Сохраняем с TTL до конца дня
      await redisService.setex(key, ttl > 0 ? ttl : 86400, count.toString());
    } catch (error) {
      logger.error('Error updating rate limit:', error);
      // Игнорируем ошибки Redis (fail open)
    }
  }

  /**
   * Получить выборку сообщений для обучения
   * @param {Object} config - Конфигурация обучения
   * @param {number} config.sampleSize - Размер выборки
   * @param {string} config.scope - 'all' или 'active'
   * @returns {Promise<Array>} - Массив сообщений
   */
  async getTrainingSample(config) {
    try {
      const { sampleSize, scope } = config;
      
      let query;
      let params;
      
      if (scope === 'active') {
        // Только активные стримы (за последние 24 часа)
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        query = `
          SELECT id, text, username, platform, stream_id, created_at
          FROM messages
          WHERE created_at >= $1
          ORDER BY created_at DESC
          LIMIT $2
        `;
        params = [oneDayAgo, sampleSize];
      } else {
        // Все сообщения
        query = `
          SELECT id, text, username, platform, stream_id, created_at
          FROM messages
          ORDER BY created_at DESC
          LIMIT $1
        `;
        params = [sampleSize];
      }
      
      const result = await databaseService.query(query, params);
      return result.rows || [];
    } catch (error) {
      logger.error('Error getting training sample:', error);
      throw error;
    }
  }

  /**
   * Обучить фильтр на выборке сообщений
   * @param {string} userId - ID пользователя
   * @param {Object} config - Конфигурация обучения
   * @returns {Promise<Object>} - Правила и статистика
   */
  async trainFilter(userId, config) {
    try {
      // Проверка rate limit
      const rateLimit = await this.checkRateLimit(userId);
      if (!rateLimit.allowed) {
        throw new Error(`Превышен лимит обучений. Максимум ${this.MAX_TRAININGS_PER_DAY} обучений в день. Следующее обучение доступно через ${Math.floor(rateLimit.resetAt / 3600)} часов.`);
      }

      // Получаем выборку сообщений
      logger.info(`Getting training sample for user ${userId}:`, config);
      const messages = await this.getTrainingSample(config);
      
      if (messages.length === 0) {
        throw new Error('Не найдено сообщений для обучения. Попробуйте увеличить размер выборки или изменить область выборки.');
      }

      logger.info(`Sample size: ${messages.length} messages`);

      // Формируем промпт для Gemini
      const trainingModeDescriptions = {
        strict: 'строгий (блокировать агрессивный спам, избыточные эмодзи, повторения)',
        moderate: 'умеренный (блокировать явный спам, но разрешать обычные сообщения)',
        lenient: 'мягкий (блокировать только очевидный спам)'
      };

      const prompt = `Ты помощник для стримера, который хочет настроить AI фильтр спама для чата.

Проанализируй следующие ${messages.length} сообщений из чата и создай правила для фильтрации спама.

Режим фильтрации: ${trainingModeDescriptions[config.trainingMode] || 'умеренный'}

Правила должны включать:
1. Ключевые слова спама (массив строк)
2. Regex паттерны для типичных спам-паттернов
3. Пороговые значения (thresholds):
   - emojiRatio: максимальная доля эмодзи в сообщении (0-1)
   - capsRatio: максимальная доля заглавных букв (0-1)
   - repetitionScore: максимальный коэффициент повторений (0-1)
   - minLength: минимальная длина качественного сообщения
   - maxLength: максимальная длина (чтобы отфильтровать слишком длинные спам-сообщения)
4. Паттерны поведения:
   - excessiveRepeats: максимальное количество одинаковых символов подряд
   - spamPhrases: фразы-индикаторы спама

Сообщения для анализа:
${messages.slice(0, 500).map((msg, idx) => `${idx + 1}. [${msg.platform}] ${msg.username}: ${msg.text}`).join('\n')}

${messages.length > 500 ? `\n... и еще ${messages.length - 500} сообщений\n` : ''}

ВЕРНИ ОТВЕТ СТРОГО В ФОРМАТЕ JSON (только JSON, без дополнительного текста):
{
  "keywords": ["спам", "слово1", "слово2"],
  "regexPatterns": ["паттерн1", "паттерн2"],
  "thresholds": {
    "emojiRatio": 0.5,
    "capsRatio": 0.7,
    "repetitionScore": 0.3,
    "minLength": 3,
    "maxLength": 500
  },
  "patterns": {
    "excessiveRepeats": 5,
    "spamPhrases": ["фраза1", "фраза2"]
  },
  "analysis": {
    "totalMessages": ${messages.length},
    "spamDetected": 0,
    "spamRate": 0.0,
    "reasoning": "краткое объяснение правил"
  }
}`;

      // Отправляем в Gemini
      logger.info('Sending to Gemini API for analysis...');
      const response = await geminiService.makeRequest(
        'gemini-pro',
        prompt,
        [],
        {
          temperature: 0.7,
          maxOutputTokens: 2000
        }
      );

      if (!response || !response.text) {
        throw new Error('Gemini API вернул пустой ответ');
      }

      // Парсим JSON ответ
      let rulesJson;
      try {
        // Извлекаем JSON из текста (Gemini может добавить markdown)
        const jsonMatch = response.text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          rulesJson = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('JSON не найден в ответе');
        }
      } catch (parseError) {
        logger.error('Error parsing Gemini response:', parseError);
        logger.error('Response text:', response.text);
        throw new Error('Не удалось распарсить ответ от AI. Попробуйте еще раз.');
      }

      // Вычисляем статистику
      const spamFound = rulesJson.analysis?.spamDetected || 0;
      const spamRate = rulesJson.analysis?.spamRate || (spamFound / messages.length) * 100;

      // Сохраняем правила в БД
      const now = new Date();
      const query = `
        INSERT INTO user_spam_rules (
          user_id, rules_json, sample_size, spam_found, 
          spam_detected_rate, training_mode, created_at, updated_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT (user_id) DO UPDATE
        SET 
          rules_json = EXCLUDED.rules_json,
          sample_size = EXCLUDED.sample_size,
          spam_found = EXCLUDED.spam_found,
          spam_detected_rate = EXCLUDED.spam_detected_rate,
          training_mode = EXCLUDED.training_mode,
          updated_at = EXCLUDED.updated_at
        RETURNING *
      `;

      const insertResult = await databaseService.query(query, [
        userId,
        JSON.stringify(rulesJson),
        messages.length,
        spamFound,
        spamRate.toFixed(2),
        config.trainingMode || 'moderate',
        now,
        now
      ]);

      // Обновляем rate limit
      await this.updateRateLimit(userId);

      logger.info(`✅ AI filter trained for user ${userId}:`, {
        sampleSize: messages.length,
        spamFound,
        spamRate: spamRate.toFixed(2) + '%'
      });

      return {
        success: true,
        rules: rulesJson,
        stats: {
          sampleSize: messages.length,
          spamFound,
          spamRate: parseFloat(spamRate.toFixed(2))
        },
        trainingMode: config.trainingMode || 'moderate',
        updatedAt: insertResult.rows[0].updated_at
      };
    } catch (error) {
      logger.error('Error training AI filter:', error);
      throw error;
    }
  }

  /**
   * Удалить правила пользователя
   * @param {string} userId - ID пользователя
   */
  async deleteRules(userId) {
    try {
      const query = `
        DELETE FROM user_spam_rules
        WHERE user_id = $1
      `;
      
      await databaseService.query(query, [userId]);
      logger.info(`✅ AI filter rules deleted for user ${userId}`);
      
      return { success: true };
    } catch (error) {
      logger.error('Error deleting AI filter rules:', error);
      throw error;
    }
  }
}

module.exports = new AIFilterService();

