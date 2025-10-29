import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
// import { Modal, Input, Button, GlassCard } from '@shared/components'; // Удалены - используем обычные элементы с glass эффектами
import { useStreamsStore } from '../store/streamsStore';
import { useChatStore } from '@features/chat/store/chatStore';
import { streamsAPI } from '@shared/services';
import { isValidStreamURL } from '@shared/utils/validators';
import { detectPlatform } from '@shared/utils/helpers';
import { PLATFORM_LOGOS, PLATFORMS } from '@shared/utils/constants';
import './AddStreamModal.css';

const AddStreamModal = ({ isOpen, onClose }) => {
  const { t } = useTranslation();
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [pasteSuggested, setPasteSuggested] = useState(false);
  const inputRef = useRef(null);
  
  const addStream = useStreamsStore((state) => state.addStream);
  const createStreamFromURL = useStreamsStore((state) => state.createStreamFromURL);
  const getStreamStats = useChatStore((state) => state.getStreamStats);

  const platform = url ? detectPlatform(url) : null;

  // Автоматическое определение скопированной ссылки при фокусе на поле
  const handleInputFocus = async () => {
    if (url.trim()) return; // Если уже есть текст, не проверяем буфер обмена
    
    try {
      // Читаем буфер обмена (требует разрешения в браузере)
      const clipboardText = await navigator.clipboard.readText();
      
      if (clipboardText && isValidStreamURL(clipboardText.trim())) {
        // Предлагаем вставить ссылку
        setPasteSuggested(true);
      }
    } catch (error) {
      // Clipboard API может быть недоступен (безопасность браузера)
      // Или пользователь не дал разрешение
      // Это нормально, просто продолжаем без проверки буфера обмена
    }
  };

  // Автоматическая вставка предложенной ссылки
  const handlePasteSuggested = () => {
    navigator.clipboard.readText().then(text => {
      if (text && isValidStreamURL(text.trim())) {
        setUrl(text.trim());
        setPasteSuggested(false);
      }
    }).catch(() => {});
  };

  // Очищаем предложение при изменении URL
  useEffect(() => {
    if (url.trim() && pasteSuggested) {
      setPasteSuggested(false);
    }
  }, [url, pasteSuggested]);

  // Сбрасываем состояние при открытии/закрытии модалки
  useEffect(() => {
    if (!isOpen) {
      setUrl('');
      setPasteSuggested(false);
    } else {
      // Небольшая задержка перед проверкой буфера обмена при открытии
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  // Функция для создания URL из имени автора и платформы
  const createStreamURL = (authorName, platform) => {
    const cleanName = authorName.trim().toLowerCase();
    switch (platform) {
      case PLATFORMS.TWITCH:
        return `https://www.twitch.tv/${cleanName}`;
      case PLATFORMS.YOUTUBE:
        // Для YouTube имя автора не работает так же, нужен videoId или channel
        // Просто возвращаем имя автора, backend попробует обработать
        return cleanName;
      case PLATFORMS.KICK:
        return `https://kick.com/${cleanName}`;
      default:
        return null;
    }
  };

  // Проверка, является ли ввод именем автора (не URL)
  const isAuthorName = (input) => {
    const trimmed = input.trim();
    // Если это не валидный URL и содержит только допустимые символы для имени
    return !isValidStreamURL(trimmed) && /^[a-zA-Z0-9_-]+$/.test(trimmed);
  };

  const handleConnect = async () => {
    const inputValue = url.trim();
    
    // Если это валидный URL стрима - подключаемся как обычно
    if (isValidStreamURL(inputValue)) {
      setIsLoading(true);
      try {
        const response = await streamsAPI.connect(inputValue);
        
        const stream = createStreamFromURL(inputValue);
        if (stream && response?.connection) {
          const streamData = { 
            ...stream, 
            connectionId: response.connection.id,
            status: 'connected',
            connectedAt: response.connection.connectedAt,
            viewers: response.connection.viewers || 0,
            title: response.connection.title || stream.title,
            author: response.connection.channel || stream.streamId,
          };
          
          addStream(streamData);
          toast.success(t('common.success'));
          setUrl('');
          onClose();
        }
      } catch (error) {
        console.error('❌ Stream connect error:', error);
        toast.error(t('errors.connectionFailed'));
      } finally {
        setIsLoading(false);
      }
      return;
    }

    // Если это имя автора - пытаемся подключиться ко всем платформам
    if (isAuthorName(inputValue)) {
      setIsLoading(true);
      const authorName = inputValue;
      const platforms = [PLATFORMS.TWITCH, PLATFORMS.KICK]; // YouTube требует videoId, пропускаем
      const connectedPlatforms = [];

      try {
        // Пытаемся подключиться ко всем платформам параллельно
        const connectionPromises = platforms.map(async (platform) => {
          try {
            const streamUrl = createStreamURL(authorName, platform);
            if (!streamUrl) return null;
            
            const response = await streamsAPI.connect(streamUrl);
            if (response?.connection) {
              const stream = createStreamFromURL(streamUrl);
              if (stream) {
                return {
                  platform,
                  stream: {
                    ...stream,
                    connectionId: response.connection.id,
                    status: 'connected',
                    connectedAt: response.connection.connectedAt,
                    viewers: response.connection.viewers || 0,
                    title: response.connection.title || stream.title,
                    author: response.connection.channel || stream.streamId,
                  }
                };
              }
            }
          } catch (error) {
            console.log(`⚠️ Failed to connect to ${platform}:`, error.message);
            return null;
          }
        });

        const results = await Promise.all(connectionPromises);
        
        // Добавляем все успешно подключенные стримы
        results.forEach((result) => {
          if (result && result.stream) {
            addStream(result.stream);
            connectedPlatforms.push(result.platform);
          }
        });

        // Показываем результат
        if (connectedPlatforms.length > 0) {
          toast.success(`Подключено на ${connectedPlatforms.length} платформах: ${connectedPlatforms.join(', ')}`);
          setUrl('');
          onClose();
        } else {
          toast.error(`Не удалось подключиться к "${authorName}" ни на одной платформе. Проверьте имя автора.`);
        }
      } catch (error) {
        console.error('❌ Multi-platform connect error:', error);
        toast.error(t('errors.connectionFailed'));
      } finally {
        setIsLoading(false);
      }
      return;
    }

    // Если это не валидный URL и не имя автора
    toast.error('Введите валидную ссылку на стрим или имя автора');
  };
  
  if (!isOpen) return null;

  return (
    <>
      {/* Modal Overlay */}
      <div className="add-stream-modal__overlay" onClick={onClose}>
        <div className="add-stream-modal" onClick={(e) => e.stopPropagation()}>
          {/* Modal Header */}
          <div className="add-stream-modal__header">
            <h2 className="add-stream-modal__title">➕ {t('streams.add')}</h2>
            <button className="add-stream-modal__close" onClick={onClose}>
              ✕
            </button>
          </div>

          {/* Modal Content */}
          <div className="add-stream-modal__content">
            <div className="add-stream-modal__input-container">
              <span className="add-stream-modal__input-icon">🔗</span>
              <input
                ref={inputRef}
                className="add-stream-modal__input"
                placeholder={t('streams.urlPlaceholder')}
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onFocus={handleInputFocus}
              />
            </div>

            {/* Предложение вставить ссылку из буфера обмена */}
            {pasteSuggested && (
              <div className="add-stream-modal__paste-suggestion">
                <span>📋 Найдена ссылка в буфере обмена</span>
                <button 
                  className="add-stream-modal__paste-button"
                  onClick={handlePasteSuggested}
                >
                  Вставить
                </button>
              </div>
            )}

            {platform && (
              <div className="add-stream-modal__platform">
                <img 
                  src={PLATFORM_LOGOS[platform]} 
                  alt={platform}
                  className="add-stream-modal__platform-logo"
                />
                <span className="add-stream-modal__platform-name">
                  {platform}
                </span>
              </div>
            )}

            <div className="add-stream-modal__buttons">
              <button 
                className="add-stream-modal__button add-stream-modal__button--secondary"
                onClick={onClose}
              >
                {t('streams.cancel')}
              </button>
              <button 
                className="add-stream-modal__button add-stream-modal__button--primary"
                onClick={handleConnect}
                disabled={!url || isLoading}
              >
                {isLoading ? '⏳' : t('streams.connect')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default AddStreamModal;
