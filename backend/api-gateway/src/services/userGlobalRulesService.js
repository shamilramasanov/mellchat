// User Global Rules Service - управление пользовательскими правилами
const logger = require('../utils/logger');
const databaseService = require('./databaseService');

const userGlobalRulesService = {
  /**
   * Получить все правила пользователя
   * @param {string} userId - ID пользователя
   * @returns {Promise<Array>} - Массив правил
   */
  async getUserRules(userId) {
    try {
      const query = `
        SELECT id, rule_type, settings_json, description, enabled, created_at, updated_at
        FROM user_global_rules
        WHERE user_id = $1
        ORDER BY rule_type, created_at DESC
      `;
      
      const result = await databaseService.query(query, [userId]);
      
      return result.rows.map(row => ({
        id: row.id,
        ruleType: row.rule_type,
        settings: row.settings_json,
        description: row.description,
        enabled: row.enabled,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      }));
    } catch (error) {
      logger.error(`Error getting user rules for user ${userId}:`, error);
      throw error;
    }
  },

  /**
   * Получить правило пользователя по типу
   * @param {string} userId - ID пользователя
   * @param {string} ruleType - Тип правила
   * @returns {Promise<Object|null>} - Правило или null
   */
  async getUserRule(userId, ruleType) {
    try {
      const query = `
        SELECT id, rule_type, settings_json, description, enabled, created_at, updated_at
        FROM user_global_rules
        WHERE user_id = $1 AND rule_type = $2
      `;
      
      const result = await databaseService.query(query, [userId, ruleType]);
      
      if (result.rows.length === 0) {
        return null;
      }
      
      const row = result.rows[0];
      return {
        id: row.id,
        ruleType: row.rule_type,
        settings: row.settings_json,
        description: row.description,
        enabled: row.enabled,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      };
    } catch (error) {
      logger.error(`Error getting user rule ${ruleType} for user ${userId}:`, error);
      throw error;
    }
  },

  /**
   * Создать или обновить правило пользователя
   * @param {string} userId - ID пользователя
   * @param {string} ruleType - Тип правила
   * @param {Object} settings - Настройки правила
   * @param {string} description - Описание правила
   * @param {boolean} enabled - Включено ли правило
   * @returns {Promise<Object>} - Созданное/обновленное правило
   */
  async saveUserRule(userId, ruleType, settings, description = null, enabled = true) {
    try {
      const query = `
        INSERT INTO user_global_rules (user_id, rule_type, settings_json, description, enabled, updated_at)
        VALUES ($1, $2, $3, $4, $5, NOW())
        ON CONFLICT (user_id, rule_type) 
        DO UPDATE SET
          settings_json = EXCLUDED.settings_json,
          description = COALESCE(EXCLUDED.description, user_global_rules.description),
          enabled = EXCLUDED.enabled,
          updated_at = NOW()
        RETURNING id, rule_type, settings_json, description, enabled, created_at, updated_at
      `;
      
      const result = await databaseService.query(query, [
        userId,
        ruleType,
        JSON.stringify(settings),
        description,
        enabled
      ]);
      
      if (result.rows.length === 0) {
        throw new Error('Failed to save user rule');
      }
      
      const row = result.rows[0];
      return {
        id: row.id,
        ruleType: row.rule_type,
        settings: row.settings_json,
        description: row.description,
        enabled: row.enabled,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      };
    } catch (error) {
      logger.error(`Error saving user rule ${ruleType} for user ${userId}:`, error);
      throw error;
    }
  },

  /**
   * Включить/выключить правило пользователя
   * @param {string} userId - ID пользователя
   * @param {string} ruleType - Тип правила
   * @param {boolean} enabled - Включено ли правило
   * @returns {Promise<boolean>} - Успешно ли обновлено
   */
  async toggleUserRule(userId, ruleType, enabled) {
    try {
      const query = `
        UPDATE user_global_rules
        SET enabled = $1, updated_at = NOW()
        WHERE user_id = $2 AND rule_type = $3
        RETURNING enabled
      `;
      
      const result = await databaseService.query(query, [enabled, userId, ruleType]);
      
      return result.rows.length > 0;
    } catch (error) {
      logger.error(`Error toggling user rule ${ruleType} for user ${userId}:`, error);
      throw error;
    }
  },

  /**
   * Удалить правило пользователя
   * @param {string} userId - ID пользователя
   * @param {string} ruleType - Тип правила
   * @returns {Promise<boolean>} - Успешно ли удалено
   */
  async deleteUserRule(userId, ruleType) {
    try {
      const query = `
        DELETE FROM user_global_rules
        WHERE user_id = $1 AND rule_type = $2
        RETURNING id
      `;
      
      const result = await databaseService.query(query, [userId, ruleType]);
      
      return result.rows.length > 0;
    } catch (error) {
      logger.error(`Error deleting user rule ${ruleType} for user ${userId}:`, error);
      throw error;
    }
  },

  /**
   * Получить активные правила пользователя для применения
   * @param {string} userId - ID пользователя
   * @returns {Promise<Object>} - Включенные правила
   */
  async getActiveUserRules(userId) {
    try {
      const query = `
        SELECT rule_type, settings_json
        FROM user_global_rules
        WHERE user_id = $1 AND enabled = true
        ORDER BY rule_type
      `;
      
      const result = await databaseService.query(query, [userId]);
      
      const rules = {};
      result.rows.forEach(row => {
        rules[row.rule_type] = row.settings_json;
      });
      
      return rules;
    } catch (error) {
      logger.error(`Error getting active user rules for user ${userId}:`, error);
      throw error;
    }
  }
};

module.exports = userGlobalRulesService;

