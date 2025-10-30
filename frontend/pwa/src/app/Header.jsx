import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@features/auth/store/authStore';
import { useStreamsStore } from '@features/streams/store/streamsStore';
import { useChatStore } from '@features/chat/store/chatStore';
// import { useThemeContext } from '@shared/components'; // Убираем переключение темы
import SettingsPanel from '@features/settings/components/SettingsPanel';
import MoodButton from '@features/chat/components/MoodButton';
import MoodDropdown from '@features/chat/components/MoodDropdown';
import './Header.css';

const Header = () => {
  const { t } = useTranslation();
  const user = useAuthStore((state) => state.user);
  const goToHome = useStreamsStore((state) => state.goToHome);
  const currentMood = useChatStore((state) => state.currentMood);
  // const { theme, toggleTheme, isDark } = useThemeContext(); // Убираем переключение темы
  const [showSettings, setShowSettings] = useState(false);
  const [showMoodDropdown, setShowMoodDropdown] = useState(false);

  const handleLogoClick = () => {
    // Navigate back to home (show all active streams)
    goToHome();
  };

  return (
    <>
      <header className="header">
        <div className="header__content">
          {/* Logo */}
          <button className="header__logo" onClick={handleLogoClick}>
            <span className="gradient-text">MellChat</span>
            <span className="header__version">v2.0</span>
          </button>

          {/* Actions */}
          <div className="header__actions">
            {user && (
              <button
                className="header__action"
                title={user.name || user.email}
              >
                <span style={{ position: 'relative', zIndex: 100 }}>
                  {user.avatar ? (
                    <img 
                      src={user.avatar} 
                      alt={user.name}
                      className="header__user-avatar"
                    />
                  ) : (
                    '👤'
                  )}
                </span>
              </button>
            )}

            <div className="header__mood-wrapper" style={{ position: 'relative' }}>
              <MoodButton mood={currentMood} onClick={() => setShowMoodDropdown(!showMoodDropdown)} />
              <MoodDropdown 
                mood={currentMood} 
                isOpen={showMoodDropdown}
                onClose={() => setShowMoodDropdown(false)} 
              />
            </div>

            {/* Убираем кнопку переключения темы */}

            <button
              className="header__action"
              onClick={() => setShowSettings(true)}
              aria-label={t('settings.title')}
            >
              <span style={{ position: 'relative', zIndex: 100 }}>⚙</span>
            </button>
          </div>
        </div>
      </header>

      {/* Settings Modal */}
      <SettingsPanel 
        isOpen={showSettings} 
        onClose={() => setShowSettings(false)} 
      />

    </>
  );
};

export default Header;
