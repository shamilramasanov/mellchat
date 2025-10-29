import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { API_URL } from '@shared/utils/constants';

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
      reconnectAttempts: 0,

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
          
          const response = await fetch(`${API_URL}/api/v1/admin/auth/login`, {
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
          
          const response = await fetch(`${API_URL}/api/v1/admin/dashboard/metrics`, {
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
          
          const response = await fetch(`${API_URL}/api/v1/admin/dashboard/charts?range=${timeRange}`, {
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
          const response = await fetch(`${API_URL}/api/v1/admin/ai/insights`, {
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
          const response = await fetch(`${API_URL}/api/v1/admin/settings`, {
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

      blockUser: async (userId, reason) => {
        try {
          const response = await fetch(`${API_URL}/api/v1/admin/users/block`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${get().token}`
            },
            body: JSON.stringify({ userId, reason })
          });

          if (!response.ok) {
            throw new Error('Failed to block user');
          }

          const data = await response.json();
          
          // Update blocked users list
          const { blockedUsers } = get();
          set({ blockedUsers: [...blockedUsers, data.user] });

          return { success: true };
        } catch (error) {
          return { success: false, error: error.message };
        }
      },

      unblockUser: async (userId) => {
        try {
          const response = await fetch(`${API_URL}/api/v1/admin/users/unblock`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${get().token}`
            },
            body: JSON.stringify({ userId })
          });

          if (!response.ok) {
            throw new Error('Failed to unblock user');
          }

          // Update blocked users list
          const { blockedUsers } = get();
          set({ blockedUsers: blockedUsers.filter(u => u.userId !== userId) });

          return { success: true };
        } catch (error) {
          return { success: false, error: error.message };
        }
      },

      fetchConnectedUsers: async () => {
        try {
          const response = await fetch(`${API_URL}/api/v1/admin/users/connected`, {
            headers: {
              'Authorization': `Bearer ${get().token}`
            }
          });

          if (!response.ok) {
            throw new Error('Failed to fetch connected users');
          }

          const data = await response.json();
          return { success: true, users: data.users, total: data.total };
        } catch (error) {
          return { success: false, error: error.message };
        }
      },

      fetchBlockedUsers: async () => {
        try {
          const response = await fetch(`${API_URL}/api/v1/admin/users/blocked`, {
            headers: {
              'Authorization': `Bearer ${get().token}`
            }
          });

          if (!response.ok) {
            throw new Error('Failed to fetch blocked users');
          }

          const data = await response.json();
          set({ blockedUsers: data.users });
          return { success: true, users: data.users };
        } catch (error) {
          return { success: false, error: error.message };
        }
      },

      fetchConnections: async () => {
        try {
          const response = await fetch(`${API_URL}/api/v1/admin/connections/list`, {
            headers: {
              'Authorization': `Bearer ${get().token}`
            }
          });

          if (!response.ok) {
            throw new Error('Failed to fetch connections');
          }

          const data = await response.json();
          return { success: true, connections: data.connections, total: data.total };
        } catch (error) {
          return { success: false, error: error.message };
        }
      },

      disconnectConnection: async (connectionId) => {
        try {
          const response = await fetch(`${API_URL}/api/v1/admin/connections/disconnect`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${get().token}`
            },
            body: JSON.stringify({ connectionId })
          });

          if (!response.ok) {
            throw new Error('Failed to disconnect connection');
          }

          return { success: true };
        } catch (error) {
          return { success: false, error: error.message };
        }
      },

      // Отправка сообщения всем подключенным пользователям
      broadcastMessage: async (message) => {
        try {
          const response = await fetch(`${API_URL}/api/v1/admin/broadcast`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${get().token}`
            },
            body: JSON.stringify({ message })
          });

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || 'Failed to broadcast message');
          }

          const data = await response.json();
          return { success: true, sentCount: data.sentCount, message: data.message };
        } catch (error) {
          return { success: false, error: error.message };
        }
      },

      // Отправка сообщения конкретному пользователю
      sendMessageToUser: async (userId, message) => {
        try {
          const response = await fetch(`${API_URL}/api/v1/admin/message`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${get().token}`
            },
            body: JSON.stringify({ userId, message })
          });

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || 'Failed to send message to user');
          }

          const data = await response.json();
          return { success: true, sentCount: data.sentCount, message: data.message };
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
          const response = await fetch(`${API_URL}/api/v1/admin/system/health`, {
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
          const response = await fetch(`${API_URL}/api/v1/admin/ai/chat`, {
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
            set({ isConnected: true, reconnectAttempts: 0 }); // Сбрасываем счетчик при успешном подключении
            
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

          ws.onclose = (event) => {
            console.log('Admin WebSocket disconnected', event.code, event.reason);
            set({ isConnected: false, wsConnection: null });
            
            // Переподключаемся только если это не было намеренное закрытие (код 1000)
            // и не было критической ошибки (коды 1006, 1011, 1012)
            if (event.code !== 1000 && event.code !== 1006 && event.code !== 1011 && event.code !== 1012) {
              const { reconnectAttempts = 0 } = get();
              
              // Ограничиваем количество попыток до 10
              if (reconnectAttempts < 10) {
                const delay = Math.min(5000 * (reconnectAttempts + 1), 30000); // Увеличиваем задержку до 30 сек
                console.log(`Reconnecting Admin WebSocket in ${delay}ms (attempt ${reconnectAttempts + 1}/10)`);
                
                setTimeout(() => {
                  const current = get();
                  // Проверяем, что соединение все еще закрыто и не было создано новое
                  if (!current.wsConnection && !current.isConnected) {
                    set({ reconnectAttempts: reconnectAttempts + 1 });
                    get().connectWebSocket();
                  }
                }, delay);
              } else {
                console.warn('Max reconnection attempts reached for Admin WebSocket');
              }
            }
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
          // Проверяем состояние WebSocket перед отправкой
          if (wsConnection.readyState === WebSocket.OPEN) {
            try {
              wsConnection.send(JSON.stringify({ type: 'admin:unsubscribe' }));
            } catch (error) {
              console.warn('Failed to send unsubscribe message:', error);
            }
          }
          
          // Закрываем соединение только если оно еще не закрыто
          if (wsConnection.readyState !== WebSocket.CLOSED && wsConnection.readyState !== WebSocket.CLOSING) {
            wsConnection.close();
          }
          
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
