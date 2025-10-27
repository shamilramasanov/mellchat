import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { useAuthStore } from '../store/authStore';
import { authAPI } from '@shared/services';
// import { Button } from '@shared/components'; // Удален - используем обычные button с glass эффектами
import { PLATFORM_LOGOS } from '@shared/utils/constants';
import './AuthScreen.css';

const AuthScreen = () => {
  const { t } = useTranslation();
  const setSkipAuth = useAuthStore((state) => state.setSkipAuth);

  const handleGoogleLogin = () => {
    window.location.href = authAPI.getGoogleAuthURL();
  };

  const handleSkip = () => {
    setSkipAuth(true);
  };

  return (
    <div className="auth-screen">
      {/* Content */}
      <motion.div
        className="auth-screen__content"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Logo with Glow */}
        <motion.h1
          className="auth-screen__logo gradient-text"
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          transition={{
            duration: 2,
            repeat: Infinity,
            repeatType: 'reverse',
            ease: 'easeInOut',
          }}
        >
          MellChat
        </motion.h1>

        <motion.p
          className="auth-screen__subtitle"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          {t('auth.subtitle')}
        </motion.p>

        {/* Buttons */}
        <motion.div
          className="auth-screen__buttons"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <button
            className="auth-screen__button auth-screen__button--primary"
            onClick={handleGoogleLogin}
          >
            <span className="auth-screen__button-icon">🔐</span>
            {t('auth.login')}
          </button>

          <button
            className="auth-screen__button auth-screen__button--ghost"
            onClick={handleSkip}
          >
            {t('auth.skip')}
          </button>
        </motion.div>

        {/* Platform Icons */}
        <motion.div
          className="auth-screen__platforms"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          <img 
            src={PLATFORM_LOGOS.youtube} 
            alt="YouTube" 
            className="platform-icon"
          />
          <img 
            src={PLATFORM_LOGOS.kick} 
            alt="Kick" 
            className="platform-icon"
          />
          <img 
            src={PLATFORM_LOGOS.twitch} 
            alt="Twitch" 
            className="platform-icon"
          />
        </motion.div>
      </motion.div>
    </div>
  );
};

export default AuthScreen;

