// User Settings Service - сервис для работы с настройками пользователей
const logger = require('../utils/logger');
const databaseService = require('./databaseService');

const userSettingsService = {
  /**
   * Получить настройки пользователя
   * @param {string} userId - ID пользователя
   * @returns {Promise<Object|null>} - Настройки или null
   */
  async getSettings(userId) {
    try {
      const query = `
        SELECT 
          user_id,
          notifications,
          mood_bar_enabled,
          theme,
          language,
          font_size,
          compact_mode,
          created_at,
          updated_at
        FROM user_settings
        WHERE user_id = $1
      `;
      const result = await databaseService.query(query, [userId]);
      
      if (result.rows && result.rows.length > 0) {
        const settings = result.rows[0];
        return {
          userId: settings.user_id,
          notifications: settings.notifications,
          moodBarEnabled: settings.mood_bar_enabled,
          theme: settings.theme,
          language: settings.language,
          fontSize: settings.font_size,
          compactMode: settings.compact_mode,
          createdAt: settings.created_at,
          updatedAt: settings.updated_at
        };
      }
      
      // Возвращаем дефолтные настройки если нет в БД
      return this.getDefaultSettings(userId);
    } catch (error) {
      logger.error('Error getting user settings:', error);
      // Возвращаем дефолтные настройки при ошибке
      return this.getDefaultSettings(userId);
    }
  },

  /**
   * Сохранить настройки пользователя
   * @param {string} userId - ID пользователя
   * @param {Object} settings - Объект с настройками
   * @returns {Promise<Object>} - Сохраненные настройки
   */
  async saveSettings(userId, settings) {
    try {
      const now = new Date();
      
      // Валидация настроек
      const validatedSettings = {
        notifications: settings.notifications !== undefined ? Boolean(settings.notifications) : true,
        mood_bar_enabled: settings.moodBarEnabled !== undefined ? Boolean(settings.moodBarEnabled) : false,
        theme: settings.theme && ['dark', 'light', 'auto'].includes(settings.theme) ? settings.theme : 'dark',
        language: settings.language && ['ru', 'en', 'uk'].includes(settings.language) ? settings.language : 'ru',
        font_size: settings.fontSize && ['small', 'medium', 'large'].includes(settings.fontSize) ? settings.fontSize : 'medium',
        compact_mode: settings.compactMode !== undefined ? Boolean(settings.compactMode) : false,
        updated_at: now
      };

      const query = `
        INSERT INTO user_settings (
          user_id,
          notifications,
          mood_bar_enabled,
          theme,
          language,
          font_size,
          compact_mode,
          created_at,
          updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        ON CONFLICT (user_id) 
        DO UPDATE SET
          notifications = EXCLUDED.notifications,
          mood_bar_enabled = EXCLUDED.mood_bar_enabled,
          theme = EXCLUDED.theme,
          language = EXCLUDED.language,
          font_size = EXCLUDED.font_size,
          compact_mode = EXCLUDED.compact_mode,
          updated_at = EXCLUDED.updated_at
        RETURNING *
      `;

      const result = await databaseService.query(query, [
        userId,
        validatedSettings.notifications,
        validatedSettings.mood_bar_enabled,
        validatedSettings.theme,
        validatedSettings.language,
        validatedSettings.font_size,
        validatedSettings.compact_mode,
        now,
        now
      ]);

      if (result.rows && result.rows.length > 0) {
        const saved = result.rows[0];
        logger.info(`User settings saved for user: ${userId}`);
        return {
          userId: saved.user_id,
          notifications: saved.notifications,
          moodBarEnabled: saved.mood_bar_enabled,
          theme: saved.theme,
          language: saved.language,
          fontSize: saved.font_size,
          compactMode: saved.compact_mode,
          createdAt: saved.created_at,
          updatedAt: saved.updated_at
        };
      }

      throw new Error('Failed to save user settings');
    } catch (error) {
      logger.error('Error saving user settings:', error);
      throw error;
    }
  },

  /**
   * Получить дефолтные настройки
   * @param {string} userId - ID пользователя
   * @returns {Object} - Дефолтные настройки
   */
  getDefaultSettings(userId) {
    return {
      userId,
      notifications: true,
      moodBarEnabled: false,
      theme: 'dark',
      language: 'ru',
      fontSize: 'medium',
      compactMode: false,
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }
};

module.exports = userSettingsService;

