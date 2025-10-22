import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Input } from '../UI';
import './AddStreamModal.css';

export const AddStreamModal = ({ isOpen, onClose, onSubmit }) => {
  const { t } = useTranslation();
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const detectPlatform = (url) => {
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      return { platform: 'youtube', icon: '📺', color: '#FF0000' };
    } else if (url.includes('twitch.tv')) {
      return { platform: 'twitch', icon: '🎮', color: '#9146FF' };
    } else if (url.includes('kick.com')) {
      return { platform: 'kick', icon: '⚡', color: '#53FC18' };
    }
    return null;
  };

  const validateUrl = (url) => {
    if (!url || url.trim() === '') {
      return t('addStream.errorEmpty') || 'Please enter a URL';
    }
    
    const platform = detectPlatform(url);
    if (!platform) {
      return t('addStream.errorInvalid') || 'Invalid stream URL. Supported: YouTube, Twitch, Kick';
    }
    
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const validationError = validateUrl(url);
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      await onSubmit(url);
      setUrl('');
      onClose();
    } catch (err) {
      setError(err.message || t('addStream.errorGeneric') || 'Failed to add stream');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setUrl('');
    setError('');
    onClose();
  };

  const platformInfo = url ? detectPlatform(url) : null;

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content glass" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={handleClose}>✕</button>
        
        <h2 className="modal-title">
          ➕ {t('main.addStream') || 'Add Stream'}
        </h2>
        
        <form onSubmit={handleSubmit} className="modal-form">
          <div className="modal-input-wrapper">
            <Input
              icon="🔗"
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder={t('main.addStreamPlaceholder') || 'Paste YouTube, Twitch, or Kick stream URL'}
              fullWidth
              autoFocus
              disabled={isLoading}
            />
            
            {platformInfo && (
              <div className="platform-badge" style={{ borderColor: platformInfo.color }}>
                <span style={{ filter: `drop-shadow(0 0 8px ${platformInfo.color})` }}>
                  {platformInfo.icon}
                </span>
                <span style={{ color: platformInfo.color }}>
                  {platformInfo.platform.charAt(0).toUpperCase() + platformInfo.platform.slice(1)}
                </span>
              </div>
            )}
          </div>

          {error && (
            <div className="modal-error">
              ⚠️ {error}
            </div>
          )}

          <div className="modal-actions">
            <Button
              variant="secondary"
              onClick={handleClose}
              disabled={isLoading}
            >
              {t('main.cancel') || 'Cancel'}
            </Button>
            <Button
              type="submit"
              icon={isLoading ? '⏳' : '✓'}
              disabled={isLoading || !url}
            >
              {isLoading ? (t('common.loading') || 'Loading...') : (t('main.connect') || 'Connect')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

