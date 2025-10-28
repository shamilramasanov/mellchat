import React from 'react';
import './MoodBar.css';

const MoodBar = ({ mood, onClose }) => {
  if (!mood) {
    return null;
  }

  const { happy = 0, neutral = 0, sad = 0 } = mood;
  const total = happy + neutral + sad;
  
  if (total === 0) {
    return (
      <div className="mood-bar-modal">
        <div className="mood-bar-modal__content">
          <button className="mood-bar-modal__close" onClick={onClose}>✕</button>
          <h2 className="mood-bar-modal__title">🎭 Настроение чата</h2>
          <p className="mood-bar-modal__empty">Нет данных о настроении</p>
        </div>
      </div>
    );
  }

  // Положительные = нейтральные + happy
  const positive = happy + neutral;
  
  // Процент положительных
  const positivePercent = Math.round((positive / total) * 100);
  
  // Процент негативных (отнимает от процента положительных)
  const sadPercent = Math.round((sad / total) * 100);
  
  // Финальный процент = положительные - негативные
  // Если негатива нет → показываем процент положительных (до 100%)
  // Если негатив есть → вычитаем из процента положительных
  const finalPositivePercent = Math.max(0, Math.min(100, positivePercent - sadPercent));
  
  // Проценты для отображения
  const happyPercent = Math.round((happy / total) * 100);
  const neutralPercent = Math.round((neutral / total) * 100);

  // Функция для получения основного цвета настроения (на основе финального процента)
  const getMoodColor = () => {
    if (finalPositivePercent >= 60) return '#4CAF50'; // Green (positive)
    if (finalPositivePercent >= 40) return '#FFC107'; // Yellow/Orange (mixed)
    if (sadPercent > positivePercent) return '#F44336'; // Red (sad dominates)
    return '#2196F3'; // Blue (neutral)
  };

  const moodColor = getMoodColor();

  return (
    <div className="mood-bar-modal">
      <div className="mood-bar-modal__content">
        <button className="mood-bar-modal__close" onClick={onClose}>✕</button>
        <h2 className="mood-bar-modal__title">🎭 Настроение чата</h2>
        
        {/* Visual Mood Bar */}
        <div className="mood-bar__container">
          <div className="mood-bar__track">
            {/* Positive fill (green) */}
            <div 
              className="mood-bar__fill happy"
              style={{ width: `${finalPositivePercent}%` }}
            />
            {/* Sad fill (red) - отнимает от positive */}
            <div 
              className="mood-bar__fill sad"
              style={{ width: `${sadPercent}%`, marginLeft: `${finalPositivePercent}%` }}
            />
          </div>
        </div>

        {/* Statistics */}
        <div className="mood-bar-modal__stats">
          <div 
            className="mood-stat mood-stat--happy"
            style={{ '--mood-color': '#4CAF50' }}
          >
            <span className="mood-stat__emoji">😊</span>
            <span className="mood-stat__label">Happy</span>
            <span className="mood-stat__value">
              {happyPercent}% ({happy})
            </span>
          </div>

          <div 
            className="mood-stat mood-stat--neutral"
            style={{ '--mood-color': '#FFC107' }}
          >
            <span className="mood-stat__emoji">😐</span>
            <span className="mood-stat__label">Neutral</span>
            <span className="mood-stat__value">
              {neutralPercent}% ({neutral})
            </span>
          </div>

          <div 
            className="mood-stat mood-stat--sad"
            style={{ '--mood-color': '#F44336' }}
          >
            <span className="mood-stat__emoji">😢</span>
            <span className="mood-stat__label">Sad</span>
            <span className="mood-stat__value">
              {sadPercent}% ({sad})
            </span>
          </div>
        </div>

        {/* Summary */}
        <div className="mood-bar-modal__summary">
          <p>
            Всего проанализировано: <strong>{total}</strong> сообщений
          </p>
          <p className="mood-bar-modal__dominant">
            Преобладающее настроение: <strong style={{ color: moodColor }}>
              {finalPositivePercent >= 50 ? '😊 Положительное' : 
               sadPercent > positivePercent ? '😢 Негативное' : 
               '😐 Нейтральное'}
            </strong>
          </p>
          <p style={{ fontSize: '0.875rem', color: '#999' }}>
            Финальный процент: <strong>{finalPositivePercent}%</strong> (положительные: {positivePercent}% - негативные: {sadPercent}%)
          </p>
        </div>
      </div>
    </div>
  );
};

export default MoodBar;

