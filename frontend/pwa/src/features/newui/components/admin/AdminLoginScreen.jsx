import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Shield, Lock, User, AlertCircle, Loader2 } from 'lucide-react';
import { adminAPI } from '@shared/services/adminAPI';

const AdminLoginScreen = ({ onSuccess, onBack }) => {
  const { t } = useTranslation();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    
    if (!username || !password) {
      setError('Введите имя пользователя и пароль');
      return;
    }

    setIsLoading(true);

    try {
      console.log('🔐 Admin login attempt:', { username });
      const response = await adminAPI.login(username, password);
      console.log('✅ Admin login response:', { success: response.success, hasToken: !!response.token });

      if (response.success && response.token) {
        // Сохраняем токен
        localStorage.setItem('admin_token', response.token);
        localStorage.setItem('admin_user', JSON.stringify(response.user));
        console.log('💾 Admin token saved to localStorage');
        
        // Небольшая задержка перед вызовом onSuccess для обеспечения сохранения токена
        setTimeout(() => {
          if (onSuccess) {
            console.log('📞 Calling onSuccess callback');
            onSuccess(response.token, response.user);
          }
        }, 100);
      } else {
        console.error('❌ Login failed:', response);
        setError(response.error || 'Ошибка входа');
      }
    } catch (err) {
      console.error('❌ Admin login error:', err);
      console.error('❌ Error response:', err.response?.data);
      setError(
        err.response?.data?.error || 
        err.message || 
        'Не удалось войти. Проверьте учетные данные.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-full bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
              <Shield className="h-8 w-8 text-blue-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Админ панель
            </h1>
            <p className="text-gray-600">
              Введите учетные данные для входа
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2">
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
              <span className="text-sm text-red-700">{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Username */}
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
                Имя пользователя
              </label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="admin"
                  className="w-full pl-12 pr-4 py-3 border-2 border-gray-300 rounded-lg text-black focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={isLoading}
                  autoFocus
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Пароль
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-12 pr-4 py-3 border-2 border-gray-300 rounded-lg text-black focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={isLoading}
                  required
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading || !username || !password}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Вход...</span>
                </>
              ) : (
                <span>Войти</span>
              )}
            </button>
          </form>

          {/* Back Button */}
          {onBack && (
            <div className="mt-6 text-center">
              <button
                onClick={onBack}
                className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
                disabled={isLoading}
              >
                ← Назад к приложению
              </button>
            </div>
          )}

          {/* Info */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-xs text-gray-500 text-center">
              По умолчанию: username: <code className="bg-gray-100 px-1 rounded">admin</code>, password: <code className="bg-gray-100 px-1 rounded">password</code>
              <br />
              Можно изменить через переменную окружения <code className="bg-gray-100 px-1 rounded">ADMIN_PASSWORD</code>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLoginScreen;

