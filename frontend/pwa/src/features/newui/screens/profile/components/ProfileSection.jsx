import { User, Mail, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { ru, enUS, uk } from 'date-fns/locale';
import './ProfileSection.css';

const locales = { ru, en: enUS, uk };

export function ProfileSection({ user }) {
  if (!user) {
    return (
      <div className="profile-section-card">
        <p className="text-gray-600">Загрузка данных профиля...</p>
      </div>
    );
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'Не указано';
    try {
      const date = new Date(dateString);
      const lang = localStorage.getItem('language') || 'ru';
      return format(date, 'd MMMM yyyy', { 
        locale: locales[lang] || locales.ru 
      });
    } catch (e) {
      return dateString;
    }
  };

  const getProviderName = (googleId, email) => {
    if (googleId) return 'Google';
    return 'Email';
  };

  return (
    <div className="profile-section-card">
      <div className="profile-avatar-container">
        {user.avatarUrl ? (
          <img
            src={user.avatarUrl}
            alt={user.name || 'User'}
            className="profile-avatar"
          />
        ) : (
          <div className="profile-avatar-placeholder">
            <User className="h-12 w-12 text-gray-400" />
          </div>
        )}
      </div>
      
      <div className="profile-info">
        <h2 className="profile-name">{user.name || 'Пользователь'}</h2>
        
        <div className="profile-details">
          <div className="profile-detail-item">
            <Mail className="h-4 w-4 text-gray-500" />
            <span className="profile-detail-text">{user.email || 'Не указан'}</span>
          </div>
          
          <div className="profile-detail-item">
            <span className="profile-detail-label">Вход через:</span>
            <span className="profile-detail-text">
              {getProviderName(user.googleId, user.email)}
            </span>
          </div>
          
          {user.createdAt && (
            <div className="profile-detail-item">
              <Calendar className="h-4 w-4 text-gray-500" />
              <span className="profile-detail-text">
                Участник с: {formatDate(user.createdAt)}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

