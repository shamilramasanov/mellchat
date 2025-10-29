const databaseService = require('./databaseService');
const geminiService = require('./geminiService');
const logger = require('../utils/logger');

class ModerationService {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 30000; // 30 секунд
    this.spamThreshold = 0.7;
    this.toxicityThreshold = 0.8;
  }

  /**
   * Анализ сообщения на спам через Gemini
   */
  async detectSpam(message) {
    try {
      if (!geminiService.isAvailable()) {
        // Fallback: простая проверка
        return this._simpleSpamCheck(message);
      }

      const prompt = `Проанализируй следующее сообщение на спам. Верни ответ в формате JSON:
{
  "is_spam": true/false,
  "confidence": 0.0-1.0,
  "reason": "причина"
}

Сообщение: "${message.text || message.content}"
Пользователь: ${message.username}
Длина: ${(message.text || message.content || '').length} символов

Учитывай:
- Повторяющиеся сообщения
- Ссылки на внешние ресурсы
- Чрезмерное использование заглавных букв
- Подозрительные паттерны текста`;

      const response = await geminiService.makeRequest('gemini-pro', prompt);
      
      try {
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const analysis = JSON.parse(jsonMatch[0]);
          return {
            isSpam: analysis.is_spam || false,
            confidence: analysis.confidence || 0.5,
            reason: analysis.reason || 'Analysis completed'
          };
        }
      } catch (e) {
        logger.warn('Failed to parse spam detection JSON');
      }

      // Fallback
      return this._simpleSpamCheck(message);
    } catch (error) {
      logger.error('Spam detection error:', error);
      return this._simpleSpamCheck(message);
    }
  }

  /**
   * Простая проверка на спам (fallback)
   */
  _simpleSpamCheck(message) {
    const text = (message.text || message.content || '').toLowerCase();
    const spamPatterns = [
      /(http|https|www\.)/gi,
      /([A-Z]{5,})/g,
      /(.)\1{4,}/g, // повторяющиеся символы
    ];

    let spamScore = 0;
    
    if (text.length < 3) spamScore += 0.3;
    if (text.length > 500) spamScore += 0.2;
    
    spamPatterns.forEach(pattern => {
      if (pattern.test(text)) spamScore += 0.2;
    });

    return {
      isSpam: spamScore >= this.spamThreshold,
      confidence: Math.min(spamScore, 1.0),
      reason: spamScore >= this.spamThreshold ? 'Pattern detected' : 'No spam patterns'
    };
  }

  /**
   * Обнаружение токсичности через Gemini
   */
  async detectToxicity(message) {
    try {
      if (!geminiService.isAvailable()) {
        return { isToxic: false, confidence: 0, reason: 'Gemini not available' };
      }

      const prompt = `Проанализируй сообщение на токсичность, оскорбления, харассмент, ненависть. Верни JSON:
{
  "is_toxic": true/false,
  "confidence": 0.0-1.0,
  "category": "harassment/hate/speech/neutral",
  "reason": "объяснение"
}

Сообщение: "${message.text || message.content}"`;

      const response = await geminiService.makeRequest('gemini-pro', prompt);
      
      try {
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const analysis = JSON.parse(jsonMatch[0]);
          return {
            isToxic: analysis.is_toxic || false,
            confidence: analysis.confidence || 0.5,
            category: analysis.category || 'neutral',
            reason: analysis.reason || 'Analysis completed'
          };
        }
      } catch (e) {
        logger.warn('Failed to parse toxicity detection JSON');
      }

      return { isToxic: false, confidence: 0, reason: 'Analysis failed' };
    } catch (error) {
      logger.error('Toxicity detection error:', error);
      return { isToxic: false, confidence: 0, reason: 'Error during analysis' };
    }
  }

  /**
   * Полный анализ контента (спам + токсичность)
   */
  async analyzeContent(message) {
    try {
      const [spamAnalysis, toxicityAnalysis] = await Promise.all([
        this.detectSpam(message),
        this.detectToxicity(message)
      ]);

      const shouldBlock = spamAnalysis.isSpam || 
                         (toxicityAnalysis.isToxic && toxicityAnalysis.confidence >= this.toxicityThreshold);

      return {
        spam: spamAnalysis,
        toxicity: toxicityAnalysis,
        shouldBlock,
        action: shouldBlock ? 'block' : 'allow',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logger.error('Content analysis error:', error);
      return {
        spam: { isSpam: false, confidence: 0, reason: 'Error' },
        toxicity: { isToxic: false, confidence: 0, reason: 'Error' },
        shouldBlock: false,
        action: 'allow',
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Автоматическая модерация сообщения
   */
  async moderateMessage(message) {
    try {
      const analysis = await this.analyzeContent(message);

      if (analysis.shouldBlock) {
        // Обновляем сообщение в БД как заблокированное
        try {
          await databaseService.query(
            `UPDATE messages SET is_deleted = true, moderation_reason = $1 WHERE id = $2`,
            [analysis.action === 'block' ? analysis.spam.reason || analysis.toxicity.reason : null, message.id]
          );
        } catch (dbError) {
          logger.error('Failed to update message in DB:', dbError);
        }

        return {
          action: 'blocked',
          reason: analysis.spam.isSpam ? analysis.spam.reason : analysis.toxicity.reason,
          analysis
        };
      }

      return {
        action: 'allowed',
        analysis
      };
    } catch (error) {
      logger.error('Message moderation error:', error);
      return {
        action: 'error',
        error: error.message
      };
    }
  }

  /**
   * Блокировка пользователя
   */
  async blockUser(userId, reason, duration = null) {
    try {
      const expiresAt = duration ? new Date(Date.now() + duration * 1000) : null;
      
      await databaseService.query(
        `INSERT INTO blocked_users (user_id, reason, blocked_at, expires_at)
         VALUES ($1, $2, NOW(), $3)
         ON CONFLICT (user_id) 
         DO UPDATE SET reason = $2, blocked_at = NOW(), expires_at = $3`,
        [userId, reason, expiresAt]
      );

      // Блокируем все сообщения пользователя
      await databaseService.query(
        `UPDATE messages SET is_deleted = true, moderation_reason = $1 
         WHERE username = $2 AND is_deleted = false`,
        [reason, userId]
      );

      return { success: true };
    } catch (error) {
      logger.error('Block user error:', error);
      throw error;
    }
  }

  /**
   * Разблокировка пользователя
   */
  async unblockUser(userId) {
    try {
      await databaseService.query(
        `DELETE FROM blocked_users WHERE user_id = $1`,
        [userId]
      );

      return { success: true };
    } catch (error) {
      logger.error('Unblock user error:', error);
      throw error;
    }
  }

  /**
   * Получение статистики модерации
   */
  async getModerationStats(timeRange = '24h') {
    try {
      const interval = this._getInterval(timeRange);
      
      const query = `
        SELECT 
          COUNT(*) FILTER (WHERE is_deleted = true) as blocked_count,
          COUNT(*) as total_count,
          COUNT(DISTINCT username) FILTER (WHERE is_deleted = true) as blocked_users_count
        FROM messages
        WHERE created_at > NOW() - INTERVAL '${interval}'
      `;

      const result = await databaseService.query(query);
      const row = result.rows[0];

      return {
        totalMessages: parseInt(row.total_count || 0),
        blockedMessages: parseInt(row.blocked_count || 0),
        blockedUsers: parseInt(row.blocked_users_count || 0),
        blockRate: row.total_count > 0 
          ? ((row.blocked_count / row.total_count) * 100).toFixed(2)
          : 0,
        timeRange
      };
    } catch (error) {
      logger.error('Get moderation stats error:', error);
      throw error;
    }
  }

  /**
   * Получение истории модерации
   */
  async getModerationHistory(limit = 50, offset = 0) {
    try {
      const query = `
        SELECT 
          id,
          username,
          text,
          platform,
          is_deleted,
          moderation_reason,
          created_at
        FROM messages
        WHERE is_deleted = true OR moderation_reason IS NOT NULL
        ORDER BY created_at DESC
        LIMIT $1 OFFSET $2
      `;

      const result = await databaseService.query(query, [limit, offset]);
      
      return result.rows.map(row => ({
        id: row.id,
        username: row.username,
        text: row.text,
        platform: row.platform,
        isBlocked: row.is_deleted,
        reason: row.moderation_reason,
        timestamp: row.created_at
      }));
    } catch (error) {
      logger.error('Get moderation history error:', error);
      throw error;
    }
  }

  /**
   * Преобразование timeRange в SQL интервал
   */
  _getInterval(timeRange) {
    const intervals = {
      '1h': '1 hour',
      '24h': '24 hours',
      '7d': '7 days',
      '30d': '30 days'
    };
    return intervals[timeRange] || intervals['24h'];
  }
}

module.exports = new ModerationService();

