import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
// import { Modal, Button } from '@shared/components'; // Удалены - используем обычные элементы с glass эффектами
import { useSettingsStore } from '../store/settingsStore';
import { FONT_SIZES, DISPLAY_DENSITY, NICKNAME_COLOR_MODES, LANGUAGES, LANGUAGE_FLAGS } from '@shared/utils/constants';
import './SettingsPanel.css';

const SettingsPanel = ({ isOpen, onClose }) => {
  const { t, i18n } = useTranslation();
  
  const fontSize = useSettingsStore((state) => state.fontSize);
  const setFontSize = useSettingsStore((state) => state.setFontSize);
  const displayDensity = useSettingsStore((state) => state.displayDensity);
  const setDisplayDensity = useSettingsStore((state) => state.setDisplayDensity);
  const nicknameColors = useSettingsStore((state) => state.nicknameColors);
  const setNicknameColors = useSettingsStore((state) => state.setNicknameColors);
  const notifyQuestions = useSettingsStore((state) => state.notifyQuestions);
  const setNotifyQuestions = useSettingsStore((state) => state.setNotifyQuestions);

  // Theme state

  const handleLanguageChange = (lang) => {
    i18n.changeLanguage(lang);
  };


  if (!isOpen) return null;

  return (
    <>
      {/* Modal Overlay */}
      <div className="settings-modal__overlay" onClick={onClose}>
        <div className="settings-modal" onClick={(e) => e.stopPropagation()}>
          {/* Modal Header */}
          <div className="settings-modal__header">
            <h2 className="settings-modal__title">{t('settings.title')}</h2>
            <button className="settings-modal__close" onClick={onClose}>
              ✕
            </button>
          </div>

          {/* Modal Content */}
          <div className="settings-panel">

        {/* Language */}
        <div className="settings-section">
          <h3 className="settings-section__title">{t('settings.language')}</h3>
          <div className="settings-options">
            {Object.values(LANGUAGES).map((lang) => (
              <button
                key={lang}
                className={`settings-option ${i18n.language === lang ? 'settings-option--active' : ''}`}
                onClick={() => handleLanguageChange(lang)}
              >
                <span>{LANGUAGE_FLAGS[lang]}</span>
                <span>{lang.toUpperCase()}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Font Size */}
        <div className="settings-section">
          <h3 className="settings-section__title">{t('settings.fontSize')}</h3>
          <div className="settings-options">
            <button
              className={`settings-option ${fontSize === FONT_SIZES.SMALL ? 'settings-option--active' : ''}`}
              onClick={() => setFontSize(FONT_SIZES.SMALL)}
            >
              {t('settings.fontSizeSmall')}
            </button>
            <button
              className={`settings-option ${fontSize === FONT_SIZES.MEDIUM ? 'settings-option--active' : ''}`}
              onClick={() => setFontSize(FONT_SIZES.MEDIUM)}
            >
              {t('settings.fontSizeMedium')}
            </button>
            <button
              className={`settings-option ${fontSize === FONT_SIZES.LARGE ? 'settings-option--active' : ''}`}
              onClick={() => setFontSize(FONT_SIZES.LARGE)}
            >
              {t('settings.fontSizeLarge')}
            </button>
            <button
              className={`settings-option ${fontSize === FONT_SIZES.XLARGE ? 'settings-option--active' : ''}`}
              onClick={() => setFontSize(FONT_SIZES.XLARGE)}
            >
              {t('settings.fontSizeXLarge')}
            </button>
          </div>
        </div>

        {/* Display Density */}
        <div className="settings-section">
          <h3 className="settings-section__title">{t('settings.displayDensity')}</h3>
          <div className="settings-options">
            <button
              className={`settings-option ${displayDensity === DISPLAY_DENSITY.COMPACT ? 'settings-option--active' : ''}`}
              onClick={() => setDisplayDensity(DISPLAY_DENSITY.COMPACT)}
            >
              {t('settings.densityCompact')}
            </button>
            <button
              className={`settings-option ${displayDensity === DISPLAY_DENSITY.COMFORTABLE ? 'settings-option--active' : ''}`}
              onClick={() => setDisplayDensity(DISPLAY_DENSITY.COMFORTABLE)}
            >
              {t('settings.densityComfortable')}
            </button>
            <button
              className={`settings-option ${displayDensity === DISPLAY_DENSITY.SPACIOUS ? 'settings-option--active' : ''}`}
              onClick={() => setDisplayDensity(DISPLAY_DENSITY.SPACIOUS)}
            >
              {t('settings.densitySpacious')}
            </button>
          </div>
        </div>

        {/* Auto Scroll - REMOVED to avoid conflicts with ChatContainer logic */}

        {/* Nickname Colors */}
        <div className="settings-section">
          <h3 className="settings-section__title">{t('settings.nicknameColors')}</h3>
          <div className="settings-options">
            <button
              className={`settings-option ${nicknameColors === NICKNAME_COLOR_MODES.RANDOM ? 'settings-option--active' : ''}`}
              onClick={() => setNicknameColors(NICKNAME_COLOR_MODES.RANDOM)}
            >
              {t('settings.nicknameRandom')}
            </button>
            <button
              className={`settings-option ${nicknameColors === NICKNAME_COLOR_MODES.PLATFORM ? 'settings-option--active' : ''}`}
              onClick={() => setNicknameColors(NICKNAME_COLOR_MODES.PLATFORM)}
            >
              {t('settings.nicknamePlatform')}
            </button>
            <button
              className={`settings-option ${nicknameColors === NICKNAME_COLOR_MODES.MONO ? 'settings-option--active' : ''}`}
              onClick={() => setNicknameColors(NICKNAME_COLOR_MODES.MONO)}
            >
              {t('settings.nicknameMono')}
            </button>
          </div>
        </div>

        {/* Notifications */}
        <div className="settings-section">
          <div className="settings-toggle">
            <label htmlFor="notifyQuestions">{t('settings.notifyQuestions')}</label>
            <input
              id="notifyQuestions"
              type="checkbox"
              checked={notifyQuestions}
              onChange={(e) => setNotifyQuestions(e.target.checked)}
            />
          </div>
        </div>

        {/* Close Button */}
        <button 
          className="settings-modal__button settings-modal__button--primary"
          onClick={onClose}
        >
          {t('settings.close')}
        </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default SettingsPanel;
