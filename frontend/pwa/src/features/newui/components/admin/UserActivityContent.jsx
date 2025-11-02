import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Activity,
  Users,
  Eye,
  Clock,
  MessageSquare,
  TrendingUp,
  Filter,
  RefreshCw,
  Play,
  X,
  BarChart3,
  Calendar,
  AlertTriangle
} from 'lucide-react';
import { adminAPI } from '@shared/services/adminAPI';
import { formatDistanceToNow } from 'date-fns';
import { ru } from 'date-fns/locale';

const UserActivityContent = () => {
  const { t } = useTranslation();
  const [timeRange, setTimeRange] = useState('24h');
  const [activity, setActivity] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userDetail, setUserDetail] = useState(null);
  const [filterPlatform, setFilterPlatform] = useState('all');

  const timeRanges = [
    { value: '1h', label: t('admin.analytics.timeRange.1h') },
    { value: '24h', label: t('admin.analytics.timeRange.24h') },
    { value: '7d', label: t('admin.analytics.timeRange.7d') },
    { value: '30d', label: t('admin.analytics.timeRange.30d') }
  ];

  const loadActivity = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminAPI.getUserActivity(timeRange, null, null, filterPlatform === 'all' ? null : filterPlatform);
      setActivity(data);
    } catch (err) {
      setError(err.message || 'Ошибка загрузки активности');
      console.error('Failed to load activity:', err);
    } finally {
      setLoading(false);
    }
  }, [timeRange, filterPlatform]);

  const loadUserDetail = useCallback(async (identifier) => {
    try {
      const data = await adminAPI.getUserActivityDetail(identifier, timeRange);
      setUserDetail(data);
    } catch (err) {
      console.error('Failed to load user detail:', err);
    }
  }, [timeRange]);

  useEffect(() => {
    loadActivity();
    const interval = setInterval(loadActivity, 30000); // Обновление каждые 30 секунд
    return () => clearInterval(interval);
  }, [loadActivity]);

  useEffect(() => {
    if (selectedUser) {
      loadUserDetail(selectedUser);
    }
  }, [selectedUser, loadUserDetail]);

  const formatDuration = (ms) => {
    if (!ms || ms < 0) return '0 сек';
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) return `${hours}ч ${minutes % 60}м`;
    if (minutes > 0) return `${minutes}м ${seconds % 60}с`;
    return `${seconds}с`;
  };

  if (loading && !activity) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center">
          <AlertTriangle className="h-5 w-5 text-red-500 mr-2" />
          <span className="text-red-700">{error}</span>
        </div>
      </div>
    );
  }

  const stats = activity?.stats || {};
  const users = activity?.users || [];
  const streams = activity?.streams || [];
  const recentActivity = activity?.recentActivity || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{t('admin.userActivity.title')}</h2>
          <p className="text-gray-600">{t('admin.userActivity.subtitle')}</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-gray-500" />
            <select
              value={filterPlatform}
              onChange={(e) => setFilterPlatform(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white"
            >
              <option value="all">{t('admin.userActivity.allPlatforms')}</option>
              <option value="twitch">Twitch</option>
              <option value="youtube">YouTube</option>
              <option value="kick">Kick</option>
            </select>
          </div>
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white"
          >
            {timeRanges.map(range => (
              <option key={range.value} value={range.value}>{range.label}</option>
            ))}
          </select>
          <button
            onClick={loadActivity}
            disabled={loading}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            <span>{t('admin.common.refresh')}</span>
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">{t('admin.userActivity.totalActions')}</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalActions?.toLocaleString() || 0}</p>
            </div>
            <Activity className="h-8 w-8 text-blue-500" />
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">{t('admin.userActivity.uniqueUsers')}</p>
              <p className="text-2xl font-bold text-gray-900">{stats.uniqueUsers?.toLocaleString() || 0}</p>
            </div>
            <Users className="h-8 w-8 text-green-500" />
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">{t('admin.userActivity.streamsOpened')}</p>
              <p className="text-2xl font-bold text-gray-900">{stats.streamsOpened?.toLocaleString() || 0}</p>
            </div>
            <Play className="h-8 w-8 text-purple-500" />
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">{t('admin.userActivity.messagesViewed')}</p>
              <p className="text-2xl font-bold text-gray-900">{stats.messagesViewed?.toLocaleString() || 0}</p>
            </div>
            <Eye className="h-8 w-8 text-orange-500" />
          </div>
        </div>
      </div>

      {/* Two columns: Users and Streams */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Users Activity */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">{t('admin.userActivity.users')}</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('admin.userActivity.user')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('admin.userActivity.actions')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('admin.userActivity.streams')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('admin.userActivity.messages')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {users.slice(0, 10).map((user, index) => (
                  <tr 
                    key={index} 
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => setSelectedUser(user.identifier)}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                          user.type === 'registered' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {user.type === 'registered' ? '👤' : '👁️'} {user.identifier.substring(0, 16)}...
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">{user.totalActions}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{user.streamsOpened}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{user.messagesViewed}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Streams Activity */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">{t('admin.userActivity.streams')}</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('admin.userActivity.channel')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('admin.userActivity.platform')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('admin.userActivity.viewers')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('admin.userActivity.opens')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {streams.slice(0, 10).map((stream, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{stream.channelName || stream.streamId.substring(0, 20)}</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-800">
                        {stream.platform}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">{stream.uniqueViewers}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{stream.openCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* User Detail Modal */}
      {selectedUser && userDetail && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setSelectedUser(null)}>
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900">{t('admin.userActivity.userDetail')}</h3>
              <button onClick={() => setSelectedUser(null)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">{t('admin.userActivity.totalStreams')}</p>
                  <p className="text-2xl font-bold text-gray-900">{userDetail.totalStreams}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">{t('admin.userActivity.totalDuration')}</p>
                  <p className="text-2xl font-bold text-gray-900">{formatDuration(userDetail.totalDuration)}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">{t('admin.userActivity.totalMessages')}</p>
                  <p className="text-2xl font-bold text-gray-900">{userDetail.totalMessagesViewed}</p>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-2 text-gray-900">{t('admin.userActivity.streamSessions')}</h4>
                <div className="space-y-2">
                  {userDetail.streams.map((stream, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <span className="font-medium text-gray-900">{stream.channelName || stream.streamId}</span>
                          <span className="ml-2 text-xs text-gray-500">{stream.platform}</span>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">{t('admin.userActivity.sessions')}: </span>
                          <span className="font-medium text-gray-900">{stream.sessions.length}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">{t('admin.userActivity.duration')}: </span>
                          <span className="font-medium text-gray-900">{formatDuration(stream.totalDuration)}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">{t('admin.userActivity.messages')}: </span>
                          <span className="font-medium text-gray-900">{stream.totalMessagesViewed}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Recent Activity */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">{t('admin.userActivity.recentActivity')}</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('admin.userActivity.user')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('admin.userActivity.action')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('admin.userActivity.stream')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('admin.userActivity.platform')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('admin.userActivity.time')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {recentActivity.slice(0, 20).map((activity, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-900">
                      {activity.userId ? activity.userId.substring(0, 16) + '...' : activity.sessionId?.substring(0, 16) + '...'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                      activity.action === 'open' ? 'bg-green-100 text-green-800' :
                      activity.action === 'close' ? 'bg-red-100 text-red-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {activity.action === 'open' ? '▶️ Открыт' : activity.action === 'close' ? '⏹️ Закрыт' : '👁️ Просмотр'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">{activity.channelName || activity.streamId.substring(0, 20)}</td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-800">
                      {activity.platform}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true, locale: ru })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default UserActivityContent;

