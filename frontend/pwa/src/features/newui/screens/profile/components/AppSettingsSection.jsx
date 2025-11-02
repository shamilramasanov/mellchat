import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Bell, Globe, Settings as SettingsIcon } from 'lucide-react';
import { userAPI } from '@shared/services/api';
import { useChatStore } from '@features/chat/store/chatStore';
import './AppSettingsSection.css';

export function AppSettingsSection({ settings, onSettingsChange }) {
  const { t, i18n } = useTranslation();
  const [localSettings, setLocalSettings] = useState(settings || {
    notifications: true,
    moodBarEnabled: false,
    language: 'ru',
    fontSize: 'medium',
    compactMode: false
  });
  const [isSaving, setIsSaving] = useState(false);

  const moodEnabled = useChatStore((state) => state.moodEnabled);
  const toggleMoodEnabled = useChatStore((state) => state.toggleMoodEnabled);

  useEffect(() => {
    if (settings) {
      setLocalSettings(settings);
    }
  }, [settings]);

  const handleSettingChange = async (key, value) => {
    const newSettings = { ...localSettings, [key]: value };
    setLocalSettings(newSettings);
    
    if (onSettingsChange) {
      onSettingsChange(newSettings);
    }

    try {
      setIsSaving(true);
      await userAPI.saveSettings(newSettings);
    } catch (error) {
      console.error('Error saving settings:', error);
      // Откатываем изменение при ошибке
      setLocalSettings(localSettings);
    } finally {
      setIsSaving(false);
    }
  };

  const handleLanguageChange = (lang) => {
    i18n.changeLanguage(lang);
    handleSettingChange('language', lang);
  };

  const languages = [
    { code: 'ru', name: 'Русский', flag: '🇷🇺' },
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'uk', name: 'Українська', flag: '🇺🇦' }
  ];

  return (
    <div className="settings-section-card">
      <div className="settings-section-header">
        <SettingsIcon className="h-5 w-5 text-gray-600" />
        <h2 className="settings-section-title">Настройки приложения</h2>
      </div>

      <div className="settings-list">
        {/* Уведомления */}
        <div className="settings-item">
          <div className="settings-item-content">
            <Bell className="h-4 w-4 text-gray-500" />
            <div className="settings-item-text">
              <span className="settings-item-label">Уведомления</span>
              <span className="settings-item-description">
                Включить уведомления о новых сообщениях
              </span>
            </div>
          </div>
          <label className="toggle-switch">
            <input
              type="checkbox"
              checked={localSettings.notifications}
              onChange={(e) => handleSettingChange('notifications', e.target.checked)}
              disabled={isSaving}
            />
            <span className="toggle-slider" />
          </label>
        </div>

        {/* MoodBar фильтр */}
        <div className="settings-item">
          <div className="settings-item-content">
            <span className="text-pink-500">😊</span>
            <div className="settings-item-text">
              <span className="settings-item-label">MoodBar</span>
              <span className="settings-item-description">
                Скрывать спам и негативные сообщения
              </span>
            </div>
          </div>
          <label className="toggle-switch">
            <input
              type="checkbox"
              checked={moodEnabled}
              onChange={() => {
                toggleMoodEnabled();
                handleSettingChange('moodBarEnabled', !moodEnabled);
              }}
              disabled={isSaving}
            />
            <span className="toggle-slider" />
          </label>
        </div>

        {/* Язык */}
        <div className="settings-item">
          <div className="settings-item-content">
            <Globe className="h-4 w-4 text-gray-500" />
            <div className="settings-item-text">
              <span className="settings-item-label">Язык интерфейса</span>
            </div>
          </div>
          <div className="language-buttons">
            {languages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => handleLanguageChange(lang.code)}
                className={`language-button ${
                  localSettings.language === lang.code ? 'language-button-active' : ''
                }`}
                disabled={isSaving}
              >
                <span>{lang.flag}</span>
                <span>{lang.name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

