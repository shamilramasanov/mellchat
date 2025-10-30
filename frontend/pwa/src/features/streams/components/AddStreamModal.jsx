import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
// import { Modal, Input, Button, GlassCard } from '@shared/components'; // Удалены - используем обычные элементы с glass эффектами
import { useStreamsStore } from '../store/streamsStore';
import { isValidStreamURL } from '@shared/utils/validators';
import { detectPlatform } from '@shared/utils/helpers';
import { PLATFORM_LOGOS } from '@shared/utils/constants';
import './AddStreamModal.css';

const AddStreamModal = ({ isOpen, onClose }) => {
  const { t } = useTranslation();
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef(null);
  
  const addStream = useStreamsStore((state) => state.addStream);
  const createStreamFromURL = useStreamsStore((state) => state.createStreamFromURL);

  const platform = url ? detectPlatform(url) : null;

  // Проверяем буфер обмена при открытии модального окна
  useEffect(() => {
    if (isOpen && !url) {
      checkClipboardAndAutoPaste();
    }
  }, [isOpen]);


  // Проверка буфера обмена и автоматическая вставка
  const checkClipboardAndAutoPaste = async () => {
    try {
      const clipboardText = await navigator.clipboard.readText();
      if (clipboardText && isValidStreamURL(clipboardText.trim())) {
        setUrl(clipboardText.trim());
        toast.success('📋 Ссылка автоматически вставлена из буфера обмена');
      }
    } catch (error) {
      // Clipboard API недоступен или нет разрешения
      console.log('Clipboard API недоступен:', error.message);
    }
  };


  // Обработка Ctrl+V / Cmd+V
  const handleKeyDown = (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
      // Даем время на вставку, затем проверяем
      setTimeout(() => {
        if (url && isValidStreamURL(url)) {
          toast.success('✅ Ссылка распознана!');
        }
      }, 100);
    }
  };

  // Сбрасываем состояние при открытии/закрытии модалки
  useEffect(() => {
    if (!isOpen) {
      setUrl('');
    } else {
      // Небольшая задержка перед фокусом
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);



  const handleConnect = async () => {
    if (!isValidStreamURL(url)) {
      toast.error('❌ Введите валидную ссылку на стрим');
      return;
    }

    setIsLoading(true);
    try {
      const stream = createStreamFromURL(url);
      if (stream) {
        addStream(stream);
        toast.success('✅ Стрим успешно подключен!');
        setUrl('');
        onClose();
      }
    } catch (error) {
      console.error('❌ Stream connect error:', error);
      toast.error('❌ Ошибка подключения к стриму');
    } finally {
      setIsLoading(false);
    }
  };

  // Ручная вставка из буфера обмена (fallback)
  const handleManualPaste = async () => {
    try {
      const clipboardText = await navigator.clipboard.readText();
      if (clipboardText && isValidStreamURL(clipboardText.trim())) {
        setUrl(clipboardText.trim());
        toast.success('📋 Ссылка вставлена из буфера обмена');
      } else {
        toast.error('❌ В буфере обмена нет валидной ссылки на стрим');
      }
    } catch (error) {
      toast.error('❌ Не удалось получить доступ к буферу обмена');
    }
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
              <input
                ref={inputRef}
                className="add-stream-modal__input"
                placeholder="🔗 Введите ссылку на стрим"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={handleKeyDown}
              />
            </div>

            {/* Fallback кнопка для вставки из буфера обмена */}
            {!url.trim() && (
              <div className="add-stream-modal__paste-fallback">
                <button 
                  className="add-stream-modal__paste-button"
                  onClick={handleManualPaste}
                >
                  📋 Вставить из буфера обмена
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
                disabled={!isValidStreamURL(url) || isLoading}
              >
                {isLoading ? '⏳ Подключение...' : t('streams.connect')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default AddStreamModal;
