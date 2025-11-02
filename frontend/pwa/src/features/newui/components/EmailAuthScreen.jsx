import { useState } from 'react';
import { EmailInput } from './EmailInput.jsx';
import { CodeInput } from './CodeInput.jsx';
import { authAPI } from '@shared/services/api';
import { useAuthStore } from '@features/auth/store/authStore';

export function EmailAuthScreen({ onBack, onSuccess }) {
  const [step, setStep] = useState('email'); // 'email' | 'code'
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [retryAfter, setRetryAfter] = useState(120);
  
  const login = useAuthStore((state) => state.login);

  const handleSendCode = async () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      setError('Введите корректный email адрес');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const result = await authAPI.sendEmailCode(email);
      
      if (result.success) {
        setRetryAfter(result.retryAfter || 120);
        setStep('code');
      } else {
        const errorMessage = result.error || 'Ошибка отправки email';
        const retrySeconds = result.retryAfter;
        
        if (errorMessage.includes('wait') || errorMessage.includes('Please wait')) {
          // Показываем сообщение с таймером
          const minutes = Math.floor(retrySeconds / 60);
          const seconds = retrySeconds % 60;
          setError(`Подождите ${minutes} мин ${seconds} сек перед повторной отправкой кода`);
          setRetryAfter(retrySeconds);
        } else {
          setError(errorMessage);
        }
      }
    } catch (err) {
      const errorData = err.response?.data;
      const errorMessage = errorData?.error || err.message || 'Ошибка отправки email';
      const retrySeconds = errorData?.retryAfter;
      
      if (errorMessage.includes('wait') || errorMessage.includes('Please wait')) {
        if (retrySeconds) {
          const minutes = Math.floor(retrySeconds / 60);
          const seconds = retrySeconds % 60;
          setError(`Подождите ${minutes} мин ${seconds} сек перед повторной отправкой кода`);
          setRetryAfter(retrySeconds);
        } else {
          setError('Подождите 2 минуты перед повторной отправкой кода');
          setRetryAfter(120);
        }
      } else {
        setError(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyCode = async (code) => {
    if (!code || code.length !== 6) {
      setError('Введите 6-значный код');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const result = await authAPI.verifyEmailCode(email, code);
      
      if (result.success) {
        // Сохраняем токен и пользователя
        await login(result.token, result.user);
        onSuccess(result.user);
      } else {
        setError(result.error || 'Неверный код');
      }
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Ошибка проверки кода');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRetry = async () => {
    await handleSendCode();
  };

  if (step === 'code') {
    return (
      <div className="min-h-screen flex flex-col bg-white">
        <div className="p-4">
          <div className="max-w-md mx-auto">
            <CodeInput
              email={email}
              onVerify={handleVerifyCode}
              onBack={() => setStep('email')}
              isLoading={isLoading}
              error={error}
              retryAfter={retryAfter}
              onRetry={handleRetry}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <div className="p-4">
        <div className="max-w-md mx-auto">
          <EmailInput
            value={email}
            onChange={setEmail}
            onSubmit={handleSendCode}
            isLoading={isLoading}
            error={error}
          />
        </div>
      </div>
    </div>
  );
}

