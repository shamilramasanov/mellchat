import { useTranslation } from 'react-i18next';
import { Modal, Button, GlassCard } from '@shared/components';
import { PLATFORM_LOGOS } from '@shared/utils/constants';

const ArchivePromptModal = ({ isOpen, onClose, onLoadArchive, onClearArchive, stream, messageCount }) => {
  const { t } = useTranslation();

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`📚 ${t('archive.found')}`}
      size="md"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {/* Stream Info */}
        <GlassCard style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          padding: '0.75rem 1rem',
        }}>
          <img 
            src={PLATFORM_LOGOS[stream.platform]} 
            alt={stream.platform}
            style={{ 
              height: '24px', 
              width: 'auto',
              objectFit: 'contain',
              filter: 'brightness(0.9)'
            }}
          />
          <div style={{ flex: 1 }}>
            <div style={{ 
              fontWeight: 'var(--font-weight-medium)', 
              color: 'var(--text-primary)',
              fontSize: 'var(--font-size-base)',
            }}>
              {stream.author || stream.streamId}
            </div>
            <div style={{ 
              fontSize: 'var(--font-size-sm)', 
              color: 'var(--text-secondary)',
              marginTop: '0.25rem'
            }}>
              {messageCount} {messageCount === 1 ? t('archive.message') : t('archive.messages')}
            </div>
          </div>
        </GlassCard>

        {/* Description */}
        <p style={{ 
          color: 'var(--text-secondary)', 
          fontSize: 'var(--font-size-base)',
          lineHeight: '1.5',
          textAlign: 'center'
        }}>
          {t('archive.description')}
        </p>

        {/* Buttons */}
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <Button 
            variant="secondary" 
            fullWidth 
            onClick={() => {
              onClearArchive();
              onClose();
            }}
          >
            {t('archive.clear')}
          </Button>
          <Button 
            variant="primary" 
            fullWidth 
            onClick={() => {
              onLoadArchive();
              onClose();
            }}
          >
            {t('archive.load')}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default ArchivePromptModal;

