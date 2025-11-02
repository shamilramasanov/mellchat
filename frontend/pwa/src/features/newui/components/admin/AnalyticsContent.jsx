import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  TrendingUp, 
  Users, 
  MessageSquare, 
  Eye,
  BarChart3,
  PieChart,
  Activity,
  Clock,
  ArrowUp,
  ArrowDown,
  Filter,
  Download,
  RefreshCw,
  AlertTriangle
} from 'lucide-react';
import { useAnalytics } from '../../hooks/useAdminData';

const AnalyticsContent = () => {
  const { t } = useTranslation();
  const [timeRange, setTimeRange] = useState('24h');
  const { analytics, loading, error, lastUpdated, refresh } = useAnalytics(timeRange);
  
  const timeRanges = [
    { value: '1h', label: t('admin.analytics.timeRange.1h') },
    { value: '24h', label: t('admin.analytics.timeRange.24h') },
    { value: '7d', label: t('admin.analytics.timeRange.7d') },
    { value: '30d', label: t('admin.analytics.timeRange.30d') }
  ];

  // Получаем данные из аналитики
  const platformAnalytics = analytics?.platform || {};
  const guestsData = analytics?.guests || {};
  const platformDistribution = analytics?.platform?.platforms || [];
  const topChannels = analytics?.streams?.streams || [];
  
  const analyticsMetrics = analytics ? [
    {
      title: t('admin.analytics.totalMessages'),
      value: (platformAnalytics.totalMessages || 0).toLocaleString(),
      change: '+12.5%',
      changeType: 'positive',
      icon: MessageSquare,
      color: 'text-blue-500',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200'
    },
    {
      title: t('admin.analytics.uniqueUsers'),
      value: (platformAnalytics.totalUniqueUsers || 0).toLocaleString(),
      change: '+8.2%',
      changeType: 'positive',
      icon: Users,
      color: 'text-green-500',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200'
    },
    {
      title: t('admin.analytics.guests'),
      value: (guestsData.activeGuests || 0).toLocaleString(),
      subtitle: `${guestsData.totalGuests || 0} всего`,
      change: '+15.3%',
      changeType: 'positive',
      icon: Eye,
      color: 'text-purple-500',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200'
    },
    {
      title: t('admin.analytics.streamsViewed'),
      value: (guestsData.totalStreamsOpened || 0).toLocaleString(),
      subtitle: `${guestsData.avgStreamsPerSession?.toFixed(1) || 0} на сессию`,
      change: '+10.2%',
      changeType: 'positive',
      icon: BarChart3,
      color: 'text-orange-500',
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-200'
    }
  ] : [];

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{t('admin.analytics.title')}</h2>
          <p className="text-gray-600">{t('admin.analytics.subtitle')}</p>
        </div>
        <div className="flex items-center space-x-4">
          {lastUpdated && (
            <span className="text-sm text-gray-500">
              {t('admin.common.lastUpdated')}: {lastUpdated.toLocaleTimeString()}
            </span>
          )}
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-gray-500" />
            <select 
              value={timeRange} 
              onChange={(e) => setTimeRange(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {timeRanges.map(range => (
                <option key={range.value} value={range.value}>{range.label}</option>
              ))}
            </select>
          </div>
          <button
            onClick={refresh}
            disabled={loading}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            <span>{t('admin.common.refresh')}</span>
          </button>
          <button className="flex items-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors">
            <Download className="h-4 w-4" />
            <span>{t('admin.common.export')}</span>
          </button>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertTriangle className="h-5 w-5 text-red-500 mr-2" />
            <span className="text-red-700">{t('admin.common.error')}: {error}</span>
          </div>
        </div>
      )}

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {analyticsMetrics.map((metric, index) => {
          const Icon = metric.icon;
          return (
            <div key={index} className={`bg-white p-6 rounded-lg border ${metric.borderColor} shadow-sm hover:shadow-md transition-shadow`}>
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600 mb-1">{metric.title}</p>
                  <p className="text-2xl font-bold text-gray-900">{metric.value}</p>
                  {metric.subtitle && (
                    <p className="text-xs text-gray-500 mt-1">{metric.subtitle}</p>
                  )}
                </div>
                <div className={`p-3 rounded-lg ${metric.bgColor}`}>
                  <Icon className={`h-6 w-6 ${metric.color}`} />
                </div>
              </div>
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
                <span className="text-sm text-gray-500 ml-2">{t('admin.analytics.vsPreviousPeriod')}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Message Flow Chart */}
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">{t('admin.analytics.messageFlow')}</h3>
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <span>{t('admin.analytics.messages')}</span>
            </div>
          </div>
          <div className="h-64 flex items-center justify-center text-gray-400">
            <div className="text-center">
              <BarChart3 className="h-12 w-12 mx-auto mb-2" />
              <p>{t('admin.common.chartPlaceholder')}</p>
            </div>
          </div>
        </div>

        {/* Platform Distribution */}
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">{t('admin.analytics.platformDistribution')}</h3>
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span>{t('admin.analytics.platforms')}</span>
            </div>
          </div>
          <div className="space-y-4">
            {platformDistribution.length > 0 ? platformDistribution.map((platform, index) => {
              const totalMessages = platformDistribution.reduce((sum, p) => sum + (p.messageCount || 0), 0);
              const percentage = totalMessages > 0 ? ((platform.messageCount || 0) / totalMessages * 100).toFixed(1) : 0;
              
              return (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-4 h-4 rounded-full ${platform.color || 'bg-gray-400'}`}></div>
                    <span className="font-medium text-gray-900">{platform.name || platform.platform}</span>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div 
                        className="h-2 rounded-full bg-blue-500"
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                    <span className="text-sm text-gray-600 w-12 text-right">
                      {percentage}%
                    </span>
                    <span className="text-sm font-medium text-gray-900 w-16 text-right">{(platform.messageCount || 0).toLocaleString()}</span>
                  </div>
                </div>
              );
            }) : (
              <div className="text-center text-gray-400 py-8">
                <p>{t('admin.common.noData')}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Top Channels Table */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">{t('admin.analytics.topChannels')}</h3>
          <p className="text-sm text-gray-600">{t('admin.analytics.subtitle')}</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('admin.analytics.channel')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('admin.analytics.platform')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('admin.analytics.messages')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('admin.analytics.viewers')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('admin.analytics.activity')}</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {topChannels.map((channel, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-8 w-8">
                        <div className="h-8 w-8 rounded-full bg-gray-300 flex items-center justify-center">
                          <span className="text-sm font-medium text-gray-700">
                            {channel.name.charAt(0)}
                          </span>
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{channel.name}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      channel.platform === 'Twitch' ? 'bg-purple-100 text-purple-800' :
                      channel.platform === 'YouTube' ? 'bg-red-100 text-red-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {channel.platform}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {channel.messages.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {channel.viewers.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Activity className="h-4 w-4 text-green-500 mr-1" />
                      <span className="text-sm text-green-600 font-medium">{t('admin.analytics.activityHigh')}</span>
                    </div>
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

export default AnalyticsContent;

