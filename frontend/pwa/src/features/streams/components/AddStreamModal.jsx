import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { Modal, Input, Button, GlassCard } from '@shared/components';
import { useStreamsStore } from '../store/streamsStore';
import { useChatStore } from '@features/chat/store/chatStore';
import { streamsAPI } from '@shared/services';
import { isValidStreamURL } from '@shared/utils/validators';
import { detectPlatform } from '@shared/utils/helpers';
import { PLATFORM_LOGOS } from '@shared/utils/constants';
import ArchivePromptModal from './ArchivePromptModal';

const AddStreamModal = ({ isOpen, onClose }) => {
  const { t } = useTranslation();
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [pendingStream, setPendingStream] = useState(null);
  const [showArchivePrompt, setShowArchivePrompt] = useState(false);
  
  const addStream = useStreamsStore((state) => state.addStream);
  const createStreamFromURL = useStreamsStore((state) => state.createStreamFromURL);
  const hasArchive = useChatStore((state) => state.hasArchive);
  const clearStreamMessages = useChatStore((state) => state.clearStreamMessages);
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
      console.log('✅ Stream connect response:', response);
      
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
        
        // Check if archive exists for this stream
        if (hasArchive(stream.id)) {
          // Show archive prompt
          setPendingStream(streamData);
          setShowArchivePrompt(true);
        } else {
          // No archive - add stream directly
          addStream(streamData);
          toast.success(t('common.success'));
          setUrl('');
          onClose();
        }
      }
    } catch (error) {
      console.error('❌ Stream connect error:', error);
      toast.error(t('errors.connectionFailed'));
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleLoadArchive = () => {
    if (pendingStream) {
      addStream(pendingStream);
      toast.success(t('common.success'));
      setUrl('');
      setPendingStream(null);
      onClose();
    }
  };
  
  const handleClearArchive = () => {
    if (pendingStream) {
      // Clear old messages for this stream
      clearStreamMessages(pendingStream.id);
      addStream(pendingStream);
      toast.success(t('common.success'));
      setUrl('');
      setPendingStream(null);
      onClose();
    }
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={`➕ ${t('streams.add')}`}
        size="md"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <Input
            placeholder={t('streams.urlPlaceholder')}
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            leftIcon="🔗"
            fullWidth
          />

          {platform && (
            <GlassCard style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              padding: '0.75rem 1rem',
              fontSize: 'var(--font-size-base)',
            }}>
              <img 
                src={PLATFORM_LOGOS[platform]} 
                alt={platform}
                style={{ 
                  height: '24px', 
                  width: 'auto',
                  objectFit: 'contain',
                  filter: 'brightness(0.9)'
                }}
              />
              <span style={{ 
                fontWeight: 'var(--font-weight-medium)', 
                color: 'var(--text-primary)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>
                {platform}
              </span>
            </GlassCard>
          )}

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <Button variant="secondary" fullWidth onClick={onClose}>
              {t('streams.cancel')}
            </Button>
            <Button 
              variant="primary" 
              fullWidth 
              onClick={handleConnect}
              loading={isLoading}
              disabled={!url}
            >
              {t('streams.connect')}
            </Button>
          </div>
        </div>
      </Modal>
      
      {/* Archive Prompt Modal */}
      {pendingStream && (
        <ArchivePromptModal
          isOpen={showArchivePrompt}
          onClose={() => setShowArchivePrompt(false)}
          onLoadArchive={handleLoadArchive}
          onClearArchive={handleClearArchive}
          stream={pendingStream}
          messageCount={getStreamStats(pendingStream.id).messageCount}
        />
      )}
    </>
  );
};

export default AddStreamModal;
