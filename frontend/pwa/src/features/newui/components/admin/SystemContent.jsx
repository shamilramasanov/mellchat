import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Server, 
  Database, 
  Cpu, 
  HardDrive, 
  Wifi, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  Activity,
  Zap,
  RefreshCw,
  Settings,
  Monitor,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { useSystemStatus } from '../../hooks/useAdminData';

const SystemContent = () => {
  const { t } = useTranslation();
  const { status, loading, error, lastUpdated, refresh, restartService } = useSystemStatus();

  // Используем реальные данные из API или fallback
  const systemMetrics = status?.metrics ? [
    {
      title: t('admin.system.cpuUsage'),
      value: `${status.metrics.cpuUsage || 0}%`,
      status: status.metrics.cpuUsage > 80 ? 'error' : status.metrics.cpuUsage > 60 ? 'warning' : 'good',
      icon: Cpu,
      color: status.metrics.cpuUsage > 80 ? 'text-red-500' : status.metrics.cpuUsage > 60 ? 'text-yellow-500' : 'text-green-500',
      bgColor: status.metrics.cpuUsage > 80 ? 'bg-red-50' : status.metrics.cpuUsage > 60 ? 'bg-yellow-50' : 'bg-green-50',
      borderColor: status.metrics.cpuUsage > 80 ? 'border-red-200' : status.metrics.cpuUsage > 60 ? 'border-yellow-200' : 'border-green-200'
    },
    {
      title: t('admin.system.memoryUsage'),
      value: `${status.metrics.memoryUsage || 0}%`,
      status: status.metrics.memoryUsage > 80 ? 'error' : status.metrics.memoryUsage > 60 ? 'warning' : 'good',
      icon: HardDrive,
      color: status.metrics.memoryUsage > 80 ? 'text-red-500' : status.metrics.memoryUsage > 60 ? 'text-yellow-500' : 'text-green-500',
      bgColor: status.metrics.memoryUsage > 80 ? 'bg-red-50' : status.metrics.memoryUsage > 60 ? 'bg-yellow-50' : 'bg-green-50',
      borderColor: status.metrics.memoryUsage > 80 ? 'border-red-200' : status.metrics.memoryUsage > 60 ? 'border-yellow-200' : 'border-green-200'
    },
    {
      title: t('admin.system.diskUsage'),
      value: `${status.metrics.diskUsage || 0}%`,
      status: status.metrics.diskUsage > 80 ? 'error' : status.metrics.diskUsage > 60 ? 'warning' : 'good',
      icon: Database,
      color: status.metrics.diskUsage > 80 ? 'text-red-500' : status.metrics.diskUsage > 60 ? 'text-yellow-500' : 'text-blue-500',
      bgColor: status.metrics.diskUsage > 80 ? 'bg-red-50' : status.metrics.diskUsage > 60 ? 'bg-yellow-50' : 'bg-blue-50',
      borderColor: status.metrics.diskUsage > 80 ? 'border-red-200' : status.metrics.diskUsage > 60 ? 'border-yellow-200' : 'border-blue-200'
    },
    {
      title: t('admin.system.networkIO'),
      value: status.metrics.networkIO || '0 MB/s',
      status: 'good',
      icon: Wifi,
      color: 'text-purple-500',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200'
    }
  ] : [
    {
      title: t('admin.system.cpuUsage'),
      value: 'N/A',
      status: 'warning',
      icon: Cpu,
      color: 'text-gray-500',
      bgColor: 'bg-gray-50',
      borderColor: 'border-gray-200'
    },
    {
      title: t('admin.system.memoryUsage'),
      value: 'N/A',
      status: 'warning',
      icon: HardDrive,
      color: 'text-gray-500',
      bgColor: 'bg-gray-50',
      borderColor: 'border-gray-200'
    },
    {
      title: t('admin.system.diskUsage'),
      value: 'N/A',
      status: 'warning',
      icon: Database,
      color: 'text-gray-500',
      bgColor: 'bg-gray-50',
      borderColor: 'border-gray-200'
    },
    {
      title: t('admin.system.networkIO'),
      value: 'N/A',
      status: 'warning',
      icon: Wifi,
      color: 'text-gray-500',
      bgColor: 'bg-gray-50',
      borderColor: 'border-gray-200'
    }
  ];

  const services = status?.services || [];
  const recentLogs = status?.recentLogs || [];

  const getStatusColor = (status) => {
    switch (status) {
      case 'running': return 'text-green-600 bg-green-100';
      case 'warning': return 'text-yellow-600 bg-yellow-100';
      case 'error': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getLogLevelColor = (level) => {
    switch (level) {
      case 'info': return 'text-blue-600 bg-blue-100';
      case 'warning': return 'text-yellow-600 bg-yellow-100';
      case 'error': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const handleRefresh = () => {
    refresh();
  };

  if (loading && !status) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Загрузка данных системы...</p>
        </div>
      </div>
    );
  }

  if (error && !status) {
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
          <h2 className="text-2xl font-bold text-gray-900">{t('admin.system.title')}</h2>
          <p className="text-gray-600">{t('admin.system.subtitle')}</p>
          {lastUpdated && (
            <p className="text-sm text-gray-500 mt-1">
              {t('admin.common.lastUpdated')}: {lastUpdated.toLocaleTimeString()}
            </p>
          )}
        </div>
        <div className="flex items-center space-x-4">
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            <span>{t('admin.common.refresh')}</span>
          </button>
        </div>
      </div>

      {/* System Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {systemMetrics.map((metric, index) => {
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
              <div className="mt-4">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${
                      metric.status === 'good' ? 'bg-green-500' :
                      metric.status === 'warning' ? 'bg-yellow-500' :
                      'bg-red-500'
                    }`}
                    style={{ 
                      width: metric.value.includes('%') 
                        ? metric.value.replace('%', '%')
                        : metric.status === 'good' ? '75%' : metric.status === 'warning' ? '60%' : '90%'
                    }}
                  ></div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Services Status */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">{t('admin.system.services')}</h3>
          <p className="text-sm text-gray-600">{t('admin.system.subtitle')}</p>
        </div>
        <div className="divide-y divide-gray-200">
          {services.length > 0 ? services.map((service, index) => {
            // Определяем иконку с fallback
            const getServiceIcon = (serviceName) => {
              const name = (serviceName || '').toLowerCase();
              if (name.includes('api') || name.includes('gateway')) return Server;
              if (name.includes('websocket') || name.includes('ws')) return Wifi;
              if (name.includes('database') || name.includes('db')) return Database;
              if (name.includes('redis') || name.includes('cache')) return Zap;
              if (name.includes('queue') || name.includes('message')) return Activity;
              return Server; // Default
            };
            const Icon = service.icon || getServiceIcon(service.name || service.serviceName);
            return (
              <div key={index} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="p-2 bg-gray-100 rounded-lg">
                      {Icon && <Icon className="h-5 w-5 text-gray-600" />}
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">{service.name || service.serviceName}</h4>
                      <p className="text-sm text-gray-500">Port {service.port || service.portNumber || 'N/A'}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-6">
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">{service.uptime || service.uptimePercentage || 'N/A'}</p>
                      <p className="text-xs text-gray-500">{t('admin.system.uptime')}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">{service.lastRestart || 'N/A'}</p>
                      <p className="text-xs text-gray-500">{t('admin.system.lastRestart')}</p>
                    </div>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(service.status || service.statusName)}`}>
                      {service.status === 'running' ? t('admin.system.status.running') : 
                       service.status === 'stopped' ? t('admin.system.status.stopped') :
                       service.status === 'error' ? t('admin.system.status.error') :
                       service.status || service.statusName || t('admin.system.status.running')}
                    </span>
                  </div>
                </div>
              </div>
            );
          }) : (
            <div className="p-6 text-center text-gray-500">
              {t('admin.system.noServicesData')}
            </div>
          )}
        </div>
      </div>

      {/* Recent Logs */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">{t('admin.system.logs')}</h3>
          <p className="text-sm text-gray-600">{t('admin.system.subtitle')}</p>
        </div>
        <div className="divide-y divide-gray-200">
          {recentLogs.length > 0 ? recentLogs.map((log, index) => {
            // Определяем иконку с fallback
            const getLogIcon = (level) => {
              if (level === 'error' || level === 'critical') return AlertTriangle;
              if (level === 'warning') return AlertTriangle;
              return CheckCircle;
            };
            const Icon = log.icon || getLogIcon(log.level);
            return (
              <div key={index} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    {Icon && (
                      <Icon className={`h-5 w-5 ${
                        log.level === 'error' ? 'text-red-500' :
                        log.level === 'warning' ? 'text-yellow-500' :
                        'text-green-500'
                      }`} />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getLogLevelColor(log.level)}`}>
                        {log.level.toUpperCase()}
                      </span>
                      <span className="text-sm font-medium text-gray-900">{log.service || log.serviceName || 'Unknown'}</span>
                      <span className="text-sm text-gray-500">{log.timestamp || log.createdAt || 'N/A'}</span>
                    </div>
                    <p className="text-sm text-gray-700">{log.message || log.content || 'N/A'}</p>
                  </div>
                </div>
              </div>
            );
          }) : (
            <div className="p-6 text-center text-gray-500">
              {t('admin.system.noLogsData')}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SystemContent;
