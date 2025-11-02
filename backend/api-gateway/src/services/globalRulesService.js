// Global Rules Service - управление глобальными правилами фильтрации
const logger = require('../utils/logger');
const databaseService = require('./databaseService');

const globalRulesService = {
  /**
   * Получить все глобальные правила
   * @returns {Promise<Object>} - Объект с правилами по типам
   */
  async getAllRules() {
    try {
      const query = `
        SELECT rule_type, settings_json, enabled, updated_at
        FROM global_rules
        ORDER BY rule_type
      `;
      
      const result = await databaseService.query(query);
      
      const rules = {};
      result.rows.forEach(row => {
        rules[row.rule_type] = {
          enabled: row.enabled,
          settings: row.settings_json,
          updatedAt: row.updated_at
        };
      });
      
      return rules;
    } catch (error) {
      logger.error('Error getting global rules:', error);
      throw error;
    }
  },

  /**
   * Получить правило по типу
   * @param {string} ruleType - Тип правила
   * @returns {Promise<Object|null>} - Правило или null
   */
  async getRule(ruleType) {
    try {
      const query = `
        SELECT rule_type, settings_json, enabled, updated_at
        FROM global_rules
        WHERE rule_type = $1
      `;
      
      const result = await databaseService.query(query, [ruleType]);
      
      if (result.rows.length === 0) {
        return null;
      }
      
      const row = result.rows[0];
      return {
        enabled: row.enabled,
        settings: row.settings_json,
        updatedAt: row.updated_at
      };
    } catch (error) {
      logger.error(`Error getting rule ${ruleType}:`, error);
      throw error;
    }
  },

  /**
   * Сохранить или обновить правило
   * @param {string} ruleType - Тип правила
   * @param {Object} settings - Настройки правила
   * @param {boolean} enabled - Включено ли правило
   * @param {string} updatedBy - ID администратора
   * @returns {Promise<Object>} - Обновленное правило
   */
  async saveRule(ruleType, settings, enabled = true, updatedBy = null) {
    try {
      const query = `
        INSERT INTO global_rules (rule_type, settings_json, enabled, updated_by, updated_at)
        VALUES ($1, $2, $3, $4, NOW())
        ON CONFLICT (rule_type) 
        DO UPDATE SET
          settings_json = EXCLUDED.settings_json,
          enabled = EXCLUDED.enabled,
          updated_by = EXCLUDED.updated_by,
          updated_at = NOW()
        RETURNING rule_type, settings_json, enabled, updated_at
      `;
      
      const result = await databaseService.query(query, [
        ruleType,
        JSON.stringify(settings),
        enabled,
        updatedBy
      ]);
      
      if (result.rows.length === 0) {
        throw new Error('Failed to save rule');
      }
      
      const row = result.rows[0];
      return {
        ruleType: row.rule_type,
        enabled: row.enabled,
        settings: row.settings_json,
        updatedAt: row.updated_at
      };
    } catch (error) {
      logger.error(`Error saving rule ${ruleType}:`, error);
      throw error;
    }
  },

  /**
   * Включить/выключить правило
   * @param {string} ruleType - Тип правила
   * @param {boolean} enabled - Включено ли правило
   * @returns {Promise<boolean>} - Успешно ли обновлено
   */
  async toggleRule(ruleType, enabled) {
    try {
      const query = `
        UPDATE global_rules
        SET enabled = $1, updated_at = NOW()
        WHERE rule_type = $2
        RETURNING enabled
      `;
      
      const result = await databaseService.query(query, [enabled, ruleType]);
      
      return result.rows.length > 0;
    } catch (error) {
      logger.error(`Error toggling rule ${ruleType}:`, error);
      throw error;
    }
  },

  /**
   * Получить правила для применения (только включенные)
   * @returns {Promise<Object>} - Включенные правила
   */
  async getActiveRules() {
    try {
      const query = `
        SELECT rule_type, settings_json
        FROM global_rules
        WHERE enabled = true
        ORDER BY rule_type
      `;
      
      const result = await databaseService.query(query);
      
      const rules = {};
      result.rows.forEach(row => {
        rules[row.rule_type] = row.settings_json;
      });
      
      return rules;
    } catch (error) {
      logger.error('Error getting active rules:', error);
      throw error;
    }
  }
};

module.exports = globalRulesService;

