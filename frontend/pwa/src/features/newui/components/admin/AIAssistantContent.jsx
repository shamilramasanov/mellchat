import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Bot, 
  Send, 
  MessageSquare, 
  Lightbulb,
  TrendingUp,
  RefreshCw,
  Zap,
  Brain,
  AlertCircle,
  CheckCircle,
  Loader2,
  Trash2
} from 'lucide-react';
import { useAIAssistant } from '../../hooks/useAdminData';
import { formatDistanceToNow } from 'date-fns';
import { ru } from 'date-fns/locale';

const AIAssistantContent = () => {
  const { t } = useTranslation();
  const [message, setMessage] = useState('');
  const { 
    aiData, 
    chatHistory, 
    loading, 
    error, 
    lastUpdated, 
    sendMessage, 
    refresh,
    clearHistory
  } = useAIAssistant();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSending, setIsSending] = useState(false);

  // Формируем метрики из данных API
  const aiMetrics = aiData?.metrics ? [
    {
      title: t('admin.aiAssistant.status'),
      value: aiData.metrics.status || 'N/A',
      status: aiData.metrics.status === 'Online' ? 'good' : 'error',
      icon: Bot,
      color: aiData.metrics.status === 'Online' ? 'text-green-500' : 'text-red-500',
      bgColor: aiData.metrics.status === 'Online' ? 'bg-green-50' : 'bg-red-50',
      borderColor: aiData.metrics.status === 'Online' ? 'border-green-200' : 'border-red-200'
    },
    {
      title: t('admin.aiAssistant.responseTime'),
      value: aiData.metrics.responseTime || 'N/A',
      status: 'good',
      icon: Zap,
      color: 'text-blue-500',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200'
    },
    {
      title: t('admin.aiAssistant.queriesToday'),
      value: (aiData.metrics.queriesToday || 0).toString(),
      status: 'good',
      icon: MessageSquare,
      color: 'text-purple-500',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200'
    },
    {
      title: t('admin.aiAssistant.accuracyRate'),
      value: aiData.metrics.accuracyRate || 'N/A',
      status: 'excellent',
      icon: Brain,
      color: 'text-orange-500',
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-200'
    }
  ] : [
    {
      title: t('admin.aiAssistant.status'),
      value: 'N/A',
      status: 'warning',
      icon: Bot,
      color: 'text-gray-500',
      bgColor: 'bg-gray-50',
      borderColor: 'border-gray-200'
    },
    {
      title: t('admin.aiAssistant.responseTime'),
      value: 'N/A',
      status: 'warning',
      icon: Zap,
      color: 'text-gray-500',
      bgColor: 'bg-gray-50',
      borderColor: 'border-gray-200'
    },
    {
      title: t('admin.aiAssistant.queriesToday'),
      value: 'N/A',
      status: 'warning',
      icon: MessageSquare,
      color: 'text-gray-500',
      bgColor: 'bg-gray-50',
      borderColor: 'border-gray-200'
    },
    {
      title: t('admin.aiAssistant.accuracyRate'),
      value: 'N/A',
      status: 'warning',
      icon: Brain,
      color: 'text-gray-500',
      bgColor: 'bg-gray-50',
      borderColor: 'border-gray-200'
    }
  ];

  const suggestions = aiData?.suggestions || [];

  const handleSendMessage = async () => {
    if (!message.trim() || isSending) return;
    
    setIsSending(true);
    try {
      await sendMessage(message.trim());
      setMessage('');
    } catch (err) {
      console.error('Failed to send message:', err);
    } finally {
      setIsSending(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refresh();
    setIsRefreshing(false);
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return '';
    try {
      const date = new Date(timestamp);
      return formatDistanceToNow(date, { addSuffix: true, locale: ru });
    } catch {
      return timestamp;
    }
  };

  if (loading && !aiData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">{t('admin.common.loading')}</p>
        </div>
      </div>
    );
  }

  if (error && !aiData) {
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
          <h2 className="text-2xl font-bold text-gray-900">{t('admin.aiAssistant.title')}</h2>
          <p className="text-gray-600">{t('admin.aiAssistant.subtitle')}</p>
          {lastUpdated && (
            <p className="text-sm text-gray-500 mt-1">
              {t('admin.common.lastUpdated')}: {lastUpdated.toLocaleTimeString()}
            </p>
          )}
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

      {/* AI Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {aiMetrics.map((metric, index) => {
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chat Interface */}
        <div className="lg:col-span-2 bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{t('admin.aiAssistant.chatHistory')}</h3>
              <p className="text-sm text-gray-600">{t('admin.aiAssistant.subtitle')}</p>
            </div>
            {chatHistory && chatHistory.length > 0 && (
              <button
                onClick={clearHistory}
                className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title="Очистить историю"
              >
                <Trash2 className="h-4 w-4" />
                <span>Очистить</span>
              </button>
            )}
          </div>
          
          {/* Chat Messages */}
          <div className="h-96 overflow-y-auto p-6 space-y-4">
            {chatHistory && chatHistory.length > 0 ? chatHistory.map((msg, index) => (
              <div key={msg.id || `msg-${index}-${Date.now()}`} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                  msg.type === 'user' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-100 text-gray-900'
                }`}>
                  <p className="text-sm whitespace-pre-line">{msg.message || msg.text}</p>
                  <p className={`text-xs mt-1 ${
                    msg.type === 'user' ? 'text-blue-100' : 'text-gray-500'
                  }`}>
                    {formatTimestamp(msg.timestamp)}
                  </p>
                </div>
              </div>
            )) : (
              <div className="text-center text-gray-500 py-8">
                <MessageSquare className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                <p>{t('admin.aiAssistant.chatHistory')}</p>
                <p className="text-sm mt-1">{t('admin.common.noData')}</p>
              </div>
            )}
            {isSending && (
              <div className="flex justify-start">
                <div className="bg-gray-100 text-gray-900 max-w-xs lg:max-w-md px-4 py-2 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
                    <span className="text-sm">{t('admin.aiAssistant.sendMessage')}...</span>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {/* Message Input */}
          <div className="px-6 py-4 border-t border-gray-200">
            <div className="flex items-center space-x-3">
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && !isSending && handleSendMessage()}
                placeholder={t('admin.aiAssistant.sendMessage')}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-400"
                disabled={isSending}
              />
              <button
                onClick={handleSendMessage}
                disabled={!message.trim() || isSending}
                className="flex items-center justify-center w-10 h-10 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Suggestions Sidebar */}
        <div className="space-y-6">
          {/* AI Suggestions */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">{t('admin.aiAssistant.suggestions')}</h3>
              <p className="text-sm text-gray-600">{t('admin.aiAssistant.subtitle')}</p>
            </div>
            <div className="p-6 space-y-4">
              {suggestions && suggestions.length > 0 ? suggestions.map((suggestion, index) => {
                const getIcon = () => {
                  const priority = suggestion.priority?.toLowerCase() || 'low';
                  if (priority === 'high' || priority === 'warning') return AlertCircle;
                  if (priority === 'medium') return TrendingUp;
                  if (priority === 'info') return CheckCircle;
                  return Lightbulb;
                };
                const Icon = suggestion.icon || getIcon();
                const priority = suggestion.priority?.toLowerCase() || 'low';
                return (
                  <div key={suggestion.id || index} className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer">
                    <div className="flex items-start space-x-3">
                      <Icon className={`h-5 w-5 mt-0.5 ${
                        priority === 'high' || priority === 'warning' ? 'text-red-500' :
                        priority === 'medium' ? 'text-yellow-500' :
                        priority === 'info' ? 'text-blue-500' :
                        'text-green-500'
                      }`} />
                      <div className="flex-1">
                        <h4 className="text-sm font-medium text-gray-900">{suggestion.title}</h4>
                        <p className="text-sm text-gray-600 mt-1">{suggestion.description}</p>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full mt-2 ${
                          priority === 'high' || priority === 'warning' ? 'bg-red-100 text-red-800' :
                          priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                          priority === 'info' ? 'bg-blue-100 text-blue-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {t(`admin.aiAssistant.${priority}`) || priority} {t('admin.aiAssistant.priority')}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              }) : (
                <div className="text-center text-gray-500 py-4">
                  <p className="text-sm">{t('admin.common.noData')}</p>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default AIAssistantContent;
