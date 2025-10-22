import React from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '../UI';
import './SettingsPanel.css';

export const SettingsPanel = ({ isOpen, onClose, settings, onSettingsChange }) => {
  const { t, i18n } = useTranslation();

  const handleLanguageChange = (lang) => {
    i18n.changeLanguage(lang);
    onSettingsChange({ language: lang });
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div className="settings-overlay" onClick={onClose}></div>
      
      {/* Panel */}
      <div className={`settings-panel ${isOpen ? 'settings-panel--open' : ''}`}>
        <div className="settings-panel__header">
          <h2 className="settings-panel__title">{t('settings.title')}</h2>
          <button className="settings-panel__close" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="settings-panel__content">
          {/* Language */}
          <div className="settings-group">
            <label className="settings-label">{t('settings.language')}</label>
            <div className="settings-options">
              <button
                className={`settings-option ${i18n.language === 'en' ? 'settings-option--active' : ''}`}
                onClick={() => handleLanguageChange('en')}
              >
                🇺🇸 {t('lang.en')}
              </button>
              <button
                className={`settings-option ${i18n.language === 'ru' ? 'settings-option--active' : ''}`}
                onClick={() => handleLanguageChange('ru')}
              >
                🇷🇺 {t('lang.ru')}
              </button>
              <button
                className={`settings-option ${i18n.language === 'uk' ? 'settings-option--active' : ''}`}
                onClick={() => handleLanguageChange('uk')}
              >
                🇺🇦 {t('lang.uk')}
              </button>
            </div>
          </div>

          {/* Translation */}
          <div className="settings-group">
            <label className="settings-label">
              <input
                type="checkbox"
                className="settings-checkbox"
                checked={settings.autoTranslate || false}
                onChange={(e) => onSettingsChange({ autoTranslate: e.target.checked })}
              />
              {t('settings.translation')}
            </label>
          </div>

          {/* Font Size */}
          <div className="settings-group">
            <label className="settings-label">{t('settings.fontSize')}</label>
            <div className="settings-options">
              {['small', 'medium', 'large', 'xlarge'].map(size => (
                <button
                  key={size}
                  className={`settings-option ${settings.fontSize === size ? 'settings-option--active' : ''}`}
                  onClick={() => onSettingsChange({ fontSize: size })}
                >
                  {t(`settings.fontSize${size.charAt(0).toUpperCase() + size.slice(1)}`)}
                </button>
              ))}
            </div>
          </div>

          {/* Auto Scroll */}
          <div className="settings-group">
            <label className="settings-label">
              <input
                type="checkbox"
                className="settings-checkbox"
                checked={settings.autoScroll !== false}
                onChange={(e) => onSettingsChange({ autoScroll: e.target.checked })}
              />
              {t('settings.autoScroll')}
            </label>
          </div>

          {/* Auto Scroll Delay */}
          {settings.autoScroll !== false && (
            <div className="settings-group">
              <label className="settings-label">{t('settings.autoScrollDelay')}</label>
              <input
                type="range"
                className="settings-range"
                min="3"
                max="15"
                step="1"
                value={settings.autoScrollDelay || 5}
                onChange={(e) => onSettingsChange({ autoScrollDelay: parseInt(e.target.value) })}
              />
              <span className="settings-value">{settings.autoScrollDelay || 5}s</span>
            </div>
          )}

          {/* Density */}
          <div className="settings-group">
            <label className="settings-label">{t('settings.density')}</label>
            <div className="settings-options">
              {['compact', 'comfortable', 'spacious'].map(density => (
                <button
                  key={density}
                  className={`settings-option ${settings.density === density ? 'settings-option--active' : ''}`}
                  onClick={() => onSettingsChange({ density })}
                >
                  {t(`settings.density${density.charAt(0).toUpperCase() + density.slice(1)}`)}
                </button>
              ))}
            </div>
          </div>

          {/* Notifications */}
          <div className="settings-group">
            <label className="settings-label">{t('settings.notifications')}</label>
            <label className="settings-label">
              <input
                type="checkbox"
                className="settings-checkbox"
                checked={settings.notifyMessages || false}
                onChange={(e) => onSettingsChange({ notifyMessages: e.target.checked })}
              />
              {t('settings.notifyMessages')}
            </label>
            <label className="settings-label">
              <input
                type="checkbox"
                className="settings-checkbox"
                checked={settings.notifyQuestions || false}
                onChange={(e) => onSettingsChange({ notifyQuestions: e.target.checked })}
              />
              {t('settings.notifyQuestions')}
            </label>
          </div>

          {/* History Retention */}
          <div className="settings-group">
            <label className="settings-label">{t('settings.historyRetention')}</label>
            <input
              type="number"
              className="settings-input"
              min="1"
              max="365"
              value={settings.historyRetention || 30}
              onChange={(e) => onSettingsChange({ historyRetention: parseInt(e.target.value) })}
            />
          </div>

          {/* Nickname Colors */}
          <div className="settings-group">
            <label className="settings-label">{t('settings.nicknameColors')}</label>
            <div className="settings-options">
              {['random', 'platform', 'mono'].map(colorMode => (
                <button
                  key={colorMode}
                  className={`settings-option ${settings.nicknameColors === colorMode ? 'settings-option--active' : ''}`}
                  onClick={() => onSettingsChange({ nicknameColors: colorMode })}
                >
                  {t(`settings.nicknameColor${colorMode.charAt(0).toUpperCase() + colorMode.slice(1)}`)}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="settings-panel__footer">
          <Button variant="primary" fullWidth onClick={onClose}>
            {t('common.close')}
          </Button>
        </div>
      </div>
    </>
  );
};

