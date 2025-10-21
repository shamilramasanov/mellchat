import React from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import './ThemeSettings.css';

const ThemeSettings = ({ isOpen, onClose }) => {
  const { t } = useTranslation();
  const { language, updateLanguage } = useTheme();
  const { user, isAuthenticated, login, logout, loading } = useAuth();

  if (!isOpen) return null;

  const languages = [
    { code: 'ru', name: t('theme.language.ru') || 'Русский', flag: '🇷🇺' },
    { code: 'en', name: t('theme.language.en') || 'English', flag: '🇺🇸' },
    { code: 'uk', name: t('theme.language.uk') || 'Українська', flag: '🇺🇦' }
  ];

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal theme-settings" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">{t('theme.title') || 'Настройки'}</h3>
          <button className="modal-close" onClick={onClose} aria-label="Закрыть">
            ✕
          </button>
        </div>
        
        <div className="modal-content">
          {/* User Profile / Login */}
          <div className="setting-group">
            <label className="setting-label">
              <span className="setting-icon">👤</span>
              {t('auth.account') || 'Аккаунт'}
            </label>
            {loading ? (
              <div className="auth-loading">
                <span>⏳</span> {t('auth.loading') || 'Загрузка...'}
              </div>
            ) : isAuthenticated && user ? (
              <div className="user-profile">
                <div className="user-info">
                  {user.avatar && (
                    <img src={user.avatar} alt={user.name} className="user-avatar" />
                  )}
                  <div className="user-details">
                    <div className="user-name">{user.name}</div>
                    <div className="user-email">{user.email}</div>
                  </div>
                </div>
                <button className="btn-logout" onClick={logout}>
                  {t('auth.logout') || 'Выйти'}
                </button>
              </div>
            ) : (
              <button className="btn-login" onClick={login}>
                <span className="google-icon">🔐</span>
                {t('auth.login') || 'Войти через Google'}
              </button>
            )}
          </div>

          {/* Language Selection */}
          <div className="setting-group">
            <label className="setting-label">
              <span className="setting-icon">🌍</span>
              {t('theme.language.label') || 'Язык'}
            </label>
            <div className="language-options">
              {languages.map((lang) => (
                <button
                  key={lang.code}
                  className={`language-option ${language === lang.code ? 'active' : ''}`}
                  onClick={() => updateLanguage(lang.code)}
                >
                  <span className="language-flag">{lang.flag}</span>
                  <span className="language-name">{lang.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* System Info */}
          <div className="setting-group">
            <label className="setting-label">
              <span className="setting-icon">ℹ️</span>
              {t('theme.system') || 'Система'}
            </label>
            <div className="system-info">
              <div className="info-item">
                <span className="info-label">{t('theme.system.language') || 'Системный язык'}</span>
                <span className="info-value">{navigator.language}</span>
              </div>
              <div className="info-item">
                <span className="info-label">{t('theme.system.design') || 'Дизайн'}</span>
                <span className="info-value">Material Design 3</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ThemeSettings;
