import React, { useEffect, useState } from 'react';
import useAdminStore from '../../store/adminStore';
import { API_URL } from '@shared/utils/constants';
import './Security.css';

const Security = () => {
  const { token } = useAdminStore();

  const [auditLog, setAuditLog] = useState([]);
  const [auditStats, setAuditStats] = useState(null);
  const [roles, setRoles] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedTab, setSelectedTab] = useState('audit-log');
  const [timeRange, setTimeRange] = useState('24h');

  useEffect(() => {
    if (selectedTab === 'audit-log') {
      loadAuditLog();
    } else if (selectedTab === 'stats') {
      loadAuditStats();
    } else if (selectedTab === 'roles') {
      loadRoles();
    }
  }, [selectedTab, timeRange]);

  const loadAuditLog = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL || ''}/api/v1/admin/security/audit-log?limit=100`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setAuditLog(data.logs || []);
      }
    } catch (error) {
      console.error('Failed to load audit log:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAuditStats = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL || ''}/api/v1/admin/security/audit-stats?timeRange=${timeRange}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setAuditStats(data);
      }
    } catch (error) {
      console.error('Failed to load audit stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadRoles = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL || ''}/api/v1/admin/security/roles`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setRoles(data);
      }
    } catch (error) {
      console.error('Failed to load roles:', error);
      if (error.response?.status === 403) {
        setRoles({ error: 'Insufficient permissions' });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-page">
      <div className="admin-page__header">
        <h1>🔒 Security & Access</h1>
        <div className="security-controls">
          {(selectedTab === 'stats') && (
            <select 
              value={timeRange} 
              onChange={(e) => setTimeRange(e.target.value)}
              className="security-time-select"
            >
              <option value="1h">Last Hour</option>
              <option value="24h">Last 24 Hours</option>
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
            </select>
          )}
          <button onClick={() => {
            if (selectedTab === 'audit-log') loadAuditLog();
            else if (selectedTab === 'stats') loadAuditStats();
            else if (selectedTab === 'roles') loadRoles();
          }} disabled={loading}>
            {loading ? '⏳ Loading...' : '🔄 Refresh'}
          </button>
        </div>
      </div>

      <div className="security-tabs">
        <button 
          className={selectedTab === 'audit-log' ? 'active' : ''}
          onClick={() => setSelectedTab('audit-log')}
        >
          📜 Audit Log
        </button>
        <button 
          className={selectedTab === 'stats' ? 'active' : ''}
          onClick={() => setSelectedTab('stats')}
        >
          📊 Statistics
        </button>
        <button 
          className={selectedTab === 'roles' ? 'active' : ''}
          onClick={() => setSelectedTab('roles')}
        >
          👥 Roles & Permissions
        </button>
      </div>

      <div className="security-content">
        {selectedTab === 'audit-log' && (
          <div className="security-section">
            <h2>Audit Log</h2>
            {auditLog.length > 0 ? (
              <div className="audit-table">
                <table>
                  <thead>
                    <tr>
                      <th>Admin ID</th>
                      <th>Action</th>
                      <th>Target</th>
                      <th>IP Address</th>
                      <th>Timestamp</th>
                    </tr>
                  </thead>
                  <tbody>
                    {auditLog.map((log, idx) => (
                      <tr key={idx}>
                        <td>{log.adminUserId}</td>
                        <td>
                          <span className="action-badge">{log.action}</span>
                        </td>
                        <td>
                          {log.targetType && log.targetId 
                            ? `${log.targetType}: ${log.targetId}`
                            : 'N/A'
                          }
                        </td>
                        <td>{log.ipAddress || 'N/A'}</td>
                        <td>{new Date(log.createdAt).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p>No audit logs available</p>
            )}
          </div>
        )}

        {selectedTab === 'stats' && auditStats && (
          <div className="security-section">
            <h2>Audit Statistics</h2>
            {auditStats.stats && auditStats.stats.length > 0 ? (
              <div className="audit-stats-grid">
                {auditStats.stats.map((stat, idx) => (
                  <div key={idx} className="stat-card">
                    <div className="stat-action">{stat.action}</div>
                    <div className="stat-count">{stat.count.toLocaleString()}</div>
                    <div className="stat-users">{stat.uniqueAdmins} admin(s)</div>
                  </div>
                ))}
              </div>
            ) : (
              <p>No statistics available</p>
            )}
          </div>
        )}

        {selectedTab === 'roles' && (
          <div className="security-section">
            <h2>Roles & Permissions</h2>
            {roles?.error ? (
              <div className="error-message">
                {roles.error}
              </div>
            ) : roles?.roles ? (
              <>
                <div className="current-user">
                  <h3>Current User</h3>
                  <p>ID: {roles.currentUser?.id}</p>
                  <p>Role: <span className="role-badge">{roles.currentUser?.role}</span></p>
                </div>
                <div className="roles-list">
                  <h3>Available Roles</h3>
                  {roles.roles.map((role, idx) => (
                    <div key={idx} className="role-card">
                      <div className="role-header">
                        <strong>{role.name}</strong>
                        <span className="role-id">{role.id}</span>
                      </div>
                      <div className="role-permissions">
                        <strong>Permissions:</strong>
                        <ul>
                          {role.permissions.map((perm, i) => (
                            <li key={i}>{perm}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <p>Loading roles...</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Security;
