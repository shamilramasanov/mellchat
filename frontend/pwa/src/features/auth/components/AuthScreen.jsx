import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { useAuthStore } from '../store/authStore';
import { authAPI } from '@shared/services';
import { Button } from '@shared/components';
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
          <Button
            variant="primary"
            size="lg"
            fullWidth
            leftIcon="🔐"
            onClick={handleGoogleLogin}
          >
            {t('auth.login')}
          </Button>

          <Button
            variant="ghost"
            size="lg"
            fullWidth
            onClick={handleSkip}
          >
            {t('auth.skip')}
          </Button>
        </motion.div>

        {/* Platform Icons */}
        <motion.div
          className="auth-screen__platforms"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          <span className="platform-icon">📺</span>
          <span className="platform-icon">🎮</span>
          <span className="platform-icon">⚡</span>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default AuthScreen;

