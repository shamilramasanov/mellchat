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
    resetToDefaults 
  } = useTheme();

  if (!isOpen) return null;

  const languages = [
    { code: 'ru', name: t('theme.language.ru') || 'Русский', flag: '🇷🇺' },
    { code: 'en', name: t('theme.language.en') || 'English', flag: '🇺🇸' },
    { code: 'uk', name: t('theme.language.uk') || 'Українська', flag: '🇺🇦' }
  ];

  const themes = [
    { code: 'retro', name: t('theme.theme.retro') || 'Ретро (Win95)', icon: '💾' },
    { code: 'win11', name: t('theme.theme.win11') || 'Windows 11', icon: '🪟' },
    { code: 'macos', name: t('theme.theme.macos') || 'macOS', icon: '🍎' }
  ];

  const handleThemeChange = (newTheme) => {
    updateTheme(newTheme);
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal theme-settings" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{t('theme.title') || 'Настройки интерфейса'}</h3>
          <button className="modal-close" onClick={onClose}>
            ✕
          </button>
        </div>
        
        <div className="modal-content">
          {/* Theme Selection */}
          <div className="setting-group">
            <label className="setting-label">
              <span className="setting-icon">🎨</span>
              {t('theme.theme.label') || 'Стиль'}
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
              {t('theme.language.label') === 'Язык' ? 'Система' : 'System'}
            </label>
            <div className="system-info">
              <div className="info-item">
                <span className="info-label">{t('theme.language.label') === 'Язык' ? 'Системный язык:' : 'System language:'}</span>
                <span className="info-value">{navigator.language}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ThemeSettings;
