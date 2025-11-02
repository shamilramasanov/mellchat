import { useState } from 'react';
import { X, Sparkles } from 'lucide-react';
import './AITrainingModal.css';

export function AITrainingModal({ isOpen, onClose, onStart, isTrained = false }) {
  const [sampleSize, setSampleSize] = useState('10000');
  const [scope, setScope] = useState('all'); // 'all', 'active', 'stream'
  const [trainingMode, setTrainingMode] = useState('moderate'); // 'strict', 'moderate', 'soft'

  if (!isOpen) return null;

  const handleStart = () => {
    onStart({
      sampleSize: parseInt(sampleSize),
      scope,
      trainingMode
    });
  };

  const sampleSizes = [
    { value: '5000', label: '5k сообщений' },
    { value: '10000', label: '10k сообщений' },
    { value: '50000', label: '50k сообщений' }
  ];

  const scopes = [
    { value: 'all', label: 'Все сообщения' },
    { value: 'active', label: 'Активные стримы' }
  ];

  const trainingModes = [
    { value: 'strict', label: 'Строгий', description: 'Только очевидный спам' },
    { value: 'moderate', label: 'Умеренный', description: 'Баланс между точностью и покрытием' },
    { value: 'soft', label: 'Мягкий', description: 'Меньше ложных срабатываний' }
  ];

  return (
    <div className="ai-training-modal-overlay" onClick={onClose}>
      <div className="ai-training-modal" onClick={(e) => e.stopPropagation()}>
        <div className="ai-training-modal-header">
          <div className="ai-training-modal-title-section">
            <Sparkles className="h-5 w-5 text-purple-600" />
            <h2 className="ai-training-modal-title">
              {isTrained ? 'Переобучение AI фильтра' : 'Обучение AI фильтра'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="ai-training-modal-close"
            aria-label="Закрыть"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="ai-training-modal-content">
          <div className="ai-training-setting-group">
            <label className="ai-training-label">Размер выборки</label>
            <div className="ai-training-options">
              {sampleSizes.map((size) => (
                <button
                  key={size.value}
                  onClick={() => setSampleSize(size.value)}
                  className={`ai-training-option ${
                    sampleSize === size.value ? 'ai-training-option-active' : ''
                  }`}
                >
                  {size.label}
                </button>
              ))}
            </div>
          </div>

          <div className="ai-training-setting-group">
            <label className="ai-training-label">Область выборки</label>
            <div className="ai-training-options">
              {scopes.map((s) => (
                <button
                  key={s.value}
                  onClick={() => setScope(s.value)}
                  className={`ai-training-option ${
                    scope === s.value ? 'ai-training-option-active' : ''
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          <div className="ai-training-setting-group">
            <label className="ai-training-label">Строгость фильтра</label>
            <div className="ai-training-modes">
              {trainingModes.map((mode) => (
                <button
                  key={mode.value}
                  onClick={() => setTrainingMode(mode.value)}
                  className={`ai-training-mode ${
                    trainingMode === mode.value ? 'ai-training-mode-active' : ''
                  }`}
                >
                  <span className="ai-training-mode-label">{mode.label}</span>
                  <span className="ai-training-mode-description">{mode.description}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="ai-training-limit-info">
            <span className="ai-training-limit-text">
              Лимит: 3 обучения в день
            </span>
          </div>
        </div>

        <div className="ai-training-modal-actions">
          <button
            onClick={onClose}
            className="ai-training-button ai-training-button-secondary"
          >
            Отмена
          </button>
          <button
            onClick={handleStart}
            className="ai-training-button ai-training-button-primary"
          >
            {isTrained ? 'Переобучить' : 'Обучить'}
          </button>
        </div>
      </div>
    </div>
  );
}

