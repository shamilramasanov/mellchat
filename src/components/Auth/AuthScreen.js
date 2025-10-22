import React from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '../UI';
import './AuthScreen.css';

export const AuthScreen = ({ onSkip, onLogin }) => {
  const { t } = useTranslation();

  const handleGoogleLogin = () => {
    // Redirect to backend OAuth
    const API_URL = process.env.REACT_APP_API_URL || 'https://mellchat-production.up.railway.app';
    window.location.href = `${API_URL}/api/v1/auth/google`;
  };

  return (
    <div className="auth-screen">
      <div className="auth-screen__background">
        <div className="auth-screen__gradient auth-screen__gradient--1"></div>
        <div className="auth-screen__gradient auth-screen__gradient--2"></div>
        <div className="auth-screen__gradient auth-screen__gradient--3"></div>
      </div>
      
      <div className="auth-screen__content">
        <div className="auth-screen__logo">
          <h1 className="auth-screen__title">MellChat</h1>
          <div className="auth-screen__logo-glow"></div>
        </div>
        
        <p className="auth-screen__subtitle">{t('auth.subtitle')}</p>
        
        <div className="auth-screen__actions">
          <Button 
            variant="primary" 
            size="lg" 
            fullWidth
            onClick={handleGoogleLogin}
          >
            <span>🔐</span> {t('auth.login')}
          </Button>
          
          <Button 
            variant="ghost" 
            size="lg" 
            fullWidth
            onClick={onSkip}
          >
            {t('auth.skip')}
          </Button>
        </div>
      </div>
    </div>
  );
};

