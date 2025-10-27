import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
// import { Modal, Input, Button, GlassCard } from '@shared/components'; // Удалены - используем обычные элементы с glass эффектами
import { useStreamsStore } from '../store/streamsStore';
import { useChatStore } from '@features/chat/store/chatStore';
import { streamsAPI } from '@shared/services';
import { isValidStreamURL } from '@shared/utils/validators';
import { detectPlatform } from '@shared/utils/helpers';
import { PLATFORM_LOGOS } from '@shared/utils/constants';
import './AddStreamModal.css';

const AddStreamModal = ({ isOpen, onClose }) => {
  const { t } = useTranslation();
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const addStream = useStreamsStore((state) => state.addStream);
  const createStreamFromURL = useStreamsStore((state) => state.createStreamFromURL);
  const getStreamStats = useChatStore((state) => state.getStreamStats);

  const platform = url ? detectPlatform(url) : null;

  const handleConnect = async () => {
    if (!isValidStreamURL(url)) {
      toast.error(t('errors.invalidUrl'));
      return;
    }

    setIsLoading(true);
    try {
      const response = await streamsAPI.connect(url);
      
      const stream = createStreamFromURL(url);
      if (stream && response?.connection) {
        // Create stream object with stable ID and separate connectionId for WebSocket
        const streamData = { 
          ...stream, 
          connectionId: response.connection.id, // Backend connection ID for WebSocket
          status: 'connected',
          connectedAt: response.connection.connectedAt,
          viewers: response.connection.viewers || 0,
          title: response.connection.title || stream.title,
          author: response.connection.channel || stream.streamId,
        };
        
        // Always add stream directly (no archive prompt)
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
                className="add-stream-modal__input"
                placeholder={t('streams.urlPlaceholder')}
                value={url}
                onChange={(e) => setUrl(e.target.value)}
              />
            </div>

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
