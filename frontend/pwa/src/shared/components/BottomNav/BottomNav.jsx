import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useStreamsStore } from '@features/streams/store/streamsStore';
import { HapticFeedback } from '@shared/utils/hapticFeedback';
import './BottomNav.css';

const BottomNav = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('home');
  const goToHome = useStreamsStore((state) => state.goToHome);
  const activeStreams = useStreamsStore((state) => state.activeStreams);

  const tabs = [
    {
      id: 'home',
      label: t('navigation.home', 'Главная'),
      icon: '🏠',
      onClick: () => {
        HapticFeedback.selection();
        setActiveTab('home');
        goToHome();
      }
    },
    {
      id: 'streams',
      label: t('navigation.streams', 'Стримы'),
      icon: '📺',
      count: activeStreams.length,
      onClick: () => {
        HapticFeedback.selection();
        setActiveTab('streams');
      }
    },
    {
      id: 'settings',
      label: t('navigation.settings', 'Настройки'),
      icon: '⚙️',
      onClick: () => {
        HapticFeedback.selection();
        setActiveTab('settings');
      }
    }
  ];

  return (
    <nav className="bottom-nav">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          className={`bottom-nav__item ${activeTab === tab.id ? 'bottom-nav__item--active' : ''}`}
          onClick={tab.onClick}
          aria-label={tab.label}
        >
          <div className="bottom-nav__icon">
            <span>{tab.icon}</span>
            {tab.count > 0 && (
              <span className="bottom-nav__badge">{tab.count}</span>
            )}
          </div>
          <span className="bottom-nav__label">{tab.label}</span>
        </button>
      ))}
    </nav>
  );
};

export default BottomNav;
