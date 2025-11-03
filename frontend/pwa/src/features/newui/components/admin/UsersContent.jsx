import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Users, 
  Mail, 
  User, 
  Calendar,
  Shield,
  Search,
  RefreshCw,
  Loader2,
  AlertCircle,
  CheckCircle,
  XCircle,
  WifiOff,
  MoreVertical
} from 'lucide-react';
import { useUsers } from '../../hooks/useAdminData';
import { formatDistanceToNow } from 'date-fns';
import { ru } from 'date-fns/locale';
import { adminAPI } from '@shared/services/adminAPI';
import toast from 'react-hot-toast';

const UsersContent = () => {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const { users, total, registered, guests, loading, error, lastUpdated, refresh } = useUsers(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [disconnectingUserId, setDisconnectingUserId] = useState(null);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refresh();
    setIsRefreshing(false);
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return t('admin.users.never');
    try {
      const date = new Date(timestamp);
      return formatDistanceToNow(date, { addSuffix: true, locale: ru });
    } catch {
      return timestamp;
    }
  };

  const handleDisconnectUser = async (userId, sessionId = null) => {
    if (!confirm(`Отключить пользователя от всех стримов?`)) {
      return;
    }

    setDisconnectingUserId(userId);
    try {
      const response = await adminAPI.disconnectUser(userId, sessionId);
      toast.success(response.message || 'Пользователь отключен от стримов');
      // Обновляем список после отключения
      await refresh();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Ошибка при отключении пользователя');
    } finally {
      setDisconnectingUserId(null);
    }
  };

  const filteredUsers = users.filter(user => {
    const search = searchQuery.toLowerCase();
    return !search || 
      (user.email && user.email.toLowerCase().includes(search)) ||
      (user.name && user.name.toLowerCase().includes(search)) ||
      (user.id && user.id.toLowerCase().includes(search));
  });

  if (loading && !users) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">{t('admin.common.loading')}</p>
        </div>
      </div>
    );
  }

  if (error && !users) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
          <p className="text-red-600 mb-2">{t('admin.common.error')}</p>
          <p className="text-sm text-gray-600 mb-4">{error}</p>
          <button
            onClick={handleRefresh}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            {t('admin.common.retry')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{t('admin.users.title')}</h2>
          <p className="text-gray-600">{t('admin.users.subtitle')}</p>
          {lastUpdated && (
            <p className="text-sm text-gray-500 mt-1">
              {t('admin.common.lastUpdated')}: {lastUpdated.toLocaleTimeString()}
            </p>
          )}
        </div>
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder={t('admin.users.searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-400"
            />
          </div>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>{t('admin.common.refresh')}</span>
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">{t('admin.users.totalUsers')}</p>
              <p className="text-2xl font-bold text-gray-900">{total}</p>
            </div>
            <Users className="h-8 w-8 text-blue-500" />
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Зарегистрированные</p>
              <p className="text-2xl font-bold text-gray-900">{registered}</p>
            </div>
            <User className="h-8 w-8 text-green-500" />
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Гости</p>
              <p className="text-2xl font-bold text-gray-900">{guests}</p>
            </div>
            <User className="h-8 w-8 text-gray-500" />
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">{t('admin.users.verifiedUsers')}</p>
              <p className="text-2xl font-bold text-gray-900">
                {users.filter(u => u.emailVerified).length}
              </p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-500" />
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">{t('admin.users.googleUsers')}</p>
              <p className="text-2xl font-bold text-gray-900">
                {users.filter(u => u.googleId).length}
              </p>
            </div>
            <Shield className="h-8 w-8 text-purple-500" />
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            {t('admin.users.usersList')} ({filteredUsers.length})
          </h3>
          <p className="text-sm text-gray-600">{t('admin.users.subtitle')}</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('admin.users.user')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('admin.users.email')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('admin.users.authMethod')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('admin.users.status')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('admin.users.registered')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('admin.users.lastLogin')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Действия
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsers.length > 0 ? filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        {user.avatarUrl ? (
                          <img 
                            src={user.avatarUrl} 
                            alt={user.name || user.email}
                            className="h-10 w-10 rounded-full"
                          />
                        ) : (
                          <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                            <User className="h-6 w-6 text-gray-600" />
                          </div>
                        )}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {user.name || t('admin.users.noName')}
                        </div>
                        <div className="text-xs text-gray-500 truncate max-w-xs">
                          {user.id}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{user.email || '-'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      user.type === 'guest'
                        ? 'bg-gray-100 text-gray-800'
                        : user.authMethod === 'Google' 
                          ? 'bg-purple-100 text-purple-800' 
                          : 'bg-blue-100 text-blue-800'
                    }`}>
                      {user.type === 'guest' ? 'Гость' : (user.authMethod === 'Google' ? 'Google' : 'Email')}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {user.type === 'guest' ? (
                      <span className="inline-flex items-center space-x-1 px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                        <User className="h-3 w-3" />
                        <span>Гость</span>
                      </span>
                    ) : user.emailVerified ? (
                      <span className="inline-flex items-center space-x-1 px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                        <CheckCircle className="h-3 w-3" />
                        <span>{t('admin.users.verified')}</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center space-x-1 px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                        <XCircle className="h-3 w-3" />
                        <span>{t('admin.users.unverified')}</span>
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatTimestamp(user.createdAt)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatTimestamp(user.lastLoginAt)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <button
                      onClick={() => handleDisconnectUser(user.id, user.sessionId)}
                      disabled={disconnectingUserId === user.id}
                      className="inline-flex items-center space-x-1 px-3 py-1.5 text-xs font-medium text-red-700 bg-red-50 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Отключить от всех стримов"
                    >
                      {disconnectingUserId === user.id ? (
                        <>
                          <Loader2 className="h-3 w-3 animate-spin" />
                          <span>Отключение...</span>
                        </>
                      ) : (
                        <>
                          <WifiOff className="h-3 w-3" />
                          <span>Отключить</span>
                        </>
                      )}
                    </button>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="7" className="px-6 py-8 text-center text-gray-500">
                    {searchQuery ? t('admin.users.noUsersFound') : t('admin.users.noUsers')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default UsersContent;

