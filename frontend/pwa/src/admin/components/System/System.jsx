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
    blockedUsers,
    broadcastMessage,
    sendMessageToUser
  } = useAdminStore();

  const [connections, setConnections] = useState([]);
  const [connectedUsers, setConnectedUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [blockReason, setBlockReason] = useState('');
  const [blockingUserId, setBlockingUserId] = useState(null);
  const [adminMessage, setAdminMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [messageMode, setMessageMode] = useState('broadcast'); // 'broadcast' или 'personal'
  const [selectedUserId, setSelectedUserId] = useState('');

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

  const handleBroadcastMessage = async () => {
    if (!adminMessage.trim()) {
      alert('Введите сообщение');
      return;
    }

    if (messageMode === 'broadcast') {
      if (!confirm(`Отправить сообщение всем подключенным пользователям?`)) return;
    } else {
      if (!selectedUserId) {
        alert('Выберите пользователя');
        return;
      }
      if (!confirm(`Отправить сообщение пользователю ${selectedUserId}?`)) return;
    }

    setSendingMessage(true);
    try {
      let result;
      if (messageMode === 'broadcast') {
        result = await broadcastMessage(adminMessage.trim());
      } else {
        result = await sendMessageToUser(selectedUserId, adminMessage.trim());
      }

      if (result.success) {
        const recipientText = messageMode === 'broadcast' 
          ? `${result.sentCount} пользователям`
          : `пользователю ${selectedUserId}`;
        alert(`Сообщение отправлено ${recipientText}`);
        setAdminMessage('');
        if (messageMode === 'personal') {
          setSelectedUserId('');
        }
      } else {
        alert(`Ошибка: ${result.error}`);
      }
    } catch (error) {
      alert(`Ошибка: ${error.message}`);
    } finally {
      setSendingMessage(false);
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

      {/* Отправка сообщения всем пользователям */}
      <section className="admin-system__section">
        <h2>📢 Отправка сообщений</h2>
        
        {/* Выбор режима отправки */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer' }}>
            <input
              type="radio"
              name="messageMode"
              value="broadcast"
              checked={messageMode === 'broadcast'}
              onChange={(e) => setMessageMode(e.target.value)}
            />
            <span>Всем пользователям</span>
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer' }}>
            <input
              type="radio"
              name="messageMode"
              value="personal"
              checked={messageMode === 'personal'}
              onChange={(e) => setMessageMode(e.target.value)}
            />
            <span>Конкретному пользователю</span>
          </label>
        </div>

        {/* Выбор пользователя для персональной отправки */}
        {messageMode === 'personal' && (
          <div style={{ marginBottom: '15px' }}>
            <select
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              style={{
                width: '100%',
                padding: '10px',
                fontSize: '14px',
                border: '1px solid var(--glass-border)',
                borderRadius: '8px',
                background: 'var(--bg-tertiary)',
                color: 'var(--text-primary)'
              }}
            >
              <option value="">Выберите пользователя...</option>
              {connectedUsers.map((user) => (
                <option key={user.userId} value={user.userId}>
                  {user.userId} ({user.connectionIds?.length || 0} подключений)
                </option>
              ))}
            </select>
          </div>
        )}

        <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', marginBottom: '20px' }}>
          <textarea
            value={adminMessage}
            onChange={(e) => setAdminMessage(e.target.value)}
            placeholder={
              messageMode === 'broadcast'
                ? "Введите сообщение для отправки всем пользователям..."
                : "Введите сообщение для отправки выбранному пользователю..."
            }
            style={{
              flex: 1,
              padding: '10px',
              fontSize: '14px',
              border: '1px solid var(--glass-border)',
              borderRadius: '8px',
              background: 'var(--bg-tertiary)',
              color: 'var(--text-primary)',
              minHeight: '80px',
              resize: 'vertical'
            }}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && e.ctrlKey) {
                handleBroadcastMessage();
              }
            }}
          />
          <button
            onClick={handleBroadcastMessage}
            disabled={sendingMessage || !adminMessage.trim() || (messageMode === 'personal' && !selectedUserId)}
            style={{
              padding: '10px 20px',
              fontSize: '14px',
              background: sendingMessage ? 'var(--bg-tertiary)' : 'var(--accent-primary)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: sendingMessage || !adminMessage.trim() || (messageMode === 'personal' && !selectedUserId) ? 'not-allowed' : 'pointer',
              opacity: sendingMessage || !adminMessage.trim() || (messageMode === 'personal' && !selectedUserId) ? 0.5 : 1
            }}
          >
            {sendingMessage ? '📤 Отправка...' : messageMode === 'broadcast' ? '📢 Отправить всем' : '📨 Отправить'}
          </button>
        </div>
        <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0 }}>
          {messageMode === 'broadcast'
            ? 'Сообщение появится в чате всех подключенных пользователей с зеленым фоном от имени "admin"'
            : 'Сообщение появится в чате выбранного пользователя с зеленым фоном от имени "admin"'}
        </p>
      </section>

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
