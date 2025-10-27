// frontend/pwa/src/shared/hooks/useApiErrorHandler.js
import { useState, useCallback } from 'react';
import { useServerHealth } from './useServerHealth';

export const useApiErrorHandler = () => {
  const { isOnline } = useServerHealth();
  const [errors, setErrors] = useState([]);

  const handleError = useCallback((error, context = '') => {
    const errorInfo = {
      id: Date.now(),
      message: error.message || 'Неизвестная ошибка',
      context,
      timestamp: new Date(),
      isServerOffline: !isOnline
    };

    setErrors(prev => [...prev, errorInfo]);

    // Автоматически удаляем ошибку через 10 секунд
    setTimeout(() => {
      setErrors(prev => prev.filter(e => e.id !== errorInfo.id));
    }, 10000);

    return errorInfo;
  }, [isOnline]);

  const clearError = useCallback((errorId) => {
    setErrors(prev => prev.filter(e => e.id !== errorId));
  }, []);

  const clearAllErrors = useCallback(() => {
    setErrors([]);
  }, []);

  const getServerErrorMessage = useCallback(() => {
    if (!isOnline) {
      return 'Сервер недоступен. Проверьте подключение к интернету и убедитесь, что сервер запущен.';
    }
    return null;
  }, [isOnline]);

  return {
    errors,
    handleError,
    clearError,
    clearAllErrors,
    getServerErrorMessage,
    hasErrors: errors.length > 0,
    isServerOffline: !isOnline
  };
};
