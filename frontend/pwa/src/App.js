import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useWebSocket } from './hooks/useWebSocket';
import ThemeSettings from './components/ThemeSettings';
import { EmojiText } from './components/Emoji';
import './App.css';

function App() {
  const ws = useWebSocket();
  const { t } = useTranslation();
  const [connectedStreams, setConnectedStreams] = useState([]);
  const [activeStreamId, setActiveStreamId] = useState(null);
  const [streamUrl, setStreamUrl] = useState('');
  const [activeTab, setActiveTab] = useState('questions');
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [showThemeSettings, setShowThemeSettings] = useState(false);
  const [messages, setMessages] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [upvotedQuestions, setUpvotedQuestions] = useState(new Set());

  // Load upvoted questions from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('upvoted-questions');
    if (saved) {
      try {
        setUpvotedQuestions(new Set(JSON.parse(saved)));
      } catch (e) {
        console.error('Failed to load upvoted questions:', e);
      }
    }
  }, []);

  // Save upvoted questions to localStorage
  useEffect(() => {
    localStorage.setItem('upvoted-questions', JSON.stringify([...upvotedQuestions]));
  }, [upvotedQuestions]);

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

  // Load saved streams on app start with versioning
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    const STORAGE_VERSION = '1.0';
    const savedData = localStorage.getItem('mellchat-streams');
    
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        
        // Check version compatibility
        if (parsed.version && parsed.version !== STORAGE_VERSION) {
          console.log('Storage version mismatch, clearing old data');
          localStorage.removeItem('mellchat-streams');
          return;
        }
        
        const savedStreams = parsed.streams || parsed || []; // Support both old and new format
        
        // Migrate legacy saved entries: ensure connectionId for YouTube = `youtube-<videoId>`
        const migrated = savedStreams.map((s) => {
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
          // WebSocket will auto-subscribe on activeStreamId change
        }
        console.log('Loaded saved streams:', migrated.length);
      } catch (error) {
        console.error('Error loading saved streams:', error);
        // Clear corrupted data
        localStorage.removeItem('mellchat-streams');
      }
    }
  }, []);

  // Save streams to localStorage when they change (including empty array) with versioning
  useEffect(() => {
    const STORAGE_VERSION = '1.0';
    const dataToSave = {
      version: STORAGE_VERSION,
      streams: connectedStreams,
      lastUpdated: Date.now()
    };
    localStorage.setItem('mellchat-streams', JSON.stringify(dataToSave));
    console.log('Saved streams to localStorage:', connectedStreams.length);
  }, [connectedStreams]);

  // Update messages and questions when active stream changes
  useEffect(() => {
    console.log('useEffect triggered - activeStreamId:', activeStreamId, 'connectedStreams:', connectedStreams.length);
    if (activeStreamId) {
      const activeStream = connectedStreams.find(stream => stream.id === activeStreamId);
      if (activeStream) {
        console.log('Active stream found:', activeStream.title, 'messages:', activeStream.messages?.length || 0);
        const allMessages = activeStream.messages || [];
        setMessages(allMessages);
        
        // Filter questions automatically (messages ending with ?)
        const filteredQuestions = allMessages.filter(msg => {
          const text = msg.message?.trim() || '';
          return text.endsWith('?');
        }).map((msg, index) => ({
          ...msg,
          question: msg.message,
          upvotes: msg.upvotes || 0,
          answered: false
        }));
        setQuestions(filteredQuestions);
        console.log('Filtered questions:', filteredQuestions.length);
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
            
            // WebSocket will handle real-time messages automatically
            console.log('YouTube connected, WebSocket will handle messages:', data.connectionId);
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
            
            // WebSocket will handle real-time messages automatically
            console.log('Twitch connected, WebSocket will handle messages:', data.connectionId);
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
            // WebSocket will handle real-time messages automatically
            console.log('Kick connected, WebSocket will handle messages:', data.connectionId);
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
      const updated = prev.filter(stream => stream.id !== streamId);
      
      // If disconnecting active stream, switch to another or clear
      if (streamId === activeStreamId) {
        if (updated.length > 0) {
          setActiveStreamId(updated[0].id);
        } else {
          setActiveStreamId(null);
        }
      }
      
      // Cleanup: If this was the last stream, ensure complete cleanup
      if (updated.length === 0) {
        console.log('Last stream disconnected - performing cleanup');
        setActiveStreamId(null);
        setMessages([]);
        setQuestions([]);
        
        // Force localStorage update to empty array
        const STORAGE_VERSION = '1.0';
        const dataToSave = {
          version: STORAGE_VERSION,
          streams: [],
          lastUpdated: Date.now()
        };
        localStorage.setItem('mellchat-streams', JSON.stringify(dataToSave));
        console.log('Forced localStorage update with empty streams');
      }
      
      return updated;
    });
  };

  const switchToStream = (streamId) => {
    setActiveStreamId(streamId);
  };

  const handleUpvote = (questionId) => {
    setUpvotedQuestions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(questionId)) {
        newSet.delete(questionId);
      } else {
        newSet.add(questionId);
      }
      return newSet;
    });
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
            <button 
              className="icon-btn" 
              aria-label="Settings"
              onClick={() => setShowThemeSettings(true)}
            >
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
              <div className="stat-label">{t('nav.questions')}</div>
            </div>
            <div className="stat">
              <div className="stat-value">{messages.length}</div>
              <div className="stat-label">{t('nav.messages')}</div>
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
                <div className="platform-icon">
                  {stream.platform === 'youtube' && '📺'}
                  {stream.platform === 'twitch' && '🎮'}
                  {stream.platform === 'kick' && '⚡'}
                </div>
                <div className="stream-card-info">
                  <div className="stream-card-title" title={stream.title || stream.channel}>
                    {stream.title || stream.channel}
                  </div>
                  <div className="stream-card-stats">
                    <span className="stat-pill">💬 {stream.messages?.length || 0}</span>
                    <span className="stat-pill">❓ {stream.questions?.length || 0}</span>
                  </div>
                </div>
                <button 
                  className="stream-card-close"
                  onClick={(e) => { e.stopPropagation(); handleDisconnect(stream.id); }}
                  aria-label="Відключитися"
                  title="Відключитися"
                >
                  ✕
                </button>
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
              ❓ {t('nav.questions')} <span className="badge">{questions.length}</span>
            </button>
            <button 
              className={`tab ${activeTab === 'messages' ? 'active' : ''}`}
              onClick={() => setActiveTab('messages')}
            >
              💬 {t('nav.messages')} <span className="badge">{messages.length}</span>
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
                      <div className="question-text">
                        <EmojiText 
                          text={question.question} 
                          emojis={question.emojis || []}
                          platform={question.platform || 'universal'}
                        />
                      </div>
                      <div className="question-footer">
                        <button 
                          className={`upvote-btn ${upvotedQuestions.has(question.id) ? 'upvoted' : ''}`}
                          onClick={() => handleUpvote(question.id)}
                        >
                          👍 {(question.upvotes || 0) + (upvotedQuestions.has(question.id) ? 1 : 0)}
                        </button>
                        {question.answered && <span className="answered">Відповіли</span>}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="empty">
                    <div className="empty-icon">❓</div>
                    <h2>{t('questions.empty.title')}</h2>
                    <p>{t('questions.empty.description')}</p>
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
                      <div className="message-text">
                        <EmojiText 
                          text={message.message} 
                          emojis={message.emojis || []}
                          platform={message.platform || 'universal'}
                        />
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="empty">
                    <div className="empty-icon">💬</div>
                    <h2>{t('messages.empty.title')}</h2>
                    <p>{t('messages.empty.description')}</p>
                  </div>
                )}
              </div>
            )}
          </main>
        </>
      )}
      
      {/* Theme Settings Modal */}
      <ThemeSettings 
        isOpen={showThemeSettings} 
        onClose={() => setShowThemeSettings(false)} 
      />
    </div>
  );
}

export default App;