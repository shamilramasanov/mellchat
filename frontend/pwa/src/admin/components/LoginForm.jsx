import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import useAdminStore from '../store/adminStore';

const LoginForm = () => {
  const { t } = useTranslation();
  const { login } = useAdminStore();
  const [credentials, setCredentials] = useState({
    username: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!credentials.username || !credentials.password) {
      setError(t('admin.login.invalidCredentials'));
      return;
    }

    setLoading(true);
    setError('');

    const result = await login(credentials);
    
    if (!result.success) {
      setError(result.error || t('admin.login.loginError'));
    }
    
    setLoading(false);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCredentials(prev => ({
      ...prev,
      [name]: value
    }));
    setError(''); // Clear error on input change
  };

  return (
    <div className="admin-login">
      <motion.div 
        className="admin-login__container"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="admin-login__header">
          <div className="admin-login__logo">
            <span className="admin-login__logo-icon">🎯</span>
            <h1 className="admin-login__logo-text">{t('admin.title')}</h1>
          </div>
          <p className="admin-login__subtitle">
            {t('admin.login.subtitle')}
          </p>
        </div>

        <form className="admin-login__form" onSubmit={handleSubmit}>
          <div className="admin-login__field">
            <label htmlFor="username" className="admin-login__label">
              {t('admin.login.username')}
            </label>
            <input
              type="text"
              id="username"
              name="username"
              value={credentials.username}
              onChange={handleInputChange}
              className="admin-login__input"
              placeholder={t('admin.login.username')}
              disabled={loading}
              autoComplete="username"
            />
          </div>

          <div className="admin-login__field">
            <label htmlFor="password" className="admin-login__label">
              {t('admin.login.password')}
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={credentials.password}
              onChange={handleInputChange}
              className="admin-login__input"
              placeholder={t('admin.login.password')}
              disabled={loading}
              autoComplete="current-password"
            />
          </div>

          {error && (
            <motion.div 
              className="admin-login__error"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <span className="admin-login__error-icon">⚠️</span>
              {error}
            </motion.div>
          )}

          <button 
            type="submit" 
            className="admin-login__submit"
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="admin-login__spinner">⏳</span>
                {t('admin.common.loading')}
              </>
            ) : (
              <>
                <span className="admin-login__submit-icon">🚀</span>
                {t('admin.login.loginButton')}
              </>
            )}
          </button>
        </form>

        <div className="admin-login__footer">
          <div className="admin-login__security">
            <span className="admin-login__security-icon">🔒</span>
            <span className="admin-login__security-text">
              Secure connection encrypted
            </span>
          </div>
        </div>
      </motion.div>

      <div className="admin-login__background">
        <div className="admin-login__bg-shape admin-login__bg-shape--1"></div>
        <div className="admin-login__bg-shape admin-login__bg-shape--2"></div>
        <div className="admin-login__bg-shape admin-login__bg-shape--3"></div>
      </div>
    </div>
  );
};

export default LoginForm;
