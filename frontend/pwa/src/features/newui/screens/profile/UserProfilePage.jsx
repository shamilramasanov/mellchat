import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, LogOut } from 'lucide-react';
import { authAPI, userAPI } from '@shared/services/api';
import { useAuthStore } from '@features/auth/store/authStore';
import { ProfileSection } from './components/ProfileSection.jsx';
import { AISettingsSection } from './components/AISettingsSection.jsx';
import { AppSettingsSection } from './components/AppSettingsSection.jsx';
import './UserProfilePage.css';

export function UserProfilePage({ onBack }) {
  const { t } = useTranslation();
  const [user, setUser] = useState(null);
  const [settings, setSettings] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const logout = useAuthStore((state) => state.logout);

  useEffect(() => {
    loadProfileData();
  }, []);

  const loadProfileData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const [profileResult, settingsResult] = await Promise.all([
        authAPI.getProfile(),
        userAPI.getSettings()
      ]);
      
      if (profileResult.success) {
        setUser(profileResult.user);
      }
      
      if (settingsResult.success) {
        setSettings(settingsResult.settings);
      }
    } catch (err) {
      console.error('Error loading profile data:', err);
      setError('Не удалось загрузить данные профиля');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await authAPI.logout();
      logout();
      if (onBack) {
        onBack();
      }
    } catch (err) {
      console.error('Logout error:', err);
      // Всё равно выходим даже если запрос не прошел
      logout();
      if (onBack) {
        onBack();
      }
    }
  };

  if (isLoading) {
    return (
      <div className="user-profile-page">
        <div className="flex items-center justify-center h-full">
          <p className="text-gray-600">Загрузка...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="user-profile-page">
        <div className="flex flex-col items-center justify-center h-full space-y-4">
          <p className="text-red-600">{error}</p>
          <button
            onClick={loadProfileData}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            Повторить
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="user-profile-page">
      {/* Header */}
      <div className="profile-header">
        <button
          onClick={onBack}
          className="back-button"
          aria-label={t('common.back')}
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="profile-title">{t('profile.title', 'Профиль')}</h1>
        <button
          onClick={handleLogout}
          className="logout-button"
          aria-label={t('auth.logout', 'Выйти')}
        >
          <LogOut className="h-5 w-5" />
        </button>
      </div>

      {/* Content */}
      <div className="profile-content">
        <ProfileSection user={user} />
        <AISettingsSection userId={user?.id} />
        <AppSettingsSection settings={settings} onSettingsChange={setSettings} />
      </div>
    </div>
  );
}

