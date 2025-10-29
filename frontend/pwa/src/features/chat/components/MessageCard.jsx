import { motion } from 'framer-motion';
import { useSettingsStore } from '@features/settings/store/settingsStore';
// import { GlassCard } from '@shared/components'; // Удален - используем обычные div с glass эффектами
import { formatRelativeTime, generateColor, getPlatformColor } from '@shared/utils/helpers';
import { NICKNAME_COLOR_MODES, PLATFORM_LOGOS } from '@shared/utils/constants';
import './MessageCard.css';

const MessageCard = ({ message }) => {
  const nicknameColors = useSettingsStore((state) => state.nicknameColors);

  // Отладочная информация для вопросов (убрано для производительности)
  // if (message.isQuestion) {
  //   console.log('🔍 Question detected:', {
  //     id: message.id,
  //     username: message.username,
  //     text: message.text || message.content,
  //     isQuestion: message.isQuestion
  //   });
  // }

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

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      data-message-id={message.id}
    >
      <div className={`message-card ${message.isQuestion ? 'message-card--question' : ''} ${message.isAdmin || message.platform === 'admin' ? 'message-card--admin' : ''}`}>
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
              {message.text || message.content}
            </div>
            <span className="message-card__timestamp">
              {(() => {
                const timestamp = message.timestamp || message.created_at;
                console.log('🕒 Message timestamp:', {
                  id: message.id,
                  timestamp,
                  type: typeof timestamp,
                  formatted: formatRelativeTime(timestamp)
                });
                return formatRelativeTime(timestamp);
              })()}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default MessageCard;

