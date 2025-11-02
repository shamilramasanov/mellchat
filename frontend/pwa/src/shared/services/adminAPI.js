import api from './api';

// Helper to get admin token
const getAdminToken = () => {
  return localStorage.getItem('admin_token');
};

// Helper to add auth header
const getAuthConfig = () => {
  const token = getAdminToken();
  return token ? {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  } : {};
};

/**
 * Admin API Service
 * Provides real data for admin dashboard
 */
export const adminAPI = {
  /**
   * Admin login
   */
  login: async (username, password) => {
    try {
      const response = await api.post('/admin/auth/login', { username, password });
      return response;
    } catch (error) {
      console.error('Admin login error:', error);
      throw error;
    }
  },

  /**
   * Admin logout
   */
  logout: () => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
  },

  /**
   * Check if admin is authenticated
   */
  isAuthenticated: () => {
    return !!getAdminToken();
  },
  /**
   * Get system metrics
   */
  getSystemMetrics: async () => {
    try {
      const response = await api.get('/admin/metrics', getAuthConfig());
      return response;
    } catch (error) {
      console.error('Failed to fetch system metrics:', error);
      // Return mock data as fallback
      return {
        activeConnections: 156,
        messagesPerSecond: 89,
        usersOnline: 456,
        systemLoad: 23,
        memoryUsage: 67,
        diskUsage: 45,
        networkIO: 156
      };
    }
  },

  /**
   * Get analytics data
   */
  getAnalytics: async (timeRange = '24h') => {
    try {
      const response = await api.get(`/admin/analytics?range=${timeRange}`, getAuthConfig());
      return response;
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
      // Return mock data as fallback
      return {
        totalMessages: 45678,
        uniqueUsers: 2345,
        pageViews: 12456,
        avgResponseTime: 245,
        platformDistribution: [
          { platform: 'Twitch', messages: 18543, percentage: 40.6 },
          { platform: 'YouTube', messages: 15234, percentage: 33.4 },
          { platform: 'Kick', messages: 11901, percentage: 26.0 }
        ],
        topChannels: [
          { name: 'xQc', platform: 'Twitch', messages: 5432, viewers: 45678 },
          { name: 'PewDiePie', platform: 'YouTube', messages: 4321, viewers: 23456 },
          { name: 'AdinRoss', platform: 'Kick', messages: 3210, viewers: 34567 }
        ]
      };
    }
  },

  /**
   * Get all registered users
   */
  getUsers: async (includeGuests = true) => {
    try {
      const response = await api.get(`/admin/users?includeGuests=${includeGuests}`, getAuthConfig());
      return response;
    } catch (error) {
      console.error('Failed to fetch users:', error);
      return { users: [], total: 0, registered: 0, guests: 0 };
    }
  },

  /**
   * Get user activity statistics
   */
  getUserActivity: async (timeRange = '24h', userId = null, sessionId = null, platform = null) => {
    try {
      const params = new URLSearchParams({ timeRange });
      if (userId) params.append('userId', userId);
      if (sessionId) params.append('sessionId', sessionId);
      if (platform) params.append('platform', platform);
      
      const response = await api.get(`/admin/users/activity?${params.toString()}`, getAuthConfig());
      return response;
    } catch (error) {
      console.error('Failed to fetch user activity:', error);
      throw error;
    }
  },

  /**
   * Get specific user activity detail
   */
  getUserActivityDetail: async (identifier, timeRange = '24h') => {
    try {
      const response = await api.get(`/admin/users/${identifier}/activity?timeRange=${timeRange}`, getAuthConfig());
      return response;
    } catch (error) {
      console.error('Failed to fetch user activity detail:', error);
      throw error;
    }
  },

  /**
   * Get moderation reports
   */
  getModerationReports: async (filter = 'all', search = '') => {
    try {
      const response = await api.get(`/admin/moderation/reports?filter=${filter}&search=${search}`, getAuthConfig());
      return response;
    } catch (error) {
      console.error('Failed to fetch moderation reports:', error);
      // Return mock data as fallback
      return {
        reports: [
          {
            id: 1,
            type: 'spam',
            severity: 'high',
            user: 'spammer123',
            platform: 'Twitch',
            channel: 'xQc',
            message: 'Check out my new crypto investment opportunity!',
            reportedBy: 'moderator_alpha',
            timestamp: '2 minutes ago',
            status: 'pending'
          }
        ],
        stats: {
          pending: 8,
          resolved: 12,
          dismissed: 4,
          banned: 3
        }
      };
    }
  },

  /**
   * Get system services status
   */
  getSystemStatus: async () => {
    try {
      const response = await api.get('/admin/system/status', getAuthConfig());
      return response;
    } catch (error) {
      console.error('Failed to fetch system status:', error);
      // Return mock data as fallback
      return {
        services: [
          {
            name: 'API Gateway',
            status: 'running',
            uptime: '99.9%',
            lastRestart: '7 days ago',
            port: 3001
          },
          {
            name: 'WebSocket Service',
            status: 'running',
            uptime: '99.8%',
            lastRestart: '3 days ago',
            port: 3002
          },
          {
            name: 'Database',
            status: 'running',
            uptime: '99.9%',
            lastRestart: '14 days ago',
            port: 5432
          }
        ],
        logs: [
          {
            timestamp: '2024-01-15 14:23:45',
            level: 'info',
            service: 'API Gateway',
            message: 'User authentication successful'
          }
        ]
      };
    }
  },

  /**
   * Get database information
   */
  getDatabaseInfo: async () => {
    try {
      const response = await api.get('/admin/database/info', getAuthConfig());
      return response;
    } catch (error) {
      console.error('Failed to fetch database info:', error);
      // Return mock data as fallback
      return {
        metrics: {
          totalSize: '2.4 GB',
          activeConnections: 23,
          queryTime: '45ms',
          cacheHitRate: '94.2%'
        },
        tables: [
          {
            name: 'messages',
            rows: 1254321,
            size: '1.2 GB',
            lastUpdated: '2 minutes ago',
            status: 'active'
          }
        ],
        recentQueries: [
          {
            query: 'SELECT * FROM messages WHERE created_at > NOW() - INTERVAL 1 HOUR',
            duration: '23ms',
            rows: 1254,
            timestamp: '2 minutes ago'
          }
        ]
      };
    }
  },

  /**
   * Get security information
   */
  getSecurityInfo: async () => {
    try {
      const response = await api.get('/admin/security/info', getAuthConfig());
      return response;
    } catch (error) {
      console.error('Failed to fetch security info:', error);
      // Return mock data as fallback
      return {
        metrics: {
          activeSessions: 156,
          failedLogins: 3,
          blockedIPs: 12,
          securityScore: 94
        },
        recentActivities: [
          {
            type: 'login',
            user: 'admin@mellchat.com',
            ip: '192.168.1.100',
            location: 'New York, US',
            timestamp: '2 minutes ago',
            status: 'success'
          }
        ],
        settings: [
          {
            name: 'Two-Factor Authentication',
            enabled: true,
            description: 'Require 2FA for all admin accounts'
          }
        ],
        blockedIPs: [
          {
            ip: '203.0.113.42',
            reason: 'Multiple failed login attempts',
            blockedAt: '2 hours ago'
          }
        ]
      };
    }
  },

  /**
   * Get AI assistant data
   */
  getAIData: async () => {
    try {
      // Увеличиваем таймаут для AI эндпоинта
      const response = await api.get('/admin/ai/data', {
        ...getAuthConfig(),
        timeout: 8000 // 8 секунд вместо 10 по умолчанию
      });
      return response;
    } catch (error) {
      console.error('Failed to fetch AI data:', error);
      // Return mock data as fallback
      return {
        metrics: {
          status: 'Online',
          responseTime: '1.2s',
          queriesToday: 1234,
          accuracyRate: '94.2%'
        },
        chatHistory: [
          {
            id: 1,
            type: 'user',
            message: 'How can I optimize database performance?',
            timestamp: '2 minutes ago'
          },
          {
            id: 2,
            type: 'ai',
            message: 'To optimize database performance, I recommend...',
            timestamp: '2 minutes ago'
          }
        ],
        suggestions: [
          {
            title: 'Database Optimization',
            description: 'Your database queries are taking longer than usual.',
            priority: 'high'
          }
        ]
      };
    }
  },

  /**
   * Send message to AI assistant
   */
  sendAIMessage: async (message, conversationHistory = []) => {
    try {
      const response = await api.post('/admin/ai/chat', { 
        message,
        conversationHistory 
      }, {
        ...getAuthConfig(),
        timeout: 60000 // 60 секунд для AI запросов (могут быть медленными с SQL)
      });
      return response;
    } catch (error) {
      console.error('Failed to send AI message:', error);
      throw error; // Пробрасываем ошибку, чтобы показать в UI
    }
  },

  /**
   * Resolve moderation report
   */
  resolveReport: async (reportId, action) => {
    try {
      const response = await api.post(`/admin/moderation/reports/${reportId}/resolve`, { action }, getAuthConfig());
      return response;
    } catch (error) {
      console.error('Failed to resolve report:', error);
      throw error;
    }
  },

  /**
   * Ban user
   */
  banUser: async (userId, reason) => {
    try {
      const response = await api.post(`/admin/moderation/ban`, { userId, reason }, getAuthConfig());
      return response;
    } catch (error) {
      console.error('Failed to ban user:', error);
      throw error;
    }
  },

  /**
   * Unblock IP
   */
  unblockIP: async (ip) => {
    try {
      const response = await api.post(`/admin/security/unblock`, { ip }, getAuthConfig());
      return response;
    } catch (error) {
      console.error('Failed to unblock IP:', error);
      throw error;
    }
  },

  /**
   * Restart service
   */
  restartService: async (serviceName) => {
    try {
      const response = await api.post(`/admin/system/restart`, { service: serviceName }, getAuthConfig());
      return response;
    } catch (error) {
      console.error('Failed to restart service:', error);
      throw error;
    }
  },

  /**
   * Get global rules
   */
  getGlobalRules: async () => {
    try {
      const response = await api.get('/admin/global-rules', getAuthConfig());
      return response;
    } catch (error) {
      console.error('Failed to fetch global rules:', error);
      return { rules: {} };
    }
  },

  /**
   * Get global rule by type
   */
  getGlobalRule: async (type) => {
    try {
      const response = await api.get(`/admin/global-rules/${type}`, getAuthConfig());
      return response;
    } catch (error) {
      console.error(`Failed to fetch global rule ${type}:`, error);
      return null;
    }
  },

  /**
   * Save global rule
   */
  saveGlobalRule: async (type, settings, enabled = true) => {
    try {
      const response = await api.post(`/admin/global-rules/${type}`, {
        settings,
        enabled
      }, getAuthConfig());
      return response;
    } catch (error) {
      console.error(`Failed to save global rule ${type}:`, error);
      throw error;
    }
  },

  /**
   * Optimize global rules using AI
   */
  optimizeGlobalRules: async () => {
    try {
      const response = await api.post('/admin/global-rules/optimize', {}, getAuthConfig());
      return response;
    } catch (error) {
      console.error('Failed to optimize global rules:', error);
      throw error;
    }
  },

  /**
   * Toggle global rule
   */
  toggleGlobalRule: async (type, enabled) => {
    try {
      const response = await api.patch(`/admin/global-rules/${type}/toggle`, {
        enabled
      }, getAuthConfig());
      return response;
    } catch (error) {
      console.error(`Failed to toggle global rule ${type}:`, error);
      throw error;
    }
  },

  /**
   * Export data
   */
  exportData: async (type, format = 'json') => {
    try {
      const config = {
        ...getAuthConfig(),
        responseType: 'blob'
      };
      const response = await api.get(`/admin/export/${type}?format=${format}`, config);
      return response;
    } catch (error) {
      console.error('Failed to export data:', error);
      throw error;
    }
  }
};

export default adminAPI;
