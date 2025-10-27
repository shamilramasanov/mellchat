// frontend/pwa/src/shared/components/ApiErrorToast/ApiErrorToast.jsx
import React from 'react';
import { useApiErrorHandler } from '@shared/hooks/useApiErrorHandler';
import './ApiErrorToast.css';

const ApiErrorToast = () => {
  const { errors, clearError, getServerErrorMessage } = useApiErrorHandler();

  if (errors.length === 0) return null;

  return (
    <div className="api-error-toast">
      {errors.map(error => (
        <div 
          key={error.id} 
          className={`api-error-toast__item ${error.isServerOffline ? 'server-offline' : 'api-error'}`}
        >
          <div className="api-error-toast__icon">
            {error.isServerOffline ? '🔴' : '⚠️'}
          </div>
          <div className="api-error-toast__content">
            <div className="api-error-toast__title">
              {error.isServerOffline ? 'Сервер недоступен' : 'Ошибка API'}
            </div>
            <div className="api-error-toast__message">
              {error.isServerOffline ? getServerErrorMessage() : error.message}
            </div>
            {error.context && (
              <div className="api-error-toast__context">
                {error.context}
              </div>
            )}
          </div>
          <button 
            className="api-error-toast__close"
            onClick={() => clearError(error.id)}
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
};

export default ApiErrorToast;
