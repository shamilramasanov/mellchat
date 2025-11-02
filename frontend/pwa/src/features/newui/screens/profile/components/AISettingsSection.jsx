import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Bot, Settings as SettingsIcon, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { ru, enUS, uk } from 'date-fns/locale';
import { aiFilterAPI } from '@shared/services/api';
import { AITrainingModal } from './AITrainingModal.jsx';
import './AISettingsSection.css';

const locales = { ru, en: enUS, uk };

export function AISettingsSection({ userId }) {
  const { t, i18n } = useTranslation();
  const [aiRules, setAiRules] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showTrainingModal, setShowTrainingModal] = useState(false);
  const [trainingInProgress, setTrainingInProgress] = useState(false);
  const [trainingProgress, setTrainingProgress] = useState(0);

  useEffect(() => {
    loadAIRules();
  }, [userId]);

  const loadAIRules = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const result = await aiFilterAPI.getRules();
      if (result.success || result.hasRules) {
        setAiRules(result.rules || result);
      } else {
        setAiRules(null);
      }
    } catch (err) {
      console.error('Error loading AI rules:', err);
      // Если правила нет - это нормально (пользователь еще не обучал)
      if (err.response?.status !== 404) {
        setError('Не удалось загрузить данные о фильтре');
      }
      setAiRules(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartTraining = () => {
    setShowTrainingModal(true);
  };

  const handleTrainingStart = async (trainingConfig) => {
    setShowTrainingModal(false);
    setTrainingInProgress(true);
    setTrainingProgress(0);

    try {
      // Симуляция прогресса (backend может вернуть progress через WebSocket или polling)
      const stages = [
        { stage: 'Получение выборки...', progress: 25 },
        { stage: 'Анализ AI...', progress: 60 },
        { stage: 'Сохранение правил...', progress: 90 }
      ];

      // Запускаем обучение
      const trainingPromise = aiFilterAPI.train(trainingConfig);

      // Показываем прогресс
      for (const stage of stages) {
        setTrainingProgress(stage.progress);
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      // Ждем завершения обучения
      const result = await trainingPromise;
      
      if (result.success) {
        setTrainingProgress(100);
        await new Promise(resolve => setTimeout(resolve, 500));
        // После завершения загружаем обновленные правила
        await loadAIRules();
      } else {
        throw new Error(result.error || 'Training failed');
      }
    } catch (err) {
      console.error('Training error:', err);
      setError(err.response?.data?.error || err.message || 'Ошибка при обучении фильтра');
      if (err.response?.status === 429) {
        setError('Превышен лимит обучений. Максимум 3 обучения в день.');
      }
    } finally {
      setTrainingInProgress(false);
      setTrainingProgress(0);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      const lang = i18n.language || 'ru';
      return format(date, 'd MMMM yyyy, HH:mm', { 
        locale: locales[lang] || locales.ru 
      });
    } catch (e) {
      return dateString;
    }
  };

  if (isLoading) {
    return (
      <div className="ai-settings-section-card">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
        </div>
      </div>
    );
  }

  const isTrained = aiRules && aiRules.created_at;

  return (
    <>
      <div className="ai-settings-section-card">
        <div className="ai-settings-header">
          <Bot className="h-5 w-5 text-purple-600" />
          <h2 className="ai-settings-title">AI Фильтр спама</h2>
        </div>

        <div className="ai-settings-content">
          {error && (
            <div className="ai-error-banner">
              <AlertCircle className="h-4 w-4" />
              <span>{error}</span>
            </div>
          )}

          {trainingInProgress ? (
            <div className="ai-training-progress">
              <div className="ai-progress-bar-container">
                <div 
                  className="ai-progress-bar" 
                  style={{ width: `${trainingProgress}%` }}
                />
              </div>
              <p className="ai-progress-text">{trainingProgress}% завершено</p>
            </div>
          ) : (
            <>
              <div className="ai-status">
                {isTrained ? (
                  <>
                    <div className="ai-status-item">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <span className="ai-status-label">Статус:</span>
                      <span className="ai-status-value">✅ Обучен</span>
                    </div>
                    {aiRules.updated_at && (
                      <div className="ai-status-item">
                        <span className="ai-status-label">Обучен:</span>
                        <span className="ai-status-value">
                          {formatDate(aiRules.updated_at)}
                        </span>
                      </div>
                    )}
                    {aiRules.spam_found !== undefined && (
                      <div className="ai-status-item">
                        <span className="ai-status-label">Найдено спама:</span>
                        <span className="ai-status-value">
                          {aiRules.spam_found.toLocaleString()} 
                          {aiRules.spam_detected_rate !== undefined && 
                            ` (${aiRules.spam_detected_rate.toFixed(1)}%)`
                          }
                        </span>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="ai-status-item">
                    <AlertCircle className="h-4 w-4 text-yellow-600" />
                    <span className="ai-status-label">Статус:</span>
                    <span className="ai-status-value">⚠️ Не обучен</span>
                  </div>
                )}
              </div>

              <div className="ai-actions">
                <button
                  onClick={handleStartTraining}
                  className="ai-action-button ai-action-button-primary"
                  disabled={trainingInProgress}
                >
                  <SettingsIcon className="h-4 w-4" />
                  <span>{isTrained ? 'Переобучить фильтр' : 'Обучить фильтр'}</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {showTrainingModal && (
        <AITrainingModal
          isOpen={showTrainingModal}
          onClose={() => setShowTrainingModal(false)}
          onStart={handleTrainingStart}
          isTrained={isTrained}
        />
      )}
    </>
  );
}

