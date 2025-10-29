const databaseService = require('./databaseService');
const logger = require('../utils/logger');

class AuditService {
  constructor() {
    // Таблица создается автоматически при первой записи или через миграцию
  }

  /**
   * Создание таблицы для audit log
   */
  async ensureTable() {
    try {
      await databaseService.query(`
        CREATE TABLE IF NOT EXISTS admin_audit_log (
          id SERIAL PRIMARY KEY,
          admin_user_id VARCHAR(255),
          action VARCHAR(100) NOT NULL,
          target_type VARCHAR(50),
          target_id VARCHAR(255),
          details JSONB,
          ip_address INET,
          user_agent TEXT,
          created_at TIMESTAMP DEFAULT NOW()
        );
        
        CREATE INDEX IF NOT EXISTS idx_audit_log_admin_id ON admin_audit_log(admin_user_id);
        CREATE INDEX IF NOT EXISTS idx_audit_log_action ON admin_audit_log(action);
        CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON admin_audit_log(created_at);
      `);
    } catch (error) {
      logger.warn('Audit table creation skipped:', error.message);
    }
  }

  /**
   * Логирование действия админа
   */
  async logAction(adminUserId, action, targetType = null, targetId = null, details = {}, ipAddress = null, userAgent = null) {
    try {
      await this.ensureTable();

      await databaseService.query(
        `INSERT INTO admin_audit_log 
         (admin_user_id, action, target_type, target_id, details, ip_address, user_agent)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [adminUserId, action, targetType, targetId, JSON.stringify(details), ipAddress, userAgent]
      );

      logger.info(`Audit log: ${action} by ${adminUserId}`);
    } catch (error) {
      logger.error('Audit log error:', error);
      // Не прерываем выполнение, если логирование не удалось
    }
  }

  /**
   * Получение истории логов
   */
  async getAuditLog(limit = 100, offset = 0, filters = {}) {
    try {
      await this.ensureTable();

      let query = `SELECT * FROM admin_audit_log WHERE 1=1`;
      const params = [];
      let paramIndex = 1;

      if (filters.adminUserId) {
        query += ` AND admin_user_id = $${paramIndex++}`;
        params.push(filters.adminUserId);
      }

      if (filters.action) {
        query += ` AND action = $${paramIndex++}`;
        params.push(filters.action);
      }

      if (filters.targetType) {
        query += ` AND target_type = $${paramIndex++}`;
        params.push(filters.targetType);
      }

      if (filters.fromDate) {
        query += ` AND created_at >= $${paramIndex++}`;
        params.push(filters.fromDate);
      }

      if (filters.toDate) {
        query += ` AND created_at <= $${paramIndex++}`;
        params.push(filters.toDate);
      }

      query += ` ORDER BY created_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
      params.push(limit, offset);

      const result = await databaseService.query(query, params);

      return result.rows.map(row => ({
        id: row.id,
        adminUserId: row.admin_user_id,
        action: row.action,
        targetType: row.target_type,
        targetId: row.target_id,
        details: row.details,
        ipAddress: row.ip_address,
        userAgent: row.user_agent,
        createdAt: row.created_at
      }));
    } catch (error) {
      logger.error('Get audit log error:', error);
      throw error;
    }
  }

  /**
   * Статистика по действиям
   */
  async getAuditStats(timeRange = '24h') {
    try {
      await this.ensureTable();

      const interval = this._getInterval(timeRange);

      const query = `
        SELECT 
          action,
          COUNT(*) as count,
          COUNT(DISTINCT admin_user_id) as unique_admins
        FROM admin_audit_log
        WHERE created_at > NOW() - INTERVAL '${interval}'
        GROUP BY action
        ORDER BY count DESC
      `;

      const result = await databaseService.query(query);

      return result.rows.map(row => ({
        action: row.action,
        count: parseInt(row.count),
        uniqueAdmins: parseInt(row.unique_admins)
      }));
    } catch (error) {
      logger.error('Get audit stats error:', error);
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

module.exports = new AuditService();

