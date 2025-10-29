import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import useAdminStore from '../../store/adminStore';
import { API_URL } from '@shared/utils/constants';
import './Moderation.css';

const Moderation = () => {
  const {
    token
  } = useAdminStore();

  const [stats, setStats] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [timeRange, setTimeRange] = useState('24h');
  const [selectedTab, setSelectedTab] = useState('stats');
  const [analyzeMessage, setAnalyzeMessage] = useState('');
  const [analysisResult, setAnalysisResult] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);

  useEffect(() => {
    loadStats();
    loadHistory();
  }, [timeRange]);

  const loadStats = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/v1/admin/moderation/stats?timeRange=${timeRange}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Failed to load moderation stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadHistory = async () => {
    try {
      const response = await fetch(`${API_URL}/api/v1/admin/moderation/history?limit=50`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setHistory(data.history || []);
      }
    } catch (error) {
      console.error('Failed to load moderation history:', error);
    }
  };

  const handleAnalyze = async () => {
    if (!analyzeMessage.trim()) return;

    setAnalyzing(true);
    try {
      const response = await fetch(`${API_URL}/api/v1/admin/moderation/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          message: {
            text: analyzeMessage,
            username: 'test_user'
          }
        })
      });

      if (response.ok) {
        const data = await response.json();
        setAnalysisResult(data);
      }
    } catch (error) {
      console.error('Failed to analyze message:', error);
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="admin-page">
      <div className="admin-page__header">
        <h1>🛡️ Moderation</h1>
        <div className="moderation-controls">
          <select 
            value={timeRange} 
            onChange={(e) => setTimeRange(e.target.value)}
            className="moderation-time-select"
          >
            <option value="1h">Last Hour</option>
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
          </select>
          <button onClick={loadStats} disabled={loading}>
            {loading ? '⏳ Loading...' : '🔄 Refresh'}
          </button>
        </div>
      </div>

      <div className="moderation-tabs">
        <button 
          className={selectedTab === 'stats' ? 'active' : ''}
          onClick={() => setSelectedTab('stats')}
        >
          📊 Statistics
        </button>
        <button 
          className={selectedTab === 'analyze' ? 'active' : ''}
          onClick={() => setSelectedTab('analyze')}
        >
          🔍 Analyze Message
        </button>
        <button 
          className={selectedTab === 'history' ? 'active' : ''}
          onClick={() => setSelectedTab('history')}
        >
          📜 History
        </button>
      </div>

      <div className="moderation-content">
        {selectedTab === 'stats' && stats && (
          <div className="moderation-section">
            <h2>Moderation Statistics</h2>
            <div className="stats-grid">
              <div className="stat-card">
                <h3>Total Messages</h3>
                <div className="stat-value">{stats.totalMessages?.toLocaleString() || 0}</div>
              </div>
              <div className="stat-card">
                <h3>Blocked Messages</h3>
                <div className="stat-value stat-value--danger">
                  {stats.blockedMessages?.toLocaleString() || 0}
                </div>
                <div className="stat-percentage">
                  {stats.blockRate || 0}% of total
                </div>
              </div>
              <div className="stat-card">
                <h3>Blocked Users</h3>
                <div className="stat-value">{stats.blockedUsers?.toLocaleString() || 0}</div>
              </div>
            </div>
          </div>
        )}

        {selectedTab === 'analyze' && (
          <div className="moderation-section">
            <h2>Message Analysis</h2>
            <div className="analyze-input">
              <textarea
                value={analyzeMessage}
                onChange={(e) => setAnalyzeMessage(e.target.value)}
                placeholder="Enter message to analyze for spam and toxicity..."
                rows={4}
              />
              <button 
                onClick={handleAnalyze} 
                disabled={analyzing || !analyzeMessage.trim()}
                className="analyze-btn"
              >
                {analyzing ? '⏳ Analyzing...' : '🔍 Analyze'}
              </button>
            </div>

            {analysisResult && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="analysis-result"
              >
                <h3>Analysis Result</h3>
                <div className="analysis-spam">
                  <strong>Spam:</strong> {analysisResult.spam?.isSpam ? '❌ Yes' : '✅ No'}
                  <br />
                  <small>Confidence: {(analysisResult.spam?.confidence * 100).toFixed(1)}%</small>
                  <br />
                  <small>Reason: {analysisResult.spam?.reason}</small>
                </div>
                <div className="analysis-toxicity">
                  <strong>Toxicity:</strong> {analysisResult.toxicity?.isToxic ? '❌ Yes' : '✅ No'}
                  <br />
                  <small>Confidence: {(analysisResult.toxicity?.confidence * 100).toFixed(1)}%</small>
                  <br />
                  <small>Category: {analysisResult.toxicity?.category || 'neutral'}</small>
                </div>
                <div className="analysis-action">
                  <strong>Recommended Action:</strong> 
                  <span className={`action-badge action-badge--${analysisResult.action}`}>
                    {analysisResult.action === 'block' ? '🚫 Block' : '✅ Allow'}
                  </span>
                </div>
              </motion.div>
            )}
          </div>
        )}

        {selectedTab === 'history' && (
          <div className="moderation-section">
            <h2>Moderation History</h2>
            {history.length > 0 ? (
              <div className="history-table">
                <table>
                  <thead>
                    <tr>
                      <th>Username</th>
                      <th>Message</th>
                      <th>Platform</th>
                      <th>Reason</th>
                      <th>Timestamp</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.map((item, idx) => (
                      <tr key={idx}>
                        <td>{item.username}</td>
                        <td className="history-message">{item.text?.substring(0, 100)}</td>
                        <td>{item.platform}</td>
                        <td>{item.reason || 'N/A'}</td>
                        <td>{new Date(item.timestamp).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p>No moderation history available</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Moderation;
