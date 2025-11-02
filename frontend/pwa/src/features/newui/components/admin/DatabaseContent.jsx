import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Database, 
  HardDrive, 
  Activity, 
  Users, 
  MessageSquare,
  Clock,
  Zap,
  RefreshCw,
  Settings,
  Trash2,
  Download,
  Upload,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { useDatabaseInfo } from '../../hooks/useAdminData';

const DatabaseContent = () => {
  const { t } = useTranslation();
  const { dbInfo, loading, error, lastUpdated, refresh } = useDatabaseInfo();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refresh();
    setIsRefreshing(false);
  };

  // Используем реальные данные из API или fallback
  const dbMetrics = dbInfo?.metrics ? [
    {
      title: t('admin.database.totalSize'),
      value: dbInfo.metrics.totalSize || 'N/A',
      status: 'good',
      icon: HardDrive,
      color: 'text-blue-500',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200'
    },
    {
      title: t('admin.database.activeConnections'),
      value: (dbInfo.metrics.activeConnections || 0).toString(),
      status: 'good',
      icon: Users,
      color: 'text-green-500',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200'
    },
    {
      title: t('admin.database.queryTime'),
      value: dbInfo.metrics.avgQueryTime || 'N/A',
      status: 'good',
      icon: Clock,
      color: 'text-purple-500',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200'
    },
    {
      title: t('admin.database.cacheHitRate'),
      value: dbInfo.metrics.cacheHitRate || 'N/A',
      status: 'excellent',
      icon: Zap,
      color: 'text-orange-500',
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-200'
    }
  ] : [
    {
      title: t('admin.database.totalSize'),
      value: 'N/A',
      status: 'warning',
      icon: HardDrive,
      color: 'text-gray-500',
      bgColor: 'bg-gray-50',
      borderColor: 'border-gray-200'
    },
    {
      title: t('admin.database.activeConnections'),
      value: 'N/A',
      status: 'warning',
      icon: Users,
      color: 'text-gray-500',
      bgColor: 'bg-gray-50',
      borderColor: 'border-gray-200'
    },
    {
      title: t('admin.database.queryTime'),
      value: 'N/A',
      status: 'warning',
      icon: Clock,
      color: 'text-gray-500',
      bgColor: 'bg-gray-50',
      borderColor: 'border-gray-200'
    },
    {
      title: t('admin.database.cacheHitRate'),
      value: 'N/A',
      status: 'warning',
      icon: Zap,
      color: 'text-gray-500',
      bgColor: 'bg-gray-50',
      borderColor: 'border-gray-200'
    }
  ];

  const tables = dbInfo?.tables || [];
  const recentQueries = dbInfo?.recentQueries || [];

  if (loading && !dbInfo) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Загрузка данных о базе данных...</p>
        </div>
      </div>
    );
  }

  if (error && !dbInfo) {
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
          <h2 className="text-2xl font-bold text-gray-900">{t('admin.database.title')}</h2>
          <p className="text-gray-600">{t('admin.database.subtitle')}</p>
        </div>
        <div className="flex items-center space-x-4">
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

      {/* Database Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {dbMetrics.map((metric, index) => {
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
            </div>
          );
        })}
      </div>

      {/* Tables Overview */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">{t('admin.database.tables')}</h3>
          <p className="text-sm text-gray-600">{t('admin.database.subtitle')}</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('admin.database.name')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('admin.database.rows')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('admin.database.size')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('admin.database.lastUpdated')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('admin.database.status')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('common.settings')}</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {tables.length > 0 ? tables.map((table, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Database className="h-5 w-5 text-gray-400 mr-3" />
                      <span className="text-sm font-medium text-gray-900">{table.name || table.tableName}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {table.rows ? table.rows.toLocaleString() : (table.rowCount || 'N/A')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {table.size || table.totalSize || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {table.lastUpdated || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                      {table.status || 'active'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <button className="text-blue-600 hover:text-blue-900">{t('common.settings')}</button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
                    {t('admin.database.noTablesData')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Queries */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">{t('admin.database.recentQueries')}</h3>
          <p className="text-sm text-gray-600">{t('admin.database.subtitle')}</p>
        </div>
        <div className="divide-y divide-gray-200">
          {recentQueries.length > 0 ? recentQueries.map((query, index) => (
            <div key={index} className="p-6 hover:bg-gray-50 transition-colors">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <code className="text-sm text-gray-900 bg-gray-100 px-2 py-1 rounded font-mono">
                    {query.query || query.text || 'N/A'}
                  </code>
                  <div className="flex items-center space-x-4 mt-2">
                    <span className="text-sm text-gray-500">{t('admin.database.duration')}: {query.duration || query.executionTime || 'N/A'}</span>
                    <span className="text-sm text-gray-500">{t('admin.database.rows')}: {query.rows || query.rowCount || 'N/A'}</span>
                    <span className="text-sm text-gray-500">{t('admin.database.timestamp')}: {query.timestamp || 'N/A'}</span>
                  </div>
                </div>
                <div className="ml-4 flex items-center space-x-2">
                  <button className="text-gray-400 hover:text-gray-600">
                    <Download className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          )) : (
            <div className="p-6 text-center text-gray-500">
              {t('admin.database.noQueriesData')}
            </div>
          )}
        </div>
      </div>

      {/* Database Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('admin.database.maintenance')}</h3>
          <div className="space-y-3">
            <button className="w-full flex items-center space-x-3 px-4 py-3 text-left text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
              <RefreshCw className="h-5 w-5" />
              <span>{t('admin.database.optimizeAllTables')}</span>
            </button>
            <button className="w-full flex items-center space-x-3 px-4 py-3 text-left text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
              <Database className="h-5 w-5" />
              <span>{t('admin.database.vacuumDatabase')}</span>
            </button>
            <button className="w-full flex items-center space-x-3 px-4 py-3 text-left text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
              <Trash2 className="h-5 w-5" />
              <span>{t('admin.database.cleanOldData')}</span>
            </button>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('admin.database.backupExport')}</h3>
          <div className="space-y-3">
            <button className="w-full flex items-center space-x-3 px-4 py-3 text-left text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
              <Download className="h-5 w-5" />
              <span>{t('admin.database.exportDatabase')}</span>
            </button>
            <button className="w-full flex items-center space-x-3 px-4 py-3 text-left text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
              <Upload className="h-5 w-5" />
              <span>{t('admin.database.importData')}</span>
            </button>
            <button className="w-full flex items-center space-x-3 px-4 py-3 text-left text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
              <Settings className="h-5 w-5" />
              <span>{t('admin.database.backupSettings')}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DatabaseContent;
