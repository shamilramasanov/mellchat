import React from 'react';
import { useTranslation } from 'react-i18next';
import { useChatStore } from '../store/chatStore';
import './MoodButton.css';

const MoodButton = ({ mood, onClick }) => {
  const { t } = useTranslation();
  const moodEnabled = useChatStore((state) => state.moodEnabled);
  const { happy = 0, neutral = 0, sad = 0 } = mood || {};
  const total = happy + neutral + sad;
  
  // Положительные = нейтральные + happy
  const positive = happy + neutral;
  const positivePercent = total > 0 ? Math.round((positive / total) * 100) : 0;
  const sadPercent = total > 0 ? Math.round((sad / total) * 100) : 0;
  
  // Финальный процент = положительные - негативные
  const finalPositivePercent = Math.max(0, Math.min(100, positivePercent - sadPercent));
  
  // Проценты для отображения
  const happyPercent = total > 0 ? Math.round((happy / total) * 100) : 0;
  const neutralPercent = total > 0 ? Math.round((neutral / total) * 100) : 0;
  
  // Определяем цвет в зависимости от финального процента
  const getMoodColor = () => {
    // Если много негатива (>40% от общего) - красный
    if (sadPercent >= 40) return '#F44336';
    
    // Если финальный процент >= 60% - зелёный
    if (finalPositivePercent >= 60) return '#4CAF50';
    
    // Если финальный процент >= 40% - жёлтый
    if (finalPositivePercent >= 40) return '#FFC107';
    
    // Если финальный процент >= 0% - синий (нейтральный)
    if (finalPositivePercent >= 0) return '#2196F3';
    
    // По умолчанию серый
    return '#999';
  };

  const getMoodEmoji = () => {
    // Если много негатива (>40%) - грустный
    if (sadPercent >= 40) return '😢';
    
    // Если финальный процент >= 50% - счастливый
    if (finalPositivePercent >= 50) return '😊';
    
    // Если финальный процент >= 0% - нейтральный
    if (finalPositivePercent >= 0) return '😐';
    
    // По умолчанию нейтральный
    return '😐';
  };

  const moodColor = total > 0 ? getMoodColor() : '#999'; // Gray when no data
  const moodEmoji = total > 0 ? getMoodEmoji() : '🤷'; // Shrug when no data

  return (
    <button 
      className={`mood-button ${moodEnabled ? 'mood-button--enabled' : 'mood-button--disabled'}`}
      onClick={onClick}
      style={{ '--mood-color': moodColor }}
      title={t('mood.title')}
    >
      <span className="mood-button__label">{t('mood.label')}</span>
      {moodEnabled && total > 0 && (
        <span className="mood-button__value">
          {finalPositivePercent}%
        </span>
      )}
      
      {/* Pulsing indicator */}
      {moodEnabled && total > 0 && (
        <span 
          className="mood-button__indicator"
          style={{ backgroundColor: moodColor }}
        />
      )}
    </button>
  );
};

export default MoodButton;

