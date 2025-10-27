// frontend/pwa/src/shared/hooks/useServerHealth.js
import { useState, useEffect, useCallback } from 'react';
import serverHealthService from '../services/serverHealth';

export const useServerHealth = () => {
  const [status, setStatus] = useState(() => serverHealthService.getStatus());
  const [isChecking, setIsChecking] = useState(false);

  useEffect(() => {
    // Подписываемся на изменения статуса
    const unsubscribe = serverHealthService.subscribe((newStatus) => {
      setStatus(newStatus);
    });

    // Запускаем автоматическую проверку
    serverHealthService.startAutoCheck();

    // Очистка при размонтировании
    return () => {
      unsubscribe();
      serverHealthService.stopAutoCheck();
    };
  }, []);

  // Принудительная проверка
  const checkHealth = useCallback(async () => {
    setIsChecking(true);
    try {
      const result = await serverHealthService.forceCheck();
      return result;
    } finally {
      setIsChecking(false);
    }
  }, []);

  return {
    ...status,
    isChecking,
    checkHealth,
    // Удобные флаги
    isOnline: status.isOnline,
    isOffline: !status.isOnline,
    hasRetries: status.retryCount > 0,
    lastCheckTime: status.lastCheck,
  };
};
