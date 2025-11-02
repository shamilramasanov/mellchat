import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Shield, 
  Lock, 
  Eye, 
  EyeOff,
  AlertTriangle, 
  CheckCircle, 
  Clock,
  Users,
  Key,
  RefreshCw,
  Settings,
  Ban,
  UserCheck,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { useSecurityInfo } from '../../hooks/useAdminData';

const SecurityContent = () => {
  const { t } = useTranslation();
  const { security, loading, error, lastUpdated, refresh, unblockIP } = useSecurityInfo();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refresh();
    setIsRefreshing(false);
  };

  const handleUnblockIP = async (ip) => {
    try {
      await unblockIP(ip);
      await refresh();
    } catch (err) {
      console.error('Failed to unblock IP:', err);
    }
  };

  // Используем реальные данные из API или fallback
  const securityMetrics = security ? [
    {
      title: t('admin.security.activeSessions'),
      value: (security.activeSessions || 0).toString(),
      status: 'good',
      icon: Users,
      color: 'text-blue-500',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200'
    },
    {
      title: t('admin.security.failedLogins'),
      value: (security.failedLogins || 0).toString(),
      status: security.failedLogins > 10 ? 'warning' : 'good',
      icon: Lock,
      color: security.failedLogins > 10 ? 'text-yellow-500' : 'text-green-500',
      bgColor: security.failedLogins > 10 ? 'bg-yellow-50' : 'bg-green-50',
      borderColor: security.failedLogins > 10 ? 'border-yellow-200' : 'border-green-200'
    },
    {
      title: t('admin.security.blockedIPs'),
      value: (security.blockedIPs?.length || 0).toString(),
      status: security.blockedIPs?.length > 0 ? 'warning' : 'good',
      icon: Ban,
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-200'
    },
    {
      title: t('admin.security.securityScore'),
      value: `${security.securityScore || 0}%`,
      status: security.securityScore >= 90 ? 'excellent' : security.securityScore >= 70 ? 'good' : 'warning',
      icon: Shield,
      color: security.securityScore >= 90 ? 'text-purple-500' : 'text-orange-500',
      bgColor: security.securityScore >= 90 ? 'bg-purple-50' : 'bg-orange-50',
      borderColor: security.securityScore >= 90 ? 'border-purple-200' : 'border-orange-200'
    }
  ] : [
    {
      title: t('admin.security.activeSessions'),
      value: 'N/A',
      status: 'warning',
      icon: Users,
      color: 'text-gray-500',
      bgColor: 'bg-gray-50',
      borderColor: 'border-gray-200'
    },
    {
      title: t('admin.security.failedLogins'),
      value: 'N/A',
      status: 'warning',
      icon: Lock,
      color: 'text-gray-500',
      bgColor: 'bg-gray-50',
      borderColor: 'border-gray-200'
    },
    {
      title: t('admin.security.blockedIPs'),
      value: 'N/A',
      status: 'warning',
      icon: Ban,
      color: 'text-gray-500',
      bgColor: 'bg-gray-50',
      borderColor: 'border-gray-200'
    },
    {
      title: t('admin.security.securityScore'),
      value: 'N/A',
      status: 'warning',
      icon: Shield,
      color: 'text-gray-500',
      bgColor: 'bg-gray-50',
      borderColor: 'border-gray-200'
    }
  ];

  const recentActivities = security?.recentActivities || [];
  const blockedIPs = security?.blockedIPs || [];
  const securitySettings = security?.settings || [];

  const getStatusColor = (status) => {
    switch (status) {
      case 'success': return 'text-green-600 bg-green-100';
      case 'blocked': return 'text-red-600 bg-red-100';
      case 'warning': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  if (loading && !security) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Загрузка данных безопасности...</p>
        </div>
      </div>
    );
  }

  if (error && !security) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
          <p className="text-red-600 mb-2">Ошибка загрузки данных</p>
          <p className="text-sm text-gray-600 mb-4">{error}</p>
          <button
            onClick={handleRefresh}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Попробовать снова
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
          <h2 className="text-2xl font-bold text-gray-900">{t('admin.security.title')}</h2>
          <p className="text-gray-600">{t('admin.security.subtitle')}</p>
        </div>
        <div className="flex items-center space-x-4">
          {lastUpdated && (
            <span className="text-sm text-gray-500">
              {t('admin.common.lastUpdated')}: {lastUpdated.toLocaleTimeString()}
            </span>
          )}
          <button
            onClick={handleRefresh}
            disabled={isRefreshing || loading}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing || loading ? 'animate-spin' : ''}`} />
            <span>{t('admin.common.refresh')}</span>
          </button>
        </div>
      </div>

      {/* Security Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {securityMetrics.map((metric, index) => {
          // Определяем иконку с fallback
          const getMetricIcon = (title) => {
            const t = (title || '').toLowerCase();
            if (t.includes('session')) return Users;
            if (t.includes('login') || t.includes('failed')) return Lock;
            if (t.includes('blocked') || t.includes('ip') || t.includes('ban')) return Ban;
            if (t.includes('security') || t.includes('score')) return Shield;
            return Shield; // Default
          };
          const Icon = metric.icon || getMetricIcon(metric.title);
          return (
            <div key={index} className={`bg-white p-6 rounded-lg border ${metric.borderColor} shadow-sm hover:shadow-md transition-shadow`}>
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600 mb-1">{metric.title}</p>
                  <p className="text-2xl font-bold text-gray-900">{metric.value}</p>
                </div>
                <div className={`p-3 rounded-lg ${metric.bgColor}`}>
                  {Icon && <Icon className={`h-6 w-6 ${metric.color}`} />}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent Security Activities */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">{t('admin.security.recentActivities')}</h3>
          <p className="text-sm text-gray-600">{t('admin.security.subtitle')}</p>
        </div>
        <div className="divide-y divide-gray-200">
          {recentActivities.length > 0 ? recentActivities.map((activity, index) => {
            const Icon = activity.icon || CheckCircle;
            return (
              <div key={index} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    {Icon && (
                      <Icon className={`h-5 w-5 ${
                        activity.status === 'success' ? 'text-green-500' :
                        activity.status === 'blocked' ? 'text-red-500' :
                        'text-yellow-500'
                      }`} />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="text-sm font-medium text-gray-900 capitalize">
                        {activity.type ? activity.type.replace('_', ' ') : 'activity'}
                      </span>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(activity.status || 'success')}`}>
                        {activity.status || 'success'}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                      <div>
                        <span className="font-medium">User:</span> {activity.user || activity.username || 'N/A'}
                      </div>
                      <div>
                        <span className="font-medium">IP:</span> {activity.ip || activity.ipAddress || 'N/A'}
                      </div>
                      <div>
                        <span className="font-medium">Location:</span> {activity.location || 'Unknown'}
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">{t('admin.security.timestamp')}: {activity.timestamp || activity.createdAt || 'N/A'}</p>
                  </div>
                </div>
              </div>
            );
          }) : (
            <div className="p-6 text-center text-gray-500">
              {t('admin.security.recentActivities')}
            </div>
          )}
        </div>
      </div>

      {/* Security Settings */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">{t('admin.security.settings')}</h3>
          <p className="text-sm text-gray-600">{t('admin.security.subtitle')}</p>
        </div>
        <div className="divide-y divide-gray-200">
          {securitySettings.map((setting, index) => {
            // Определяем иконку с fallback
            const getSettingIcon = (name) => {
              const n = (name || '').toLowerCase();
              if (n.includes('two') || n.includes('2fa') || n.includes('factor')) return Shield;
              if (n.includes('ip') || n.includes('whitelist')) return Lock;
              if (n.includes('session') || n.includes('timeout')) return Clock;
              if (n.includes('password') || n.includes('policy')) return Key;
              return Shield; // Default
            };
            const Icon = setting.icon || getSettingIcon(setting.name);
            return (
              <div key={index} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="p-2 bg-gray-100 rounded-lg">
                      {Icon && <Icon className="h-5 w-5 text-gray-600" />}
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">{setting.name}</h4>
                      <p className="text-sm text-gray-500">{setting.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      setting.enabled ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {setting.enabled ? t('admin.security.enabled') : t('admin.security.disabled')}
                    </span>
                    <button className="text-blue-600 hover:text-blue-900 text-sm font-medium">
                      {t('common.settings')}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Blocked IPs */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">{t('admin.security.blockedIPsList')}</h3>
          <p className="text-sm text-gray-600">{t('admin.security.subtitle')}</p>
        </div>
        <div className="divide-y divide-gray-200">
          {blockedIPs.length > 0 ? blockedIPs.map((blocked, index) => (
            <div key={index} className="p-6 hover:bg-gray-50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="p-2 bg-red-100 rounded-lg">
                    <Ban className="h-5 w-5 text-red-600" />
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">{blocked.ip || blocked.ipAddress}</h4>
                    <p className="text-sm text-gray-500">{t('admin.security.reason')}: {blocked.reason || 'Suspicious activity'}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <span className="text-sm text-gray-500">{t('admin.security.blockedAt')}: {blocked.blockedAt || blocked.createdAt || 'N/A'}</span>
                  <button 
                    onClick={() => handleUnblockIP(blocked.ip || blocked.ipAddress)}
                    className="text-red-600 hover:text-red-900 text-sm font-medium"
                  >
                    {t('admin.security.unblock')}
                  </button>
                </div>
              </div>
            </div>
          )) : (
            <div className="p-6 text-center text-gray-500">
              {t('admin.security.blockedIPsList')}
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <button className="w-full flex items-center space-x-3 px-4 py-3 text-left text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
              <UserCheck className="h-5 w-5" />
              <span>Review Active Sessions</span>
            </button>
            <button className="w-full flex items-center space-x-3 px-4 py-3 text-left text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
              <Shield className="h-5 w-5" />
              <span>Run Security Scan</span>
            </button>
            <button className="w-full flex items-center space-x-3 px-4 py-3 text-left text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
              <Key className="h-5 w-5" />
              <span>Reset All Passwords</span>
            </button>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Security Status</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Overall Security</span>
              <div className="flex items-center space-x-2">
                <div className="w-16 bg-gray-200 rounded-full h-2">
                  <div className="h-2 bg-green-500 rounded-full" style={{ width: '94%' }}></div>
                </div>
                <span className="text-sm font-medium text-gray-900">94%</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Threat Level</span>
              <span className="text-sm font-medium text-green-600">Low</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Last Scan</span>
              <span className="text-sm font-medium text-gray-900">2 hours ago</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SecurityContent;
