import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import useAdminStore from '../../store/adminStore';
import ChartContainer from '../Dashboard/ChartContainer';
import './Analytics.css';

const Analytics = () => {
  const { t } = useTranslation();
  const {
    analytics,
    loading,
    fetchAnalytics,
    generateAnalyticsReport
  } = useAdminStore();

  const [timeRange, setTimeRange] = useState('24h');
  const [selectedTab, setSelectedTab] = useState('platforms');
  const [report, setReport] = useState(null);
  const [generatingReport, setGeneratingReport] = useState(false);

  useEffect(() => {
    loadAnalytics();
  }, [timeRange]);

  const loadAnalytics = async () => {
    await fetchAnalytics('full', timeRange);
  };

  const handleGenerateReport = async () => {
    setGeneratingReport(true);
    const result = await generateAnalyticsReport(timeRange);
    if (result.success) {
      setReport(result);
    }
    setGeneratingReport(false);
  };

  const platformData = analytics.platform || {};
  const timeData = analytics.time || {};
  const streamsData = analytics.streams || {};
  const usersData = analytics.users || {};
  const contentQualityData = analytics.contentQuality || {};
  const userActivityData = analytics.userActivity || {};

  return (
    <div className="admin-page">
      <div className="admin-page__header">
        <h1>📈 Analytics</h1>
        <div className="analytics-controls">
          <select 
            value={timeRange} 
            onChange={(e) => setTimeRange(e.target.value)}
            className="analytics-time-select"
          >
            <option value="1h">Last Hour</option>
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
          </select>
          <button 
            onClick={loadAnalytics}
            disabled={loading.analytics}
            className="analytics-refresh-btn"
          >
            {loading.analytics ? '⏳ Loading...' : '🔄 Refresh'}
          </button>
          <button
            onClick={handleGenerateReport}
            disabled={generatingReport}
            className="analytics-report-btn"
          >
            {generatingReport ? '⏳ Generating...' : '📊 Generate AI Report'}
          </button>
        </div>
      </div>

      {report && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="analytics-report"
        >
          <h2>🤖 AI Generated Report</h2>
          <div className="analytics-report__content">
            {typeof report.report === 'string' ? (
              <pre>{report.report}</pre>
            ) : (
              <div>{JSON.stringify(report.report, null, 2)}</div>
            )}
          </div>
        </motion.div>
      )}

      <div className="analytics-tabs">
        <button 
          className={selectedTab === 'platforms' ? 'active' : ''}
          onClick={() => setSelectedTab('platforms')}
        >
          📱 Platforms
        </button>
        <button 
          className={selectedTab === 'time' ? 'active' : ''}
          onClick={() => setSelectedTab('time')}
        >
          ⏰ Time Patterns
        </button>
        <button 
          className={selectedTab === 'streams' ? 'active' : ''}
          onClick={() => setSelectedTab('streams')}
        >
          🎮 Top Streams
        </button>
        <button 
          className={selectedTab === 'users' ? 'active' : ''}
          onClick={() => setSelectedTab('users')}
        >
          👥 Top Users
        </button>
        <button 
          className={selectedTab === 'quality' ? 'active' : ''}
          onClick={() => setSelectedTab('quality')}
        >
          ✨ Content Quality
        </button>
        <button 
          className={selectedTab === 'activity' ? 'active' : ''}
          onClick={() => setSelectedTab('activity')}
        >
          📊 User Activity
        </button>
      </div>

      <div className="analytics-content">
        {selectedTab === 'platforms' && (
          <div className="analytics-section">
            <h2>Platform Distribution</h2>
            {platformData.platforms && platformData.platforms.length > 0 ? (
              <>
                <ChartContainer
                  title="Messages by Platform"
                  type="doughnut"
                  data={{
                    labels: platformData.platforms.map(p => p.name),
                    datasets: [{
                      data: platformData.platforms.map(p => p.messageCount),
                      backgroundColor: [
                        'rgba(239, 68, 68, 0.7)',
                        'rgba(59, 130, 246, 0.7)',
                        'rgba(16, 185, 129, 0.7)'
                      ]
                    }]
                  }}
                />
                <div className="analytics-table">
                  <table>
                    <thead>
                      <tr>
                        <th>Platform</th>
                        <th>Messages</th>
                        <th>Unique Users</th>
                        <th>Questions</th>
                        <th>Avg Length</th>
                      </tr>
                    </thead>
                    <tbody>
                      {platformData.platforms.map((platform, idx) => (
                        <tr key={idx}>
                          <td>{platform.name}</td>
                          <td>{platform.messageCount.toLocaleString()}</td>
                          <td>{platform.uniqueUsers.toLocaleString()}</td>
                          <td>{platform.questionsCount.toLocaleString()}</td>
                          <td>{platform.avgMessageLength.toFixed(1)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            ) : (
              <p>No platform data available</p>
            )}
          </div>
        )}

        {selectedTab === 'time' && (
          <div className="analytics-section">
            <h2>Time Patterns</h2>
            {timeData.hourly && timeData.hourly.length > 0 ? (
              <ChartContainer
                title="Messages by Hour"
                type="line"
                data={{
                  labels: timeData.hourly.slice(0, 24).map(h => 
                    new Date(h.hour).toLocaleTimeString('ru', { hour: '2-digit', minute: '2-digit' })
                  ),
                  datasets: [{
                    label: 'Messages',
                    data: timeData.hourly.slice(0, 24).map(h => h.messageCount),
                    borderColor: 'rgba(59, 130, 246, 1)',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)'
                  }]
                }}
              />
            ) : (
              <p>No time data available</p>
            )}
          </div>
        )}

        {selectedTab === 'streams' && (
          <div className="analytics-section">
            <h2>Top Streams</h2>
            {streamsData.streams && streamsData.streams.length > 0 ? (
              <div className="analytics-table">
                <table>
                  <thead>
                    <tr>
                      <th>Stream ID</th>
                      <th>Platform</th>
                      <th>Messages</th>
                      <th>Users</th>
                      <th>Questions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {streamsData.streams.map((stream, idx) => (
                      <tr key={idx}>
                        <td>{stream.streamId}</td>
                        <td>{stream.platform}</td>
                        <td>{stream.messageCount.toLocaleString()}</td>
                        <td>{stream.uniqueUsers.toLocaleString()}</td>
                        <td>{stream.questionsCount.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p>No stream data available</p>
            )}
          </div>
        )}

        {selectedTab === 'users' && (
          <div className="analytics-section">
            <h2>Top Users</h2>
            {usersData.users && usersData.users.length > 0 ? (
              <div className="analytics-table">
                <table>
                  <thead>
                    <tr>
                      <th>Username</th>
                      <th>Messages</th>
                      <th>Streams</th>
                      <th>Platforms</th>
                      <th>Questions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {usersData.users.map((user, idx) => (
                      <tr key={idx}>
                        <td>{user.username}</td>
                        <td>{user.messageCount.toLocaleString()}</td>
                        <td>{user.streamsCount}</td>
                        <td>{user.platformsCount}</td>
                        <td>{user.questionsCount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p>No user data available</p>
            )}
          </div>
        )}

        {selectedTab === 'quality' && (
          <div className="analytics-section">
            <h2>Content Quality</h2>
            {contentQualityData.spam && (
              <div className="quality-stats">
                <div className="quality-card">
                  <h3>Spam Detection</h3>
                  <div className="stat-value">
                    {contentQualityData.spam.totalBlocked.toLocaleString()} blocked
                  </div>
                  <div className="stat-percentage">
                    {contentQualityData.spam.percentage}% of total
                  </div>
                </div>
                <div className="quality-card">
                  <h3>Questions</h3>
                  <div className="stat-value">
                    {contentQualityData.questions?.totalQuestions.toLocaleString() || 0}
                  </div>
                  <div className="stat-percentage">
                    {contentQualityData.questions?.percentage || 0}% of messages
                  </div>
                </div>
                {contentQualityData.sentiment && Object.keys(contentQualityData.sentiment).length > 0 && (
                  <ChartContainer
                    title="Sentiment Distribution"
                    type="doughnut"
                    data={{
                      labels: Object.keys(contentQualityData.sentiment),
                      datasets: [{
                        data: Object.values(contentQualityData.sentiment),
                        backgroundColor: [
                          'rgba(16, 185, 129, 0.7)',
                          'rgba(156, 163, 175, 0.7)',
                          'rgba(239, 68, 68, 0.7)'
                        ]
                      }]
                    }}
                  />
                )}
              </div>
            )}
          </div>
        )}

        {selectedTab === 'activity' && (
          <div className="analytics-section">
            <h2>User Activity</h2>
            {userActivityData.totalSessions !== undefined && (
              <div className="activity-stats">
                <div className="activity-card">
                  <h3>Total Sessions</h3>
                  <div className="stat-value">{userActivityData.totalSessions.toLocaleString()}</div>
                </div>
                <div className="activity-card">
                  <h3>Avg Session Duration</h3>
                  <div className="stat-value">{userActivityData.avgSessionDuration}s</div>
                </div>
                <div className="activity-card">
                  <h3>Avg Messages per Session</h3>
                  <div className="stat-value">{userActivityData.avgMessagesPerSession.toFixed(1)}</div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Analytics;
