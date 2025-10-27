// frontend/pwa/src/shared/components/ServerErrorBanner/ServerErrorBanner.jsx
import React, { useState, useEffect } from 'react';
import { useServerHealth } from '@shared/hooks/useServerHealth';
import './ServerErrorBanner.css';

const ServerErrorBanner = () => {
  const { isOffline, retryCount, lastCheckTime } = useServerHealth();
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    if (isOffline && !isDismissed) {
      setIsVisible(true);
    } else {
      setIsVisible(false);
    }
  }, [isOffline, isDismissed]);

  const handleDismiss = () => {
    setIsDismissed(true);
    setIsVisible(false);
  };

  const handleRetry = () => {
    setIsDismissed(false);
    // Принудительная проверка будет вызвана через useServerHealth
  };

  if (!isVisible) return null;

  return (
    <div className="server-error-banner">
      <div className="server-error-banner__content">
        <div className="server-error-banner__icon">
          🔴
        </div>
        <div className="server-error-banner__text">
          <div className="server-error-banner__title">
            Сервер недоступен
          </div>
          <div className="server-error-banner__description">
            Не удается подключиться к серверу. Попыток: {retryCount}
          </div>
        </div>
        <div className="server-error-banner__actions">
          <button 
            className="server-error-banner__retry"
            onClick={handleRetry}
          >
            Повторить
          </button>
          <button 
            className="server-error-banner__dismiss"
            onClick={handleDismiss}
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  );
};

export default ServerErrorBanner;
