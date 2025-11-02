import { useState, useEffect, useCallback } from 'react';
import adminAPI from '@shared/services/adminAPI';

/**
 * Custom hook for admin data management
 */
export const useAdminData = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  // Generic data fetcher
  const fetchData = useCallback(async (apiCall, setData) => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await apiCall();
      setData(data);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Failed to fetch admin data:', err);
      setError(err.message || 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    lastUpdated,
    fetchData
  };
};

/**
 * Hook for system metrics
 */
export const useSystemMetrics = () => {
  const [metrics, setMetrics] = useState(null);
  const { loading, error, lastUpdated, fetchData } = useAdminData();

  const loadMetrics = useCallback(() => {
    fetchData(adminAPI.getSystemMetrics, setMetrics);
  }, [fetchData]);

  useEffect(() => {
    loadMetrics();
    // Auto-refresh every 30 seconds
    const interval = setInterval(loadMetrics, 30000);
    return () => clearInterval(interval);
  }, [loadMetrics]);

  return {
    metrics,
    loading,
    error,
    lastUpdated,
    refresh: loadMetrics
  };
};

/**
 * Hook for analytics data
 */
export const useAnalytics = (timeRange = '24h') => {
  const [analytics, setAnalytics] = useState(null);
  const { loading, error, lastUpdated, fetchData } = useAdminData();

  const loadAnalytics = useCallback(() => {
    fetchData(() => adminAPI.getAnalytics(timeRange), setAnalytics);
  }, [fetchData, timeRange]);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  return {
    analytics,
    loading,
    error,
    lastUpdated,
    refresh: loadAnalytics
  };
};

/**
 * Hook for moderation reports
 */
export const useModerationReports = (filter = 'all', search = '') => {
  const [reports, setReports] = useState(null);
  const { loading, error, lastUpdated, fetchData } = useAdminData();

  const loadReports = useCallback(() => {
    fetchData(() => adminAPI.getModerationReports(filter, search), setReports);
  }, [fetchData, filter, search]);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  const resolveReport = useCallback(async (reportId, action) => {
    try {
      await adminAPI.resolveReport(reportId, action);
      loadReports(); // Refresh data
    } catch (err) {
      throw err;
    }
  }, [loadReports]);

  const banUser = useCallback(async (userId, reason) => {
    try {
      await adminAPI.banUser(userId, reason);
      loadReports(); // Refresh data
    } catch (err) {
      throw err;
    }
  }, [loadReports]);

  return {
    reports,
    loading,
    error,
    lastUpdated,
    refresh: loadReports,
    resolveReport,
    banUser
  };
};

/**
 * Hook for system status
 */
export const useSystemStatus = () => {
  const [status, setStatus] = useState(null);
  const { loading, error, lastUpdated, fetchData } = useAdminData();

  const loadStatus = useCallback(() => {
    fetchData(adminAPI.getSystemStatus, setStatus);
  }, [fetchData]);

  useEffect(() => {
    loadStatus();
    // Auto-refresh every 15 seconds
    const interval = setInterval(loadStatus, 15000);
    return () => clearInterval(interval);
  }, [loadStatus]);

  const restartService = useCallback(async (serviceName) => {
    try {
      await adminAPI.restartService(serviceName);
      loadStatus(); // Refresh data
    } catch (err) {
      throw err;
    }
  }, [loadStatus]);

  return {
    status,
    loading,
    error,
    lastUpdated,
    refresh: loadStatus,
    restartService
  };
};

/**
 * Hook for database info
 */
export const useDatabaseInfo = () => {
  const [dbInfo, setDbInfo] = useState(null);
  const { loading, error, lastUpdated, fetchData } = useAdminData();

  const loadDbInfo = useCallback(() => {
    fetchData(adminAPI.getDatabaseInfo, setDbInfo);
  }, [fetchData]);

  useEffect(() => {
    loadDbInfo();
  }, [loadDbInfo]);

  return {
    dbInfo,
    loading,
    error,
    lastUpdated,
    refresh: loadDbInfo
  };
};

/**
 * Hook for security info
 */
export const useSecurityInfo = () => {
  const [security, setSecurity] = useState(null);
  const { loading, error, lastUpdated, fetchData } = useAdminData();

  const loadSecurity = useCallback(() => {
    fetchData(adminAPI.getSecurityInfo, setSecurity);
  }, [fetchData]);

  useEffect(() => {
    loadSecurity();
  }, [loadSecurity]);

  const unblockIP = useCallback(async (ip) => {
    try {
      await adminAPI.unblockIP(ip);
      loadSecurity(); // Refresh data
    } catch (err) {
      throw err;
    }
  }, [loadSecurity]);

  return {
    security,
    loading,
    error,
    lastUpdated,
    refresh: loadSecurity,
    unblockIP
  };
};

/**
 * Hook for AI assistant
 */
export const useAIAssistant = () => {
  const [aiData, setAiData] = useState(null);
  const [chatHistory, setChatHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const { loading, error, lastUpdated, fetchData } = useAdminData();
  
  // Используем прямой импорт константы (избегаем require в браузере)
  const STORAGE_KEY = 'mellchat_ai_chat_history';

  // Загружаем историю из localStorage при монтировании
  useEffect(() => {
    try {
      const savedHistory = localStorage.getItem(STORAGE_KEY);
      if (savedHistory) {
        const parsed = JSON.parse(savedHistory);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setChatHistory(parsed);
        }
      }
    } catch (error) {
      console.error('Failed to load AI chat history from localStorage:', error);
    }
  }, [STORAGE_KEY]);

  // Сохраняем историю в localStorage при каждом изменении
  useEffect(() => {
    try {
      if (chatHistory.length > 0) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(chatHistory));
      } else {
        // Очищаем localStorage если история пустая
        localStorage.removeItem(STORAGE_KEY);
      }
    } catch (error) {
      console.error('Failed to save AI chat history to localStorage:', error);
    }
  }, [chatHistory, STORAGE_KEY]);

  const loadAIData = useCallback(() => {
    fetchData(adminAPI.getAIData, setAiData);
  }, [fetchData]);

  // Загружаем AI данные только при монтировании
  useEffect(() => {
    loadAIData();
  }, [loadAIData]);

  // Устанавливаем начальную историю чата только один раз при первой загрузке (если нет сохраненной)
  useEffect(() => {
    if (aiData?.chatHistory && chatHistory.length === 0) {
      // Только если в localStorage нет истории
      try {
        const savedHistory = localStorage.getItem(STORAGE_KEY);
        if (!savedHistory || JSON.parse(savedHistory).length === 0) {
          setChatHistory(aiData.chatHistory);
        }
      } catch (error) {
        // Если ошибка парсинга - используем данные из API
        if (chatHistory.length === 0) {
          setChatHistory(aiData.chatHistory);
        }
      }
    }
  }, [aiData?.chatHistory, STORAGE_KEY]);

  const sendMessage = useCallback(async (message) => {
    setIsLoading(true);
    
    // Сразу добавляем сообщение пользователя в историю
    const userMessage = {
      id: `user-${Date.now()}`,
      type: 'user',
      message,
      timestamp: new Date().toISOString()
    };
    
    setChatHistory(prev => [...prev, userMessage]);
    
    try {
      // Передаем текущую историю чата для контекста
      const currentHistory = chatHistory.map(msg => ({
        role: msg.type === 'user' ? 'user' : 'assistant',
        content: msg.message || msg.text
      }));
      
      const response = await adminAPI.sendAIMessage(message, currentHistory);
      
      // Добавляем ответ ИИ в историю
      const aiMessage = {
        id: `ai-${Date.now()}`,
        type: 'ai',
        message: response.response || response.message || 'Нет ответа',
        timestamp: response.timestamp || new Date().toISOString(),
        sqlQuery: response.sqlQuery, // Сохраняем SQL запрос если был
        sqlResult: response.sqlResult // Сохраняем результаты SQL если были
      };
      
      setChatHistory(prev => {
        // Убеждаемся, что пользовательское сообщение уже есть
        const hasUserMsg = prev.some(m => m.id === userMessage.id);
        const newHistory = hasUserMsg ? prev : [...prev, userMessage];
        return [...newHistory, aiMessage];
      });
      
      // Обновляем данные AI после успешного запроса
      loadAIData();
    } catch (err) {
      console.error('Failed to send AI message:', err);
      
      // Добавляем сообщение об ошибке с деталями
      const errorMessage = {
        id: `error-${Date.now()}`,
        type: 'ai',
        message: `Ошибка: ${err.response?.data?.message || err.message || 'Не удалось отправить сообщение'}. ${err.code === 'ECONNABORTED' ? 'Запрос занял слишком много времени. Попробуйте упростить вопрос.' : ''}`,
        timestamp: new Date().toISOString()
      };
      
      setChatHistory(prev => [...prev, errorMessage]);
      // Не пробрасываем ошибку дальше, показываем в UI
    } finally {
      setIsLoading(false);
    }
  }, [chatHistory]);

  return {
    aiData,
    chatHistory,
    loading,
    error,
    lastUpdated,
    isLoading,
    refresh: loadAIData,
    sendMessage
  };
};

/**
 * Hook for users list
 */
export const useUsers = (includeGuests = true) => {
  const [users, setUsers] = useState(null);
  const { loading, error, lastUpdated, fetchData } = useAdminData();

  const loadUsers = useCallback(() => {
    fetchData(() => adminAPI.getUsers(includeGuests), setUsers);
  }, [fetchData, includeGuests]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  return {
    users: users?.users || [],
    total: users?.total || 0,
    registered: users?.registered || 0,
    guests: users?.guests || 0,
    loading,
    error,
    lastUpdated,
    refresh: loadUsers
  };
};
