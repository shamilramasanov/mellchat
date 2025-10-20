import React, { useState, useEffect, useCallback } from 'react';
import { useWebSocket } from './hooks/useWebSocket';
import './App.css';

function App() {
  const ws = useWebSocket();
  const [connectedStreams, setConnectedStreams] = useState([]);
  const [activeStreamId, setActiveStreamId] = useState(null);
  const [streamUrl, setStreamUrl] = useState('');
  const [activeTab, setActiveTab] = useState('questions');
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [messages, setMessages] = useState([]);
  const [questions, setQuestions] = useState([]);

  // Subscribe to active stream via WS (after state is defined)
  useEffect(() => {
    if (!activeStreamId) return;
    const activeStream = connectedStreams.find(s => s.id === activeStreamId);
    if (!activeStream || !activeStream.connectionId) return;
    ws.subscribe(activeStream.connectionId);
    const off = ws.on('message', (evt) => {
      if (evt.connectionId !== activeStream.connectionId) return;
      if (evt.type !== 'message') return;
      setConnectedStreams(prev => prev.map(s => {
        if (s.id !== activeStreamId) return s;
        const existing = new Set((s.messages||[]).map(m => m.id));
        const list = Array.isArray(evt.payload) ? evt.payload : [evt.payload];
        const add = list.filter(m => !existing.has(m.id));
        return { ...s, messages: [...(s.messages||[]), ...add].slice(-100) };
      }));
    });
    return () => {
      ws.unsubscribe(activeStream.connectionId);
      off && off();
    };
  }, [activeStreamId, connectedStreams, ws]);

  // Load saved streams on app start
  useEffect(() => {
    const savedStreams = localStorage.getItem('mellchat-streams');
    if (savedStreams) {
      try {
        const parsed = JSON.parse(savedStreams) || [];
        // Migrate legacy saved entries: ensure connectionId for YouTube = `youtube-<videoId>`
        const migrated = parsed.map((s) => {
          if (s.platform === 'youtube' && !s.connectionId && s.channel) {
            return { ...s, connectionId: `youtube-${s.channel}` };
          }
          return s;
        });
        setConnectedStreams(migrated);
        if (migrated.length > 0) {
          // Prefer first with connectionId
          const firstWithConn = migrated.find(s => !!s.connectionId) || migrated[0];
          setActiveStreamId(firstWithConn.id);
          // Restart polling for saved streams that have connectionId
          migrated.forEach(stream => {
            if (stream.connectionId) {
              console.log('Restarting polling for saved stream:', stream.id, stream.connectionId);
              if (stream.platform === 'youtube') {
                startMessagePolling(stream.id, stream.connectionId);
              } else if (stream.platform === 'twitch') {
                startTwitchMessagePolling(stream.id, stream.connectionId);
              } else if (stream.platform === 'kick') {
                startKickMessagePolling(stream.id, stream.connectionId);
              }
            }
          });
        }
        console.log('Loaded saved streams:', migrated.length);
      } catch (error) {
        console.error('Error loading saved streams:', error);
      }
    }
  }, []);

  // Save streams to localStorage when they change
  useEffect(() => {
    if (connectedStreams.length > 0) {
      localStorage.setItem('mellchat-streams', JSON.stringify(connectedStreams));
      console.log('Saved streams to localStorage:', connectedStreams.length);
    }
  }, [connectedStreams]);

  // Update messages and questions when active stream changes
  useEffect(() => {
    console.log('useEffect triggered - activeStreamId:', activeStreamId, 'connectedStreams:', connectedStreams.length);
    if (activeStreamId) {
      const activeStream = connectedStreams.find(stream => stream.id === activeStreamId);
      if (activeStream) {
        console.log('Active stream found:', activeStream.title, 'messages:', activeStream.messages?.length || 0);
        setMessages(activeStream.messages || []);
        setQuestions(activeStream.questions || []);
      }
    } else {
      setMessages([]);
      setQuestions([]);
    }
  }, [activeStreamId, connectedStreams]);

  const handleConnect = () => {
    if (!streamUrl) return;

    console.log('Connecting to:', streamUrl);

    // Parse URL to determine platform and channel
    let detectedPlatform = '';
    let channelName = '';
    let streamTitle = '';

    // Normalize input (trim, drop leading @, ensure scheme)
    let normalized = (streamUrl || '').trim();
    if (normalized.startsWith('@')) normalized = normalized.slice(1);
    if (!/^https?:\/\//i.test(normalized)) {
      normalized = `https://${normalized}`;
    }
    let parsed;
    try { parsed = new URL(normalized); } catch { parsed = null; }

    if (parsed && /twitch\.tv$/i.test(parsed.hostname)) {
      detectedPlatform = 'twitch';
      channelName = parsed.pathname.replace(/^\//, '').split('/')[0] || '';
      streamTitle = `Twitch: ${channelName}`;
    } else if (parsed && /kick\.com$/i.test(parsed.hostname)) {
      detectedPlatform = 'kick';
      channelName = parsed.pathname.replace(/^\//, '').split('/')[0] || '';
      streamTitle = `Kick: ${channelName}`;
    } else if (parsed && (/youtube\.com$/i.test(parsed.hostname) || /youtu\.be$/i.test(parsed.hostname))) {
      detectedPlatform = 'youtube';
      // Support multiple YouTube URL formats
      let match = normalized.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&?]+)/);
      if (!match) {
        // Try YouTube Live format: youtube.com/live/VIDEO_ID
        match = normalized.match(/youtube\.com\/live\/([^&?]+)/);
        console.log('Trying YouTube Live format:', match);
      }
      if (!match) {
        // Try YouTube channel format: youtube.com/channel/CHANNEL_ID
        match = normalized.match(/youtube\.com\/channel\/([^&?]+)/);
      }
      if (!match) {
        // Try YouTube user format: youtube.com/user/USERNAME
        match = normalized.match(/youtube\.com\/user\/([^&?]+)/);
      }
      if (!match) {
        // Try YouTube @ format: youtube.com/@([^&?]+)
        match = normalized.match(/youtube\.com\/@([^&?]+)/);
      }
      channelName = match ? match[1] : '';
      console.log('YouTube detected:', channelName);
      streamTitle = `YouTube: ${channelName}`;
    }

    console.log('Final result - Platform:', detectedPlatform, 'Channel:', channelName);

    if (channelName) {
      // Check if stream is already connected
      const existingStream = connectedStreams.find(stream => 
        stream.platform === detectedPlatform && stream.channel === channelName
      );

      if (existingStream) {
        alert('Цей стрим вже підключений!');
        setStreamUrl('');
        return;
      }

      // Create new stream object
      const newStream = {
        id: `${detectedPlatform}-${channelName}-${Date.now()}`,
        platform: detectedPlatform,
        channel: channelName,
        title: streamTitle,
        url: streamUrl,
        messages: [],
        questions: [],
        connectedAt: new Date()
      };

      // Add to connected streams
      setConnectedStreams(prev => [...prev, newStream]);
      
      // Set as active if it's the first stream
      if (connectedStreams.length === 0) {
        setActiveStreamId(newStream.id);
      }

      setShowConnectModal(false);
      setStreamUrl('');

      // Connect to real chat API
      console.log('Connecting to real chat for:', streamTitle);
      
      if (detectedPlatform === 'youtube') {
        // Connect to YouTube Live Chat API
        fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:3001'}/api/v1/youtube`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ videoId: channelName })
        })
        .then(response => response.json())
        .then(data => {
          if (data.success) {
            console.log('YouTube Live Chat connected:', data);
            
            // Update stream with connection info
            setConnectedStreams(prev => prev.map(stream => {
              if (stream.id === newStream.id) {
                return {
                  ...stream,
                  connectionId: data.connectionId,
                  title: data.data.title,
                  channelTitle: data.data.channelTitle,
                  messages: [],
                  questions: []
                };
              }
              return stream;
            }));
            
            // Start polling for messages
            console.log('Starting message polling for:', newStream.id, data.connectionId);
            console.log('About to call startMessagePolling...');
            startMessagePolling(newStream.id, data.connectionId);
            console.log('startMessagePolling called successfully');
          } else {
            console.error('Failed to connect to YouTube Live Chat:', data.message);
            alert(`Помилка підключення: ${data.message}`);
          }
        })
        .catch(error => {
          console.error('YouTube API error:', error);
          alert('Помилка підключення до YouTube Live Chat');
        });
      } else if (detectedPlatform === 'twitch') {
        // Connect to real Twitch API
        console.log('Connecting to real Twitch chat for:', streamTitle);
        
        fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:3001'}/api/v1/twitch`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ channelName: channelName })
        })
        .then(response => response.json())
        .then(data => {
          if (data.success) {
            console.log('Twitch chat connected:', data);
            
            // Update stream with connection info
            setConnectedStreams(prev => prev.map(stream => {
              if (stream.id === newStream.id) {
                return {
                  ...stream,
                  connectionId: data.connectionId,
                  title: data.data.title,
                  channelTitle: data.data.channelName,
                  messages: [],
                  questions: []
                };
              }
              return stream;
            }));
            
            // Start polling for messages
            console.log('Starting Twitch message polling for:', newStream.id, data.connectionId);
            startTwitchMessagePolling(newStream.id, data.connectionId);
          } else {
            console.error('Failed to connect to Twitch chat:', data.message);
            alert(`Помилка підключення до Twitch: ${data.message}`);
          }
        })
        .catch(error => {
          console.error('Twitch API error:', error);
          alert('Помилка підключення до Twitch чату');
        });
      } else if (detectedPlatform === 'kick') {
        // Connect to Kick (best-effort polling)
        console.log('Connecting to Kick chat for:', streamTitle);
        fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:3001'}/api/v1/kick`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ channelName: channelName })
        })
        .then(response => response.json())
        .then(data => {
          if (data.success) {
            console.log('Kick chat connected:', data);
            setConnectedStreams(prev => prev.map(stream => {
              if (stream.id === newStream.id) {
                return {
                  ...stream,
                  connectionId: data.connectionId,
                  title: data.data.title || streamTitle,
                  channelTitle: data.data.channelName || channelName,
                  messages: [],
                  questions: []
                };
              }
              return stream;
            }));
            console.log('Starting Kick message polling for:', newStream.id, data.connectionId);
            startKickMessagePolling(newStream.id, data.connectionId);
          } else {
            console.error('Failed to connect to Kick chat:', data.message);
            alert(`Помилка підключення до Kick: ${data.message}`);
          }
        })
        .catch(error => {
          console.error('Kick API error:', error);
          alert('Помилка підключення до Kick чату');
        });
      } else {
        alert('Непідтримувана платформа. Підтримуються тільки YouTube та Twitch.');
      }
    } else {
      alert('Не вдалося розпізнати платформу або канал. Перевірте посилання.');
    }
  };

  const handleDisconnect = (streamId) => {
    const streamToDisconnect = connectedStreams.find(s => s.id === streamId);
    
    // Call backend disconnect API if connectionId exists
    if (streamToDisconnect && streamToDisconnect.connectionId) {
      let apiUrl = '';
      if (streamToDisconnect.platform === 'twitch') {
        apiUrl = `${process.env.REACT_APP_API_URL || 'http://localhost:3001'}/api/v1/twitch/${streamToDisconnect.connectionId}`;
      } else if (streamToDisconnect.platform === 'youtube') {
        apiUrl = `${process.env.REACT_APP_API_URL || 'http://localhost:3001'}/api/v1/youtube/${streamToDisconnect.connectionId}`;
      } else if (streamToDisconnect.platform === 'kick') {
        apiUrl = `${process.env.REACT_APP_API_URL || 'http://localhost:3001'}/api/v1/kick/${streamToDisconnect.connectionId}`;
      }
      
      fetch(apiUrl, { method: 'DELETE' })
        .then(response => response.json())
        .then(data => {
          console.log('Backend disconnect response:', data);
        })
        .catch(error => {
          console.error('Backend disconnect error:', error);
        });
    }
    
    setConnectedStreams(prev => {
      const streamToDisconnect = prev.find(s => s.id === streamId);
      
      // Clear polling interval if exists
      if (streamToDisconnect && streamToDisconnect.pollInterval) {
        clearInterval(streamToDisconnect.pollInterval);
        console.log('Cleared polling interval for:', streamId);
      }
      
      const updated = prev.filter(stream => stream.id !== streamId);
      
      // If disconnecting active stream, switch to another or clear
      if (streamId === activeStreamId) {
        if (updated.length > 0) {
          setActiveStreamId(updated[0].id);
        } else {
          setActiveStreamId(null);
        }
      }
      
      return updated;
    });
  };

  const switchToStream = (streamId) => {
    setActiveStreamId(streamId);
  };

  // Poll for new messages from Twitch Chat
  const startTwitchMessagePolling = useCallback((streamId, connectionId) => {
    console.log('startTwitchMessagePolling called with:', streamId, connectionId);
    // clear old interval if exists
    const existing = connectedStreams.find(s => s.id === streamId)?.pollInterval;
    if (existing) { try { clearInterval(existing); } catch {} }
    const pollInterval = setInterval(() => {
      console.log('Twitch polling interval triggered');

      console.log('Making Twitch API request to:', `http://localhost:3001/api/v1/twitch/messages/${connectionId}`);
      // Poll for new messages
      fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:3001'}/api/v1/twitch/messages/${connectionId}`)
        .then(response => response.json())
        .then(data => {
          console.log('Twitch polling response:', data);
          if (!data.success && data.message === 'Connection not found') {
            console.log('Twitch connection lost, attempting reconnect');
            const s = connectedStreams.find(s => s.id === streamId);
            if (s) reconnectTwitch(s);
            return;
          }
          if (data.success && data.messages && data.messages.length > 0) {
            console.log(`Received ${data.messages.length} messages from Twitch API`);
            // Add new messages to stream
            setConnectedStreams(prev => prev.map(s => {
              if (s.id === streamId) {
                const existingMessageIds = new Set(s.messages?.map(m => m.id) || []);
                const newMessages = data.messages.filter(msg => !existingMessageIds.has(msg.id));
                console.log(`Adding ${newMessages.length} new Twitch messages to stream`);
                const updatedMessages = [...(s.messages || []), ...newMessages];
                return {
                  ...s,
                  messages: updatedMessages.slice(-100) // Keep last 100 messages
                };
              }
              return s;
            }));
          }
        })
        .catch(error => {
          console.error('Twitch message polling error:', error);
        });
    }, 30000); // Poll every 30 seconds

    // Store interval ID for cleanup
    setConnectedStreams(prev => prev.map(s => {
      if (s.id === streamId) {
        return { ...s, pollInterval };
      }
      return s;
    }));
  }, [connectedStreams]);

  // Poll for new messages from Kick Chat
  const startKickMessagePolling = useCallback((streamId, connectionId) => {
    console.log('startKickMessagePolling called with:', streamId, connectionId);
    const existing = connectedStreams.find(s => s.id === streamId)?.pollInterval;
    if (existing) { try { clearInterval(existing); } catch {} }
    const pollInterval = setInterval(() => {
      console.log('Kick polling interval triggered');
      fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:3001'}/api/v1/kick/messages/${connectionId}`)
        .then(response => response.json())
        .then(data => {
          console.log('Kick polling response:', data);
          if (!data.success && data.message === 'Connection not found') {
            console.log('Kick connection lost, attempting reconnect');
            const s = connectedStreams.find(s => s.id === streamId);
            if (s) reconnectKick(s);
            return;
          }
          if (data.success && data.messages && data.messages.length > 0) {
            setConnectedStreams(prev => prev.map(s => {
              if (s.id === streamId) {
                const existingMessageIds = new Set(s.messages?.map(m => m.id) || []);
                const newMessages = data.messages.filter(msg => !existingMessageIds.has(msg.id));
                const updatedMessages = [...(s.messages || []), ...newMessages];
                return { ...s, messages: updatedMessages.slice(-100) };
              }
              return s;
            }));
          }
        })
        .catch(error => {
          console.error('Kick message polling error:', error);
        });
    }, 30000);

    setConnectedStreams(prev => prev.map(s => {
      if (s.id === streamId) {
        return { ...s, pollInterval };
      }
      return s;
    }));
  }, [connectedStreams]);

  // Reconnect helpers: refresh connectionId on backend restart
  const reconnectTwitch = async (stream) => {
    try {
      const resp = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:3001'}/api/v1/twitch`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channelName: stream.channel })
      });
      const data = await resp.json();
      if (data.success) {
        setConnectedStreams(prev => prev.map(s => s.id === stream.id ? { ...s, connectionId: data.connectionId, title: data.data.title } : s));
        startTwitchMessagePolling(stream.id, data.connectionId);
      }
    } catch (e) { console.error('reconnectTwitch error', e); }
  };

  const reconnectKick = async (stream) => {
    try {
      const resp = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:3001'}/api/v1/kick`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channelName: stream.channel })
      });
      const data = await resp.json();
      if (data.success) {
        setConnectedStreams(prev => prev.map(s => s.id === stream.id ? { ...s, connectionId: data.connectionId, title: data.data.title || s.title } : s));
        startKickMessagePolling(stream.id, data.connectionId);
      }
    } catch (e) { console.error('reconnectKick error', e); }
  };

  // Poll for new messages from YouTube Live Chat
  const startMessagePolling = (streamId, connectionId) => {
    console.log('startMessagePolling called with:', streamId, connectionId);
    const pollInterval = setInterval(() => {
      console.log('Polling interval triggered');
      
      console.log('Making API request to:', `http://localhost:3001/api/v1/youtube/messages/${connectionId}`);
      // Poll for new messages (simplified - in real app would use WebSocket)
      fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:3001'}/api/v1/youtube/messages/${connectionId}`)
        .then(response => response.json())
        .then(data => {
          console.log('Polling response:', data);
          if (data.success && data.messages && data.messages.length > 0) {
            console.log(`Received ${data.messages.length} messages from API`);
            // Add new messages to stream
            setConnectedStreams(prev => prev.map(s => {
              if (s.id === streamId) {
                const existingMessageIds = new Set(s.messages?.map(m => m.id) || []);
                const newMessages = data.messages.filter(msg => !existingMessageIds.has(msg.id));
                console.log(`Adding ${newMessages.length} new messages to stream`);
                const updatedMessages = [...(s.messages || []), ...newMessages];
                return {
                  ...s,
                  messages: updatedMessages.slice(-100) // Keep last 100 messages
                };
              }
              return s;
            }));
          }
        })
        .catch(error => {
          console.error('Message polling error:', error);
        });
    }, 30000); // Poll every 30 seconds

    // Store interval ID for cleanup
    setConnectedStreams(prev => prev.map(s => {
      if (s.id === streamId) {
        return { ...s, pollInterval };
      }
      return s;
    }));
  };

  const currentStream = connectedStreams.find(stream => stream.id === activeStreamId);
  const isConnected = connectedStreams.length > 0;

  return (
    <div className="app">
      <header className="header">
        <div className="header-top">
          <h1 className="logo">MellChat</h1>
          <div className="header-actions">
            <button 
              className="icon-btn" 
              aria-label="Connect"
              onClick={() => setShowConnectModal(true)}
            >
              ➕
            </button>
            <button className="icon-btn" aria-label="Settings">
              ⚙️
            </button>
            <button className="icon-btn" aria-label="Notifications">
              🔔
            </button>
          </div>
        </div>
        
        <div className={`status ${isConnected ? 'connected' : 'disconnected'}`}>
          {isConnected && currentStream ? (
            <>✅ Підключено до {currentStream.platform} - {currentStream.channel}</>
          ) : (
            <>❌ Не підключено</>
          )}
        </div>
        
        {isConnected && currentStream && (
          <div className="stats-grid">
            <div className="stat">
              <div className="stat-value">{questions.length}</div>
              <div className="stat-label">Питання</div>
            </div>
            <div className="stat">
              <div className="stat-value">{messages.length}</div>
              <div className="stat-label">Повідомлення</div>
            </div>
            <div className="stat">
              <div className="stat-value">{questions.reduce((sum, q) => sum + q.upvotes, 0)}</div>
              <div className="stat-label">Голоси</div>
            </div>
          </div>
        )}
      </header>

      {/* Connected stream windows (mini-cards) */}
      {connectedStreams.length > 0 && (
        <div className="connected-windows">
          {connectedStreams.map(stream => (
            <div 
              key={stream.id} 
              className={`stream-card ${activeStreamId === stream.id ? 'active' : ''}`}
              onClick={() => switchToStream(stream.id)}
            >
              <div className="stream-card-header">
                <span className={`platform-badge ${stream.platform}`}>
                  {stream.platform === 'twitch' ? 'Twitch' : (stream.platform === 'youtube' ? 'YouTube' : 'Kick')}
                </span>
                <button 
                  className="stream-card-close"
                  onClick={(e) => { e.stopPropagation(); handleDisconnect(stream.id); }}
                  aria-label="Відключитися"
                  title="Відключитися"
                >
                  ✕
                </button>
              </div>
              <div className="stream-card-title" title={stream.title || stream.channel}>
                {stream.title || stream.channel}
              </div>
              <div className="stream-card-stats">
                <span className="stat-pill">💬 {stream.messages?.length || 0}</span>
                <span className="stat-pill">❓ {stream.questions?.length || 0}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Connect Modal */}
      {showConnectModal && (
        <div className="modal-overlay" onClick={() => setShowConnectModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Підключитися до трансляції</h2>
              <button 
                className="close-btn"
                onClick={() => setShowConnectModal(false)}
              >
                ✕
              </button>
            </div>
            <div className="modal-body">
              <input
                type="text"
                className="input"
                placeholder="Вставте посилання на трансляцію..."
                value={streamUrl}
                onChange={(e) => setStreamUrl(e.target.value)}
              />
              <button 
                className="btn-primary"
                onClick={handleConnect}
                disabled={!streamUrl}
              >
                Підключитися
              </button>
              
              <div className="help-text">
                <p>📋 Приклади посилань:</p>
                <p>• Twitch: https://www.twitch.tv/username</p>
                <p>• YouTube Live: https://www.youtube.com/live/VIDEO_ID</p>
                <p>• YouTube Video: https://www.youtube.com/watch?v=VIDEO_ID</p>
                <p>• YouTube Channel: https://www.youtube.com/@username</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {!isConnected ? (
        <main className="content">
          <div className="connection-panel">
            <div className="empty">
              <div className="empty-icon">📺</div>
              <h2>Підключіться до трансляції</h2>
              <p>Вставте посилання на Twitch або YouTube трансляцію</p>
              <button 
                className="btn-primary"
                onClick={() => setShowConnectModal(true)}
              >
                Підключитися
              </button>
            </div>
          </div>
        </main>
      ) : (
        <>
          <div className="tabs">
            <button 
              className={`tab ${activeTab === 'questions' ? 'active' : ''}`}
              onClick={() => setActiveTab('questions')}
            >
              ❓ Питання <span className="badge">{questions.length}</span>
            </button>
            <button 
              className={`tab ${activeTab === 'messages' ? 'active' : ''}`}
              onClick={() => setActiveTab('messages')}
            >
              💬 Чат <span className="badge">{messages.length}</span>
            </button>
          </div>

          <main className="content">
            {activeTab === 'questions' ? (
              <div className="questions-list">
                {questions.length > 0 ? (
                  questions.map((question) => (
                    <div key={question.id} className="question-card">
                      <div className="question-header">
                        <div className="rank">#{question.id}</div>
                        <div className="username">{question.username}</div>
                        <div className="time">щойно</div>
                      </div>
                      <div className="question-text">{question.question}</div>
                      <div className="question-footer">
                        <button className="upvote-btn">
                          👍 {question.upvotes}
                        </button>
                        {question.answered && <span className="answered">Відповіли</span>}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="empty">
                    <div className="empty-icon">❓</div>
                    <h2>Питання відсутні</h2>
                    <p>Очікуйте питання від глядачів</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="messages-list">
                {messages.length > 0 ? (
                  messages.map((message) => (
                    <div key={message.id} className="message">
                      <div className="message-header">
                        <span className="username">{message.username}</span>
                        <span className="time">щойно</span>
                      </div>
                      <div className="message-text">{message.message}</div>
                    </div>
                  ))
                ) : (
                  <div className="empty">
                    <div className="empty-icon">💬</div>
                    <h2>Повідомлення відсутні</h2>
                    <p>Очікуйте повідомлення від глядачів</p>
                  </div>
                )}
              </div>
            )}
          </main>
        </>
      )}
    </div>
  );
}

export default App;