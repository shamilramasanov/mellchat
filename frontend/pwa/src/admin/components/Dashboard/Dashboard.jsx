import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import useAdminStore from '../../store/adminStore';
import MetricCard from './MetricCard';
import ChartContainer from './ChartContainer';
import AIInsights from './AIInsights';
import SystemAlerts from './SystemAlerts';
import './Dashboard.css';

const Dashboard = () => {
  const { t } = useTranslation();
  const {
    metrics,
    charts,
    aiRecommendations,
    aiAlerts,
    loading,
    fetchMetrics,
    fetchCharts,
    fetchAIInsights
  } = useAdminStore();

  const [timeRange, setTimeRange] = useState('24h');
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Fetch initial data
  useEffect(() => {
    const loadDashboardData = async () => {
      await Promise.all([
        fetchMetrics(),
        fetchCharts(timeRange),
        fetchAIInsights()
      ]);
    };

    loadDashboardData();
  }, [timeRange]);

  // WebSocket connection for real-time updates
  useEffect(() => {
    const { connectWebSocket, disconnectWebSocket } = useAdminStore.getState();
    
    // Подключаемся к WebSocket
    connectWebSocket();
    
    // Отключаемся при размонтировании
    return () => {
      disconnectWebSocket();
    };
  }, []);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(async () => {
      await fetchMetrics();
      await fetchCharts(timeRange);
    }, 30000);

    return () => clearInterval(interval);
  }, [autoRefresh, timeRange]);

  const handleTimeRangeChange = (newRange) => {
    setTimeRange(newRange);
  };

  const toggleAutoRefresh = () => {
    setAutoRefresh(!autoRefresh);
  };

  return (
    <div className="admin-dashboard">
      {/* Header */}
      <div className="admin-dashboard__header">
        <div className="admin-dashboard__title">
          <h1>{t('admin.dashboard.title')}</h1>
          <div className="admin-dashboard__controls">
            <select 
              value={timeRange} 
              onChange={(e) => handleTimeRangeChange(e.target.value)}
              className="admin-dashboard__time-select"
            >
              <option value="1h">Last Hour</option>
              <option value="24h">Last 24 Hours</option>
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
            </select>
            <button 
              onClick={toggleAutoRefresh}
              className={`admin-dashboard__refresh-btn ${autoRefresh ? 'active' : ''}`}
            >
              {autoRefresh ? '🔄 Auto' : '⏸️ Paused'}
            </button>
          </div>
        </div>
      </div>

      {/* System Alerts */}
      {aiAlerts.length > 0 && (
        <SystemAlerts alerts={aiAlerts} />
      )}

      {/* Metrics Cards */}
      <div className="admin-dashboard__metrics">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="admin-dashboard__metrics-grid"
        >
          <MetricCard
            title={t('admin.dashboard.metrics.activeConnections')}
            value={metrics.activeConnections}
            icon="🔌"
            color="blue"
            trend={metrics.activeConnections > 0 ? 5 : -2}
            loading={loading.metrics}
          />
          
          <MetricCard
            title={t('admin.dashboard.metrics.messagesPerSecond')}
            value={metrics.messagesPerSecond.toFixed(1)}
            icon="💬"
            color="green"
            trend={metrics.messagesPerSecond > 10 ? 8 : -3}
            loading={loading.metrics}
          />
          
          <MetricCard
            title={t('admin.dashboard.metrics.usersOnline')}
            value={metrics.usersOnline}
            icon="👥"
            color="purple"
            trend={metrics.usersOnline > 50 ? 12 : -5}
            loading={loading.metrics}
          />
          
          <MetricCard
            title={t('admin.dashboard.metrics.dbPerformance')}
            value={`${metrics.dbPerformance.avgResponseTime}ms`}
            icon="🗄️"
            color="orange"
            trend={metrics.dbPerformance.avgResponseTime < 100 ? 15 : -8}
            loading={loading.metrics}
          />
        </motion.div>
      </div>

      {/* Platform Status */}
      <div className="admin-dashboard__platforms">
        <h2>{t('admin.dashboard.metrics.platformStatus')}</h2>
        <div className="admin-dashboard__platform-grid">
          {Object.entries(metrics.platformStatus).map(([platform, status]) => (
            <div key={platform} className={`platform-status platform-status--${status}`}>
              <div className="platform-status__icon">
                {platform === 'twitch' && '📺'}
                {platform === 'youtube' && '📹'}
                {platform === 'kick' && '⚡'}
              </div>
              <div className="platform-status__info">
                <h3>{platform.charAt(0).toUpperCase() + platform.slice(1)}</h3>
                <span className={`status-indicator status-indicator--${status}`}>
                  {status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Charts */}
      <div className="admin-dashboard__charts">
        <h2>Analytics</h2>
        <div className="admin-dashboard__charts-grid">
          <ChartContainer
            title="Message Flow"
            data={charts.messageFlow}
            type="line"
            loading={loading.charts}
          />
          
          <ChartContainer
            title="Platform Distribution"
            data={charts.platformDistribution}
            type="doughnut"
            loading={loading.charts}
          />
          
          <ChartContainer
            title="Sentiment Trends"
            data={charts.sentimentTrends}
            type="line"
            loading={loading.charts}
          />
          
          <ChartContainer
            title="System Load"
            data={charts.systemLoad}
            type="bar"
            loading={loading.charts}
          />
        </div>
      </div>

      {/* AI Insights */}
      <AIInsights 
        recommendations={aiRecommendations}
        loading={loading.ai}
      />
    </div>
  );
};

export default Dashboard;
