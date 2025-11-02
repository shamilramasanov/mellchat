import React from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Users, 
  MessageSquare, 
  Activity, 
  Zap, 
  BarChart3, 
  TrendingUp,
  CheckCircle,
  AlertTriangle,
  Clock,
  ArrowUp,
  ArrowDown,
  RefreshCw
} from 'lucide-react';
import { useSystemMetrics } from '../../hooks/useAdminData';

const DashboardContent = () => {
  const { t } = useTranslation();
  const { metrics, loading, error, lastUpdated, refresh } = useSystemMetrics();
  
  const metricsData = metrics ? [
    { 
      title: t('common.activeConnections'), 
      value: metrics.activeConnections?.toLocaleString() || '0', 
      change: '+12%', 
      changeType: 'positive',
      icon: Users, 
      color: 'text-blue-500',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200'
    },
    { 
      title: t('common.messagesPerSecond'), 
      value: metrics.messagesPerSecond?.toFixed(1) || '0', 
      change: '+5%', 
      changeType: 'positive',
      icon: MessageSquare, 
      color: 'text-green-500',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200'
    },
    { 
      title: t('common.usersOnline'), 
      value: metrics.usersOnline?.toLocaleString() || '0', 
      change: '+8%', 
      changeType: 'positive',
      icon: Activity, 
      color: 'text-purple-500',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200'
    },
    { 
      title: 'Сообщений в БД', 
      value: metrics.totalMessagesCount?.toLocaleString() || '0', 
      change: '', 
      changeType: 'neutral',
      icon: BarChart3, 
      color: 'text-indigo-500',
      bgColor: 'bg-indigo-50',
      borderColor: 'border-indigo-200'
    },
    { 
      title: t('common.systemLoad'), 
      value: `${metrics.systemLoad || 0}%`, 
      change: '-2%', 
      changeType: 'negative',
      icon: Zap, 
      color: 'text-orange-500',
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-200'
    }
  ] : [];

  const alerts = [
    {
      type: 'success',
      icon: CheckCircle,
      title: t('common.allSystemsOperational'),
      description: t('common.allServicesRunning'),
      time: t('common.twoMinutesAgo')
    },
    {
      type: 'warning',
      icon: AlertTriangle,
      title: t('common.highMemoryUsage'),
      description: t('common.memoryUsageDescription'),
      time: t('common.fiveMinutesAgo')
    },
    {
      type: 'info',
      icon: Clock,
      title: t('common.scheduledMaintenance'),
      description: t('common.maintenanceDescription'),
      time: t('common.oneHourAgo')
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header with refresh button */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{t('common.dashboard')}</h2>
          <p className="text-gray-600">{t('common.dashboard')}</p>
        </div>
        <div className="flex items-center space-x-4">
          {lastUpdated && (
            <span className="text-sm text-gray-500">
              {t('common.lastUpdated')}: {lastUpdated.toLocaleTimeString()}
            </span>
          )}
          <button
            onClick={refresh}
            disabled={loading}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            <span>{t('common.refresh')}</span>
          </button>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex items-center">
            <AlertTriangle className="h-5 w-5 text-red-500 mr-2" />
            <span className="text-red-700">Failed to load data: {error}</span>
          </div>
        </div>
      )}

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        {metricsData.map((metric, index) => {
          const Icon = metric.icon;
          return (
            <div key={index} className={`bg-white p-6 rounded-lg border ${metric.borderColor} shadow-sm hover:shadow-md transition-shadow`}>
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600 mb-1">{metric.title}</p>
                  <p className="text-2xl font-bold text-gray-900">{metric.value}</p>
                </div>
                <div className={`p-3 rounded-lg ${metric.bgColor}`}>
                  <Icon className={`h-6 w-6 ${metric.color}`} />
                </div>
              </div>
              {metric.change && (
                <div className="mt-4 flex items-center">
                  <div className={`flex items-center space-x-1 ${
                    metric.changeType === 'positive' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {metric.changeType === 'positive' ? (
                      <ArrowUp className="h-4 w-4" />
                    ) : (
                      <ArrowDown className="h-4 w-4" />
                    )}
                    <span className="text-sm font-medium">{metric.change}</span>
                  </div>
                  <span className="text-sm text-gray-500 ml-2">{t('common.vsLastHour')}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">{t('common.messageFlow')}</h3>
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <span>{t('common.messages')}</span>
            </div>
          </div>
          <div className="h-64 flex items-center justify-center text-gray-400">
            <div className="text-center">
              <BarChart3 className="h-12 w-12 mx-auto mb-2" />
              <p>{t('common.chartPlaceholder')}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">{t('common.platformDistribution')}</h3>
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span>{t('common.platforms')}</span>
            </div>
          </div>
          <div className="h-64 flex items-center justify-center text-gray-400">
            <div className="text-center">
              <TrendingUp className="h-12 w-12 mx-auto mb-2" />
              <p>{t('common.chartPlaceholder')}</p>
            </div>
          </div>
        </div>
      </div>

      {/* System Alerts */}
      <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('common.systemAlerts')}</h3>
        <div className="space-y-3">
          {alerts.map((alert, index) => {
            const Icon = alert.icon;
            return (
              <div key={index} className={`flex items-start space-x-3 p-4 rounded-lg ${
                alert.type === 'success' ? 'bg-green-50 border border-green-200' :
                alert.type === 'warning' ? 'bg-yellow-50 border border-yellow-200' :
                'bg-blue-50 border border-blue-200'
              }`}>
                <Icon className={`h-5 w-5 mt-0.5 ${
                  alert.type === 'success' ? 'text-green-500' :
                  alert.type === 'warning' ? 'text-yellow-500' :
                  'text-blue-500'
                }`} />
                <div className="flex-1">
                  <h4 className={`text-sm font-medium ${
                    alert.type === 'success' ? 'text-green-800' :
                    alert.type === 'warning' ? 'text-yellow-800' :
                    'text-blue-800'
                  }`}>
                    {alert.title}
                  </h4>
                  <p className={`text-sm mt-1 ${
                    alert.type === 'success' ? 'text-green-600' :
                    alert.type === 'warning' ? 'text-yellow-600' :
                    'text-blue-600'
                  }`}>
                    {alert.description}
                  </p>
                  <p className="text-xs text-gray-500 mt-2">{alert.time}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default DashboardContent;
