import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useChatStore } from '../store/chatStore';
import { useStreamsStore } from '@features/streams/store/streamsStore';
import './DatabaseStatus.css';

const DatabaseStatus = () => {
  const { t } = useTranslation();
  const { databaseConnected, loading, error, testDatabaseConnection, loadMessagesFromDatabase } = useChatStore();
  const { activeStreamId } = useStreamsStore();
  const [testResult, setTestResult] = useState(null);

  useEffect(() => {
    // Test database connection on component mount
    testConnection();
  }, []);

  const testConnection = async () => {
    const result = await testDatabaseConnection();
    setTestResult(result);
  };

  const loadMessages = async () => {
    if (!activeStreamId) return;
    
    const result = await loadMessagesFromDatabase(activeStreamId, 50);
    console.log('Load messages result:', result);
  };

  return (
    <div className="database-status">
      <div className="database-status__header">
        <h3>🗄️ Database Status</h3>
        <button 
          className="database-status__test-btn"
          onClick={testConnection}
          disabled={loading}
        >
          {loading ? 'Testing...' : 'Test Connection'}
        </button>
      </div>

      <div className="database-status__info">
        <div className="database-status__item">
          <span className="database-status__label">Status:</span>
          <span className={`database-status__value ${databaseConnected ? 'connected' : 'disconnected'}`}>
            {databaseConnected ? '✅ Connected' : '❌ Disconnected'}
          </span>
        </div>

        {testResult && (
          <div className="database-status__item">
            <span className="database-status__label">Last Test:</span>
            <span className={`database-status__value ${testResult.success ? 'success' : 'error'}`}>
              {testResult.success ? '✅ Success' : '❌ Failed'}
            </span>
          </div>
        )}

        {error && (
          <div className="database-status__item">
            <span className="database-status__label">Error:</span>
            <span className="database-status__value error">{error}</span>
          </div>
        )}

        {testResult?.database?.time && (
          <div className="database-status__item">
            <span className="database-status__label">DB Time:</span>
            <span className="database-status__value">
              {new Date(testResult.database.time).toLocaleString()}
            </span>
          </div>
        )}
      </div>

      {activeStreamId && (
        <div className="database-status__actions">
          <button 
            className="database-status__load-btn"
            onClick={loadMessages}
            disabled={loading || !databaseConnected}
          >
            {loading ? 'Loading...' : 'Load Messages from DB'}
          </button>
        </div>
      )}
    </div>
  );
};

export default DatabaseStatus;
