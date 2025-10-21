import React from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../contexts/ThemeContext';
import './ThemeSettings.css';

const ThemeSettings = ({ isOpen, onClose }) => {
  const { t } = useTranslation();
  const { 
    theme, 
    language, 
    updateTheme, 
    updateLanguage, 
    resetToSystem 
  } = useTheme();

  if (!isOpen) return null;

  const languages = [
    { code: 'ru', name: t('theme.language.ru'), flag: '🇷🇺' },
    { code: 'en', name: t('theme.language.en'), flag: '🇺🇸' },
    { code: 'uk', name: t('theme.language.uk'), flag: '🇺🇦' }
  ];

  const themes = [
    { code: 'light', name: t('theme.theme.light'), icon: '☀️' },
    { code: 'dark', name: t('theme.theme.dark'), icon: '🌙' },
    { code: 'auto', name: t('theme.theme.auto'), icon: '🔄' }
  ];

  const handleThemeChange = (newTheme) => {
    if (newTheme === 'auto') {
      resetToSystem();
    } else {
      updateTheme(newTheme);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal theme-settings" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{t('theme.title')}</h3>
          <button className="modal-close" onClick={onClose}>
            ✕
          </button>
        </div>
        
        <div className="modal-content">
          {/* Theme Selection */}
          <div className="setting-group">
            <label className="setting-label">
              <span className="setting-icon">🎨</span>
              Тема оформления
            </label>
            <div className="theme-options">
              {themes.map((themeOption) => (
                <button
                  key={themeOption.code}
                  className={`theme-option ${theme === themeOption.code ? 'active' : ''}`}
                  onClick={() => handleThemeChange(themeOption.code)}
                >
                  <span className="theme-icon">{themeOption.icon}</span>
                  <span className="theme-name">{themeOption.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Language Selection */}
          <div className="setting-group">
            <label className="setting-label">
              <span className="setting-icon">🌍</span>
              Язык интерфейса
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
              Системные настройки
            </label>
            <div className="system-info">
              <div className="info-item">
                <span className="info-label">Системная тема:</span>
                <span className="info-value">
                  {window.matchMedia('(prefers-color-scheme: dark)').matches ? 'Темная' : 'Светлая'}
                </span>
              </div>
              <div className="info-item">
                <span className="info-label">Системный язык:</span>
                <span className="info-value">{navigator.language}</span>
              </div>
            </div>
          </div>

          {/* Reset Button */}
          <div className="setting-group">
            <button 
              className="btn-reset"
              onClick={resetToSystem}
              title="Сбросить к системным настройкам"
            >
              🔄 Сбросить к системным настройкам
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ThemeSettings;
