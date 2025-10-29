import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import useAdminStore from '../../store/adminStore';
import './Database.css';

const Database = () => {
  const { token } = useAdminStore();

  const [overview, setOverview] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [selectedTab, setSelectedTab] = useState('overview');

  useEffect(() => {
    loadOverview();
  }, []);

  const loadOverview = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${(import.meta.env.VITE_API_URL || window.location.origin) || ''}/api/v1/admin/database/overview`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setOverview(data);
      }
    } catch (error) {
      console.error('Failed to load database overview:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAnalyze = async () => {
    setAnalyzing(true);
    try {
      const response = await fetch(`${(import.meta.env.VITE_API_URL || window.location.origin) || ''}/api/v1/admin/database/analyze`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setAnalysis(data);
      }
    } catch (error) {
      console.error('Failed to analyze database:', error);
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="admin-page">
      <div className="admin-page__header">
        <h1>🗄️ Database Management</h1>
        <div className="database-controls">
          <button onClick={loadOverview} disabled={loading}>
            {loading ? '⏳ Loading...' : '🔄 Refresh'}
          </button>
          <button 
            onClick={handleAnalyze} 
            disabled={analyzing}
            className="analyze-btn"
          >
            {analyzing ? '⏳ Analyzing...' : '🤖 AI Analyze'}
          </button>
        </div>
      </div>

      <div className="database-tabs">
        <button 
          className={selectedTab === 'overview' ? 'active' : ''}
          onClick={() => setSelectedTab('overview')}
        >
          📊 Overview
        </button>
        <button 
          className={selectedTab === 'tables' ? 'active' : ''}
          onClick={() => setSelectedTab('tables')}
        >
          📋 Tables
        </button>
        <button 
          className={selectedTab === 'indexes' ? 'active' : ''}
          onClick={() => setSelectedTab('indexes')}
        >
          🔍 Indexes
        </button>
        <button 
          className={selectedTab === 'queries' ? 'active' : ''}
          onClick={() => setSelectedTab('queries')}
        >
          ⚡ Slow Queries
        </button>
      </div>

      <div className="database-content">
        {selectedTab === 'overview' && overview && (
          <div className="database-section">
            <h2>Database Overview</h2>
            
            <div className="connection-stats">
              <h3>Connection Pool</h3>
              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-label">Total</div>
                  <div className="stat-value">{overview.connectionPool?.total || 0}</div>
                </div>
                <div className="stat-card">
                  <div className="stat-label">Active</div>
                  <div className="stat-value">{overview.connectionPool?.active || 0}</div>
                </div>
                <div className="stat-card">
                  <div className="stat-label">Idle</div>
                  <div className="stat-value">{overview.connectionPool?.idle || 0}</div>
                </div>
              </div>
            </div>

            {analysis && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="ai-analysis"
              >
                <h3>🤖 AI Recommendations</h3>
                {analysis.recommendations && analysis.recommendations.length > 0 ? (
                  <div className="recommendations">
                    {analysis.recommendations.map((rec, idx) => (
                      <div key={idx} className="recommendation-card">
                        <div className="recommendation-header">
                          <strong>{rec.title}</strong>
                          <span className={`priority-badge priority-${rec.priority}`}>
                            {rec.priority}
                          </span>
                        </div>
                        <p>{rec.description}</p>
                        {rec.action && <div className="recommendation-action">{rec.action}</div>}
                      </div>
                    ))}
                  </div>
                ) : (
                  <pre>{analysis.summary || 'No recommendations'}</pre>
                )}
              </motion.div>
            )}
          </div>
        )}

        {selectedTab === 'tables' && overview?.tables && (
          <div className="database-section">
            <h2>Table Sizes</h2>
            <div className="database-table">
              <table>
                <thead>
                  <tr>
                    <th>Table</th>
                    <th>Total Size</th>
                    <th>Table Size</th>
                    <th>Indexes Size</th>
                  </tr>
                </thead>
                <tbody>
                  {overview.tables.map((table, idx) => (
                    <tr key={idx}>
                      <td>{table.name}</td>
                      <td>{table.totalSize}</td>
                      <td>{table.tableSize}</td>
                      <td>{table.indexesSize}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {selectedTab === 'indexes' && overview?.indexes && (
          <div className="database-section">
            <h2>Index Usage</h2>
            <div className="database-table">
              <table>
                <thead>
                  <tr>
                    <th>Table</th>
                    <th>Index</th>
                    <th>Scans</th>
                    <th>Tuples Read</th>
                    <th>Tuples Fetched</th>
                  </tr>
                </thead>
                <tbody>
                  {overview.indexes.slice(0, 20).map((idx, i) => (
                    <tr key={i}>
                      <td>{idx.table}</td>
                      <td>{idx.index}</td>
                      <td>{idx.scans.toLocaleString()}</td>
                      <td>{idx.tuplesRead.toLocaleString()}</td>
                      <td>{idx.tuplesFetched.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {selectedTab === 'queries' && overview?.slowQueries && (
          <div className="database-section">
            <h2>Slow Queries</h2>
            {overview.slowQueries.length > 0 ? (
              <div className="queries-list">
                {overview.slowQueries.map((query, idx) => (
                  <div key={idx} className="query-card">
                    <div className="query-header">
                      <span>Calls: {query.calls}</span>
                      <span>Avg: {query.meanTime.toFixed(2)}ms</span>
                      <span>Max: {query.maxTime.toFixed(2)}ms</span>
                    </div>
                    <pre className="query-text">{query.query}</pre>
                  </div>
                ))}
              </div>
            ) : (
              <p>No slow queries data available (pg_stat_statements may not be enabled)</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Database;
