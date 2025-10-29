import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useAdminStore = create(
  persist(
    (set, get) => ({
      // === AUTHENTICATION ===
      isAuthenticated: false,
      adminUser: null,
      token: null,

      // === DASHBOARD DATA ===
      metrics: {
        activeConnections: 0,
        messagesPerSecond: 0,
        usersOnline: 0,
        platformStatus: {
          twitch: 'unknown',
          youtube: 'unknown',
          kick: 'unknown'
        },
        dbPerformance: {
          avgResponseTime: 0,
          slowQueries: 0
        },
        redisStatus: {
          memoryUsage: 0,
          keyCount: 0
        },
        aiStatus: {
          available: false,
          lastUpdate: null
        }
      },

      // === CHARTS DATA ===
      charts: {
        messageFlow: [],
        platformDistribution: [],
        sentimentTrends: [],
        spamDetection: [],
        systemLoad: [],
        errorRate: []
      },

      // === AI INSIGHTS ===
      aiRecommendations: [],
      aiInsights: {},
      aiAlerts: [],

      // === SYSTEM SETTINGS ===
      settings: {
        spamDetection: {
          enabled: true,
          threshold: 0.7,
          autoBlock: false
        },
        sentimentAnalysis: {
          enabled: true,
          sensitivity: 'medium'
        },
        userReputation: {
          enabled: true,
          algorithm: 'default'
        },
        rateLimiting: {
          enabled: true,
          messagesPerMinute: 30
        }
      },

      // === USER MANAGEMENT ===
      users: [],
      moderationActions: [],
      blockedUsers: [],

      // === SYSTEM HEALTH ===
      systemHealth: {
        status: 'unknown',
        uptime: 0,
        lastError: null,
        alerts: []
      },

      // === WEBSOCKET ===
      wsConnection: null,
      isConnected: false,
      lastUpdate: null,

      // === LOADING STATES ===
      loading: {
        metrics: false,
        charts: false,
        users: false,
        settings: false
      },

      // === ACTIONS ===
      
      // Authentication
      login: async (credentials) => {
        try {
          set({ loading: { ...get().loading, auth: true } });
          
          const response = await fetch('/api/v1/admin/auth/login', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(credentials)
          });

          if (!response.ok) {
            throw new Error('Login failed');
          }

          const data = await response.json();
          
          set({
            isAuthenticated: true,
            adminUser: data.user,
            token: data.token,
            loading: { ...get().loading, auth: false }
          });

          return { success: true };
        } catch (error) {
          set({ loading: { ...get().loading, auth: false } });
          return { success: false, error: error.message };
        }
      },

      logout: () => {
        set({
          isAuthenticated: false,
          adminUser: null,
          token: null
        });
      },

      // Metrics
      updateMetrics: (newMetrics) => {
        set({ metrics: { ...get().metrics, ...newMetrics } });
      },

      fetchMetrics: async () => {
        try {
          set({ loading: { ...get().loading, metrics: true } });
          
          const response = await fetch('/api/v1/admin/dashboard/metrics', {
            headers: {
              'Authorization': `Bearer ${get().token}`
            }
          });

          if (!response.ok) {
            throw new Error('Failed to fetch metrics');
          }

          const metrics = await response.json();
          set({ 
            metrics: { ...get().metrics, ...metrics },
            loading: { ...get().loading, metrics: false }
          });

          return { success: true };
        } catch (error) {
          set({ loading: { ...get().loading, metrics: false } });
          return { success: false, error: error.message };
        }
      },

      // Charts
      updateCharts: (chartData) => {
        set({ charts: { ...get().charts, ...chartData } });
      },

      fetchCharts: async (timeRange = '24h') => {
        try {
          set({ loading: { ...get().loading, charts: true } });
          
          const response = await fetch(`/api/v1/admin/dashboard/charts?range=${timeRange}`, {
            headers: {
              'Authorization': `Bearer ${get().token}`
            }
          });

          if (!response.ok) {
            throw new Error('Failed to fetch charts');
          }

          const charts = await response.json();
          set({ 
            charts: { ...get().charts, ...charts },
            loading: { ...get().loading, charts: false }
          });

          return { success: true };
        } catch (error) {
          set({ loading: { ...get().loading, charts: false } });
          return { success: false, error: error.message };
        }
      },

      // AI Insights
      updateAIRecommendations: (recommendations) => {
        set({ aiRecommendations: recommendations });
      },

      fetchAIInsights: async () => {
        try {
          const response = await fetch('/api/v1/admin/ai/insights', {
            headers: {
              'Authorization': `Bearer ${get().token}`
            }
          });

          if (!response.ok) {
            throw new Error('Failed to fetch AI insights');
          }

          const insights = await response.json();
          set({ 
            aiRecommendations: insights.recommendations || [],
            aiInsights: insights.insights || {},
            aiAlerts: insights.alerts || []
          });

          return { success: true };
        } catch (error) {
          return { success: false, error: error.message };
        }
      },

      // Settings
      updateSettings: (newSettings) => {
        set({ settings: { ...get().settings, ...newSettings } });
      },

      saveSettings: async (settings) => {
        try {
          const response = await fetch('/api/v1/admin/settings', {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${get().token}`
            },
            body: JSON.stringify(settings)
          });

          if (!response.ok) {
            throw new Error('Failed to save settings');
          }

          set({ settings: { ...get().settings, ...settings } });
          return { success: true };
        } catch (error) {
          return { success: false, error: error.message };
        }
      },

      // User Management
      fetchUsers: async (filters = {}) => {
        try {
          set({ loading: { ...get().loading, users: true } });
          
          const queryParams = new URLSearchParams(filters).toString();
          const response = await fetch(`/api/v1/admin/users?${queryParams}`, {
            headers: {
              'Authorization': `Bearer ${get().token}`
            }
          });

          if (!response.ok) {
            throw new Error('Failed to fetch users');
          }

          const users = await response.json();
          set({ 
            users: users,
            loading: { ...get().loading, users: false }
          });

          return { success: true };
        } catch (error) {
          set({ loading: { ...get().loading, users: false } });
          return { success: false, error: error.message };
        }
      },

      blockUser: async (userId, reason, duration) => {
        try {
          const response = await fetch('/api/v1/admin/users/block', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${get().token}`
            },
            body: JSON.stringify({ userId, reason, duration })
          });

          if (!response.ok) {
            throw new Error('Failed to block user');
          }

          // Update local state
          const users = get().users.map(user => 
            user.id === userId 
              ? { ...user, blocked: true, blockReason: reason }
              : user
          );
          set({ users });

          return { success: true };
        } catch (error) {
          return { success: false, error: error.message };
        }
      },

      // System Health
      updateSystemHealth: (health) => {
        set({ systemHealth: { ...get().systemHealth, ...health } });
      },

      fetchSystemHealth: async () => {
        try {
          const response = await fetch('/api/v1/admin/system/health', {
            headers: {
              'Authorization': `Bearer ${get().token}`
            }
          });

          if (!response.ok) {
            throw new Error('Failed to fetch system health');
          }

          const health = await response.json();
          set({ systemHealth: { ...get().systemHealth, ...health } });

          return { success: true };
        } catch (error) {
          return { success: false, error: error.message };
        }
      },

      // AI Assistant
      sendAIMessage: async (message) => {
        try {
          const response = await fetch('/api/v1/admin/ai/chat', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${get().token}`
            },
            body: JSON.stringify({ message })
          });

          if (!response.ok) {
            throw new Error('Failed to send AI message');
          }

          const data = await response.json();
          return { success: true, response: data.response };
        } catch (error) {
          return { success: false, error: error.message };
        }
      },

      // === WEBSOCKET METHODS ===
      connectWebSocket: () => {
        const { wsConnection, disconnectWebSocket } = get();
        
        if (wsConnection) {
          disconnectWebSocket();
        }

        try {
          const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
          const wsUrl = `${protocol}//${window.location.host}`;
          const ws = new WebSocket(wsUrl);

          ws.onopen = () => {
            console.log('Admin WebSocket connected');
            set({ isConnected: true });
            
            // Подписываемся на админ метрики
            ws.send(JSON.stringify({ type: 'admin:subscribe' }));
          };

          ws.onmessage = (event) => {
            try {
              const data = JSON.parse(event.data);
              
              if (data.type === 'admin:metrics') {
                set({ 
                  metrics: data.data,
                  lastUpdate: data.timestamp
                });
              } else if (data.type === 'admin:alert') {
                const { aiAlerts } = get();
                set({ 
                  aiAlerts: [...aiAlerts, data.data]
                });
              }
            } catch (error) {
              console.error('Error parsing WebSocket message:', error);
            }
          };

          ws.onclose = () => {
            console.log('Admin WebSocket disconnected');
            set({ isConnected: false });
            
            // Переподключаемся через 5 секунд
            setTimeout(() => {
              get().connectWebSocket();
            }, 5000);
          };

          ws.onerror = (error) => {
            console.error('Admin WebSocket error:', error);
            set({ isConnected: false });
          };

          set({ wsConnection: ws });
        } catch (error) {
          console.error('Failed to connect WebSocket:', error);
          set({ isConnected: false });
        }
      },

      disconnectWebSocket: () => {
        const { wsConnection } = get();
        
        if (wsConnection) {
          wsConnection.send(JSON.stringify({ type: 'admin:unsubscribe' }));
          wsConnection.close();
          set({ wsConnection: null, isConnected: false });
        }
      }
    }),
    {
      name: 'admin-store',
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
        adminUser: state.adminUser,
        token: state.token,
        settings: state.settings
      })
    }
  )
);

export default useAdminStore;
