import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { useChatStore } from '../store/chatStore';
import { useSettingsStore } from '@features/settings/store/settingsStore';
// import { GlassCard } from '@shared/components'; // Удален - используем обычные div с glass эффектами
import { formatRelativeTime, generateColor, copyToClipboard, getPlatformColor } from '@shared/utils/helpers';
import { NICKNAME_COLOR_MODES, PLATFORM_ICONS, PLATFORM_LOGOS } from '@shared/utils/constants';
import './MessageCard.css';

const MessageCard = ({ message }) => {
  const { t } = useTranslation();
  const [isLiked, setIsLiked] = useState(message.userLiked || false);
  const [isDisliked, setIsDisliked] = useState(message.userDisliked || false);
  
  const isBookmarked = useChatStore((state) => state.isBookmarked(message.id));
  const toggleBookmark = useChatStore((state) => state.toggleBookmark);
  const likeMessage = useChatStore((state) => state.likeMessage);
  const dislikeMessage = useChatStore((state) => state.dislikeMessage);
  const nicknameColors = useSettingsStore((state) => state.nicknameColors);

  const getNicknameColor = () => {
    switch (nicknameColors) {
      case NICKNAME_COLOR_MODES.RANDOM:
        return generateColor(message.username);
      case NICKNAME_COLOR_MODES.PLATFORM:
        return getPlatformColor(message.platform);
      case NICKNAME_COLOR_MODES.MONO:
      default:
        return 'var(--text-primary)';
    }
  };

  const handleLike = () => {
    if (!isLiked) {
      likeMessage(message.id);
      setIsLiked(true);
      setIsDisliked(false);
    }
  };

  const handleDislike = () => {
    if (!isDisliked) {
      dislikeMessage(message.id);
      setIsDisliked(true);
      setIsLiked(false);
    }
  };

  const handleCopy = async () => {
    const success = await copyToClipboard(message.text);
    if (success) {
      toast.success(t('message.copied'));
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="message-card">
        {/* Top Row: Left side (Username/Platform) and Right side (Message Text + Timestamp) */}
        <div className="message-card__top">
          <div className="message-card__left">
            <span 
              className="message-card__username"
              style={{ color: getNicknameColor() }}
            >
              {message.username}
            </span>
            {message.platform && (
              <div className="message-card__platform">
                <img 
                  src={PLATFORM_LOGOS[message.platform]} 
                  alt={message.platform}
                  className="message-card__platform-logo"
                />
                <span>{message.platform}</span>
              </div>
            )}
          </div>
          <div className="message-card__right">
            <div className="message-card__text">
              {message.text}
            </div>
            <span className="message-card__timestamp">
              {formatRelativeTime(message.timestamp)}
            </span>
          </div>
        </div>

        {/* Bottom Row: Actions */}
        <div className="message-card__actions">
          <button
            className={`message-card__action ${isLiked ? 'message-card__action--active' : ''}`}
            onClick={handleLike}
            title={t('message.like')}
          >
            <span style={{ position: 'relative', zIndex: 100 }}>
              👍 {message.likes || 0}
            </span>
          </button>
          <button
            className={`message-card__action ${isDisliked ? 'message-card__action--active' : ''}`}
            onClick={handleDislike}
            title={t('message.dislike')}
          >
            <span style={{ position: 'relative', zIndex: 100 }}>
              👎 {message.dislikes || 0}
            </span>
          </button>
          <button
            className={`message-card__action ${isBookmarked ? 'message-card__action--active' : ''}`}
            onClick={() => toggleBookmark(message.id)}
            title={t('message.bookmark')}
          >
            <span style={{ position: 'relative', zIndex: 100 }}>🔖</span>
          </button>
          <button
            className="message-card__action"
            onClick={handleCopy}
            title={t('message.copy')}
          >
            <span style={{ position: 'relative', zIndex: 100 }}>📋</span>
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default MessageCard;

