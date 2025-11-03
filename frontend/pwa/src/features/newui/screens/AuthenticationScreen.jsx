import { ArrowLeft, ArrowRight, Mail } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { EmailAuthScreen } from '../components/EmailAuthScreen.jsx';
import { useAuthStore } from '@features/auth/store/authStore';

export function AuthenticationScreen({ onBack, onSuccess }) {
  const { t } = useTranslation();
  const [authMethod, setAuthMethod] = useState(null); // null | 'email' | 'google'
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    // Редирект на Google OAuth
    const { authAPI } = await import('@shared/services/api');
    const googleUrl = authAPI.getGoogleAuthURL();
    window.location.href = googleUrl;
  };

  const handleEmailSignIn = () => {
    setAuthMethod('email');
  };

  const handleContinueAsGuest = async () => {
    useAuthStore.getState().setSkipAuth(true);
    // Обновляем URL hash сразу, чтобы избежать перезаписи экрана
    window.location.hash = 'main';
    
    // Регистрируем гостевую сессию в админ панели
    try {
      const { authAPI } = await import('@shared/services/api');
      await authAPI.registerGuestSession();
    } catch (error) {
      console.warn('Failed to register guest session:', error);
      // Игнорируем ошибку, продолжаем работу
    }
    
    if (onSuccess) {
      onSuccess();
    }
  };

  // Если выбран способ авторизации, показываем соответствующий экран
  if (authMethod === 'email') {
    return (
      <EmailAuthScreen
        onBack={() => setAuthMethod(null)}
        onSuccess={onSuccess}
      />
    );
  }

  return (
    <div className="h-full flex flex-col bg-white">
      {onBack && (
        <div className="p-4">
          <button onClick={onBack} className="inline-flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-lg bg-white text-black text-base font-medium cursor-pointer transition-all hover:bg-gray-50 hover:border-gray-400 hover:-translate-y-0.5 hover:shadow-md active:translate-y-0 active:shadow-sm min-h-[44px]">
            <ArrowLeft className="h-5 w-5" />
            <span>{t('newui.back')}</span>
          </button>
        </div>
      )}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <h1 className="mb-2 text-center text-black">{t('newui.appTitle')}</h1>
          <h2 className="mb-8 text-center text-black">{t('newui.signInTitle')}</h2>
          <p className="mb-8 text-center text-gray-600 text-sm">{t('newui.signInSubtitle')}</p>
          <div className="space-y-4">
            <button
              onClick={handleEmailSignIn}
              disabled={isLoading}
              className="w-full inline-flex items-center justify-center gap-3 px-6 py-3 border border-gray-300 rounded-lg bg-white text-black text-base font-medium cursor-pointer transition-all hover:bg-gray-50 hover:border-gray-400 hover:-translate-y-0.5 hover:shadow-md active:translate-y-0 active:shadow-sm disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none min-h-[44px]"
            >
              <Mail className="h-5 w-5" />
              <span>По email</span>
              <ArrowRight className="h-4 w-4" />
            </button>
            
            <button onClick={handleGoogleSignIn} disabled={isLoading} className="w-full inline-flex items-center justify-center gap-3 px-6 py-3 border border-gray-300 rounded-lg bg-white text-black text-base font-medium cursor-pointer transition-all hover:bg-gray-50 hover:border-gray-400 hover:-translate-y-0.5 hover:shadow-md active:translate-y-0 active:shadow-sm disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none min-h-[44px]">
              <svg className="h-5 w-5" viewBox="0 0 24 24"><path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
              {isLoading ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>{t('common.loading')}</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <span>{t('newui.continueWithGoogle')}</span>
                  <ArrowRight className="h-4 w-4" />
                </div>
              )}
            </button>
            <>
              <div className="relative">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-300"></div></div>
                <div className="relative flex justify-center text-sm"><span className="px-2 bg-white text-gray-600">или</span></div>
              </div>
              <button 
                onClick={handleContinueAsGuest}
                disabled={isLoading}
                className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 border border-gray-300 rounded-lg bg-white text-black text-base font-medium cursor-pointer transition-all hover:bg-gray-50 hover:border-gray-400 hover:-translate-y-0.5 hover:shadow-md active:translate-y-0 active:shadow-sm disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none min-h-[44px]"
              >
                {t('newui.continueAsGuest')}
              </button>
            </>
          </div>
          <p className="mt-8 text-center text-sm text-gray-600">By signing in, you agree to our Terms of Service and Privacy Policy</p>
        </div>
      </div>
    </div>
  );
}


