import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import useAdminStore from '../../store/adminStore';
import './System.css';

const System = () => {
  const { t } = useTranslation();
  const {
    fetchConnections,
    disconnectConnection,
    fetchConnectedUsers,
    fetchBlockedUsers,
    blockUser,
    unblockUser,
    blockedUsers
  } = useAdminStore();

  const [connections, setConnections] = useState([]);
  const [connectedUsers, setConnectedUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [blockReason, setBlockReason] = useState('');
  const [blockingUserId, setBlockingUserId] = useState(null);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 10000); // Обновляем каждые 10 секунд
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [connResult, usersResult] = await Promise.all([
        fetchConnections(),
        fetchConnectedUsers()
      ]);

      if (connResult.success) {
        setConnections(connResult.connections || []);
      }
      if (usersResult.success) {
        setConnectedUsers(usersResult.users || []);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async (connectionId) => {
    if (!confirm(`Отключить подключение ${connectionId}?`)) return;

    const result = await disconnectConnection(connectionId);
    if (result.success) {
      await loadData();
      alert('Подключение отключено');
    } else {
      alert(`Ошибка: ${result.error}`);
    }
  };

  const handleBlockUser = async (userId) => {
    if (!blockReason.trim()) {
      alert('Введите причину блокировки');
      return;
    }

    const result = await blockUser(userId, blockReason);
    if (result.success) {
      await loadData();
      await fetchBlockedUsers();
      setBlockReason('');
      setBlockingUserId(null);
      alert('Пользователь заблокирован');
    } else {
      alert(`Ошибка: ${result.error}`);
    }
  };

  const handleUnblockUser = async (userId) => {
    if (!confirm(`Разблокировать пользователя ${userId}?`)) return;

    const result = await unblockUser(userId);
    if (result.success) {
      await loadData();
      await fetchBlockedUsers();
      alert('Пользователь разблокирован');
    } else {
      alert(`Ошибка: ${result.error}`);
    }
  };

  return (
    <div className="admin-system">
      <div className="admin-system__header">
        <h1>⚙️ Управление системой</h1>
        <button onClick={loadData} disabled={loading}>
          {loading ? '🔄 Обновление...' : '🔄 Обновить'}
        </button>
      </div>

      {/* Активные подключения */}
      <section className="admin-system__section">
        <h2>🔌 Активные подключения ({connections.length})</h2>
        <div className="admin-system__table-container">
          <table className="admin-system__table">
            <thead>
              <tr>
                <th>Connection ID</th>
                <th>Платформа</th>
                <th>Канал</th>
                <th>Подписчики</th>
                <th>Сообщений</th>
                <th>Подключен</th>
                <th>Действия</th>
              </tr>
            </thead>
            <tbody>
              {connections.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '20px' }}>
                    Нет активных подключений
                  </td>
                </tr>
              ) : (
                connections.map((conn) => (
                  <tr key={conn.connectionId}>
                    <td>
                      <code style={{ fontSize: '12px' }}>{conn.connectionId}</code>
                    </td>
                    <td>
                      <span className={`platform-badge platform-badge--${conn.platform}`}>
                        {conn.platform}
                      </span>
                    </td>
                    <td>{conn.channel}</td>
                    <td>{conn.subscribers || 0}</td>
                    <td>{conn.messageCount || 0}</td>
                    <td>
                      {conn.connectedAt
                        ? new Date(conn.connectedAt).toLocaleString('ru-RU')
                        : '-'}
                    </td>
                    <td>
                      <button
                        onClick={() => handleDisconnect(conn.connectionId)}
                        className="btn-danger"
                        title="Отключить"
                      >
                        🔌 Отключить
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Подключенные пользователи */}
      <section className="admin-system__section">
        <h2>👥 Подключенные пользователи ({connectedUsers.length})</h2>
        <div className="admin-system__table-container">
          <table className="admin-system__table">
            <thead>
              <tr>
                <th>User ID</th>
                <th>IP</th>
                <th>User Agent</th>
                <th>Подключений</th>
                <th>Статус</th>
                <th>Действия</th>
              </tr>
            </thead>
            <tbody>
              {connectedUsers.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '20px' }}>
                    Нет подключенных пользователей
                  </td>
                </tr>
              ) : (
                connectedUsers.map((user) => (
                  <tr key={user.userId}>
                    <td>
                      <code>{user.userId}</code>
                    </td>
                    <td>{user.ip}</td>
                    <td style={{ fontSize: '12px', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {user.userAgent}
                    </td>
                    <td>{user.connectionIds?.length || 0}</td>
                    <td>
                      {user.isBlocked ? (
                        <span className="status-badge status-badge--blocked">Заблокирован</span>
                      ) : (
                        <span className="status-badge status-badge--active">Активен</span>
                      )}
                    </td>
                    <td>
                      {user.isBlocked ? (
                        <button
                          onClick={() => handleUnblockUser(user.userId)}
                          className="btn-success"
                        >
                          ✅ Разблокировать
                        </button>
                      ) : (
                        <>
                          {blockingUserId === user.userId ? (
                            <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
                              <input
                                type="text"
                                placeholder="Причина блокировки"
                                value={blockReason}
                                onChange={(e) => setBlockReason(e.target.value)}
                                style={{ padding: '5px', fontSize: '12px' }}
                                onKeyPress={(e) => e.key === 'Enter' && handleBlockUser(user.userId)}
                              />
                              <button
                                onClick={() => handleBlockUser(user.userId)}
                                className="btn-danger"
                                style={{ padding: '5px 10px' }}
                              >
                                🚫 Заблокировать
                              </button>
                              <button
                                onClick={() => {
                                  setBlockingUserId(null);
                                  setBlockReason('');
                                }}
                                style={{ padding: '5px' }}
                              >
                                ✖️
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setBlockingUserId(user.userId)}
                              className="btn-danger"
                            >
                              🚫 Заблокировать
                            </button>
                          )}
                        </>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Заблокированные пользователи */}
      <section className="admin-system__section">
        <h2>🚫 Заблокированные пользователи ({blockedUsers.length})</h2>
        <button onClick={fetchBlockedUsers} style={{ marginBottom: '10px' }}>
          🔄 Обновить список
        </button>
        <div className="admin-system__table-container">
          <table className="admin-system__table">
            <thead>
              <tr>
                <th>User ID</th>
                <th>Заблокирован</th>
                <th>Причина</th>
                <th>Заблокировал</th>
                <th>Действия</th>
              </tr>
            </thead>
            <tbody>
              {blockedUsers.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '20px' }}>
                    Нет заблокированных пользователей
                  </td>
                </tr>
              ) : (
                blockedUsers.map((user) => (
                  <tr key={user.userId}>
                    <td>
                      <code>{user.userId}</code>
                    </td>
                    <td>
                      {new Date(user.blockedAt).toLocaleString('ru-RU')}
                    </td>
                    <td>{user.reason}</td>
                    <td>{user.blockedBy}</td>
                    <td>
                      <button
                        onClick={() => handleUnblockUser(user.userId)}
                        className="btn-success"
                      >
                        ✅ Разблокировать
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

export default System;
