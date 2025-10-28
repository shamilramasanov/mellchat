import React, { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useChatStore } from '../store/chatStore';
import './MoodDropdown.css';

const MoodDropdown = ({ mood, isOpen, onClose }) => {
  const { t } = useTranslation();
  const { moodEnabled, toggleMoodEnabled } = useChatStore();
  const dropdownRef = useRef(null);

  // Закрытие при клике вне dropdown
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        onClose();
      }
    };

    // Добавляем обработчик с небольшой задержкой, чтобы не сработал клик по кнопке
    const timeout = setTimeout(() => {
      document.addEventListener('click', handleClickOutside);
    }, 0);

    return () => {
      clearTimeout(timeout);
      document.removeEventListener('click', handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !mood) {
    return null;
  }

  const { happy = 0, neutral = 0, sad = 0 } = mood;
  const total = happy + neutral + sad;

  if (total === 0) {
    return (
      <div ref={dropdownRef} className="mood-dropdown">
        <div className="mood-dropdown__toggle" onClick={(e) => e.stopPropagation()}>
          <span className="mood-dropdown__toggle-label">{t('mood.label')}</span>
          <button 
            className={`mood-dropdown__toggle-btn ${moodEnabled ? 'enabled' : 'disabled'}`}
            onClick={toggleMoodEnabled}
            title={t('mood.toggle')}
          >
            <span className="mood-dropdown__toggle-slider"></span>
          </button>
        </div>
        <div className="mood-dropdown__empty">
          <span className="mood-dropdown__empty-icon">🤷</span>
          <p>{t('mood.noData')}</p>
        </div>
      </div>
    );
  }

  const happyPercent = Math.round((happy / total) * 100);
  const neutralPercent = Math.round((neutral / total) * 100);
  const sadPercent = Math.round((sad / total) * 100);

  const getMoodColor = () => {
    // Если много негатива (>40%) - красный
    if (sadPercent >= 40) return '#F44336';
    
    // Если много позитива (>50%) - зелёный
    if (happyPercent >= 50) return '#4CAF50';
    
    // Если нейтральных >50% и негатива мало (<20%) - зелёный (нормальное)
    if (neutralPercent >= 50 && sadPercent < 20) return '#4CAF50';
    
    // Если есть позитив (>30%) - жёлтый
    if (happyPercent >= 30) return '#FFC107';
    
    // По умолчанию синий (нейтральный)
    return '#2196F3';
  };

  const moodColor = getMoodColor();
  
  // Определяем эмодзи преобладающего настроения
  const getDominantMood = () => {
    if (sadPercent >= 40) return '😢';
    if (happyPercent >= 50) return '😊';
    if (neutralPercent >= 50 && sadPercent < 20) return '😊'; // Нейтральный + мало негатива = нормально
    if (happyPercent >= 30) return '😐';
    return '😐'; // По умолчанию нейтральный
  };

  return (
    <div ref={dropdownRef} className="mood-dropdown">
      {/* Toggle */}
      <div className="mood-dropdown__toggle" onClick={(e) => e.stopPropagation()}>
        <span className="mood-dropdown__toggle-label">{t('mood.label')}</span>
        <button 
          className={`mood-dropdown__toggle-btn ${moodEnabled ? 'enabled' : 'disabled'}`}
          onClick={toggleMoodEnabled}
          title={t('mood.toggle')}
        >
          <span className="mood-dropdown__toggle-slider"></span>
        </button>
      </div>

      {/* Visual Bar */}
      <div className="mood-dropdown__bar">
        <div 
          className="mood-dropdown__bar-track"
          style={{
            background: `linear-gradient(to right, 
              #f44336 0%, 
              #ff9800 ${sadPercent}%, 
              #ffeb3b ${sadPercent + neutralPercent}%, 
              #4caf50 100%)`
          }}
        />
      </div>

      {/* Compact Stats */}
      <div className="mood-dropdown__stats">
        <div className="mood-dropdown__stat">
          <span className="mood-dropdown__stat-emoji">😊</span>
          <span className="mood-dropdown__stat-value">{happyPercent}%</span>
        </div>
        <div className="mood-dropdown__stat">
          <span className="mood-dropdown__stat-emoji">😐</span>
          <span className="mood-dropdown__stat-value">{neutralPercent}%</span>
        </div>
        <div className="mood-dropdown__stat">
          <span className="mood-dropdown__stat-emoji">😢</span>
          <span className="mood-dropdown__stat-value">{sadPercent}%</span>
        </div>
      </div>

      {/* Summary */}
      <div className="mood-dropdown__summary">
        <span className="mood-dropdown__total">{total} {t('mood.msgs')}</span>
        <span className="mood-dropdown__dominant" style={{ color: moodColor }}>
          {getDominantMood()}
        </span>
      </div>
    </div>
  );
};

export default MoodDropdown;

