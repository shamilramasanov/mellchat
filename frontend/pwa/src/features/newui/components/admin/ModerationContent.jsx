import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Shield, 
  AlertTriangle, 
  Ban, 
  CheckCircle, 
  Clock,
  User,
  MessageSquare,
  Filter,
  Search,
  MoreVertical,
  Eye,
  X,
  RefreshCw,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { useModerationReports } from '../../hooks/useAdminData';

const ModerationContent = () => {
  const { t } = useTranslation();
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const { reports: reportsData, loading, error, lastUpdated, refresh, resolveReport, banUser } = useModerationReports(selectedFilter, searchQuery);

  const filters = reportsData?.stats ? [
    { value: 'all', label: t('admin.moderation.allReports'), count: reportsData.stats.pending + reportsData.stats.resolved + reportsData.stats.dismissed + reportsData.stats.banned },
    { value: 'pending', label: t('admin.moderation.pending'), count: reportsData.stats.pending },
    { value: 'resolved', label: t('admin.moderation.resolved'), count: reportsData.stats.resolved },
    { value: 'dismissed', label: t('admin.moderation.dismissed'), count: reportsData.stats.dismissed }
  ] : [
    { value: 'all', label: t('admin.moderation.allReports'), count: 0 },
    { value: 'pending', label: t('admin.moderation.pending'), count: 0 },
    { value: 'resolved', label: t('admin.moderation.resolved'), count: 0 },
    { value: 'dismissed', label: t('admin.moderation.dismissed'), count: 0 }
  ];

  const reports = reportsData?.reports || [];

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'high': return 'text-red-600 bg-red-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      case 'resolved': return 'text-green-600 bg-green-100';
      case 'dismissed': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'spam': return <MessageSquare className="h-4 w-4" />;
      case 'harassment': return <AlertTriangle className="h-4 w-4" />;
      case 'inappropriate_content': return <Ban className="h-4 w-4" />;
      default: return <Shield className="h-4 w-4" />;
    }
  };

  const filteredReports = reports.filter(report => {
    const matchesFilter = selectedFilter === 'all' || report.status === selectedFilter;
    const matchesSearch = searchQuery === '' || 
      (report.user && report.user.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (report.message && report.message.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (report.channel && report.channel.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesFilter && matchesSearch;
  });

  if (loading && !reportsData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Загрузка отчетов модерации...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{t('admin.moderation.title')}</h2>
          <p className="text-gray-600">{t('admin.moderation.subtitle')}</p>
        </div>
        <div className="flex items-center space-x-4">
          {lastUpdated && (
            <span className="text-sm text-gray-500">
              {t('admin.common.lastUpdated')}: {lastUpdated.toLocaleTimeString()}
            </span>
          )}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder={t('admin.moderation.searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-400"
            />
          </div>
          <button
            onClick={refresh}
            disabled={loading}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            <span>{t('admin.common.refresh')}</span>
          </button>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertTriangle className="h-5 w-5 text-red-500 mr-2" />
            <span className="text-red-700">Failed to load reports: {error}</span>
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
        {filters.map((filter) => (
          <button
            key={filter.value}
            onClick={() => setSelectedFilter(filter.value)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              selectedFilter === filter.value
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <span>{filter.label}</span>
            <span className={`px-2 py-1 text-xs rounded-full ${
              selectedFilter === filter.value
                ? 'bg-blue-100 text-blue-600'
                : 'bg-gray-200 text-gray-600'
            }`}>
              {filter.count}
            </span>
          </button>
        ))}
      </div>

      {/* Reports List */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">{t('admin.moderation.reports')} ({filteredReports.length})</h3>
        </div>
        <div className="divide-y divide-gray-200">
          {filteredReports.length > 0 ? filteredReports.map((report) => (
            <div key={report.id} className="p-6 hover:bg-gray-50 transition-colors">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <div className="flex items-center space-x-2">
                      {getTypeIcon(report.type)}
                      <span className="text-sm font-medium text-gray-900 capitalize">
                        {report.type.replace('_', ' ')}
                      </span>
                    </div>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getSeverityColor(report.severity)}`}>
                      {report.severity}
                    </span>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(report.status)}`}>
                      {report.status === 'pending' ? t('admin.moderation.pending') :
                       report.status === 'resolved' ? t('admin.moderation.resolved') :
                       report.status === 'dismissed' ? t('admin.moderation.dismissed') :
                       report.status}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                    <div>
                      <p className="text-sm text-gray-600">{t('admin.moderation.user')}</p>
                      <p className="font-medium text-gray-900">{report.user}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">{t('admin.moderation.channel')}</p>
                      <p className="font-medium text-gray-900">{report.channel} ({report.platform})</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">{t('admin.moderation.reportedBy')}</p>
                      <p className="font-medium text-gray-900">{report.reportedBy}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">{t('admin.moderation.time')}</p>
                      <p className="font-medium text-gray-900">{report.timestamp}</p>
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <p className="text-sm text-gray-600 mb-1">{t('admin.moderation.message')}</p>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-sm text-gray-900 italic">"{report.message}"</p>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2 ml-4">
                  <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                    <Eye className="h-4 w-4" />
                  </button>
                  <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                    <MoreVertical className="h-4 w-4" />
                  </button>
                </div>
              </div>
              
              <div className="flex items-center space-x-3 pt-4 border-t border-gray-100">
                <button 
                  onClick={() => resolveReport(report.id, 'resolved')}
                  className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <CheckCircle className="h-4 w-4" />
                  <span>{t('admin.moderation.resolve')}</span>
                </button>
                <button 
                  onClick={() => banUser(report.user, 'Violation of community guidelines')}
                  className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  <Ban className="h-4 w-4" />
                  <span>{t('admin.moderation.banUser')}</span>
                </button>
                <button 
                  onClick={() => resolveReport(report.id, 'dismissed')}
                  className="flex items-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  <X className="h-4 w-4" />
                  <span>{t('admin.moderation.dismiss')}</span>
                </button>
              </div>
            </div>
          )) : (
            <div className="p-6 text-center text-gray-500">
              {reportsData ? t('admin.moderation.reports') : t('admin.common.error')}
            </div>
          )}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <div className="flex items-center">
            <div className="p-3 bg-yellow-100 rounded-lg">
              <Clock className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Pending Reports</p>
              <p className="text-2xl font-bold text-gray-900">{reportsData?.stats?.pending || 0}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-lg">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Resolved Today</p>
              <p className="text-2xl font-bold text-gray-900">{reportsData?.stats?.resolved || 0}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <div className="flex items-center">
            <div className="p-3 bg-red-100 rounded-lg">
              <Ban className="h-6 w-6 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Users Banned</p>
              <p className="text-2xl font-bold text-gray-900">{reportsData?.stats?.banned || 0}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModerationContent;
