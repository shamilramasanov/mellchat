import React, { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [connectedStreams, setConnectedStreams] = useState([]);
  const [activeStreamId, setActiveStreamId] = useState(null);
  const [streamUrl, setStreamUrl] = useState('');
  const [activeTab, setActiveTab] = useState('questions');
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [messages, setMessages] = useState([]);
  const [questions, setQuestions] = useState([]);

  // Update messages and questions when active stream changes
  useEffect(() => {
    if (activeStreamId) {
      const activeStream = connectedStreams.find(stream => stream.id === activeStreamId);
      if (activeStream) {
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

    if (streamUrl.includes('twitch.tv')) {
      detectedPlatform = 'twitch';
      const match = streamUrl.match(/twitch\.tv\/([^/?]+)/);
      channelName = match ? match[1] : '';
      streamTitle = `Twitch: ${channelName}`;
    } else if (streamUrl.includes('youtube.com') || streamUrl.includes('youtu.be')) {
      detectedPlatform = 'youtube';
      // Support multiple YouTube URL formats
      let match = streamUrl.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&?]+)/);
      if (!match) {
        // Try YouTube Live format: youtube.com/live/VIDEO_ID
        match = streamUrl.match(/youtube\.com\/live\/([^&?]+)/);
        console.log('Trying YouTube Live format:', match);
      }
      if (!match) {
        // Try YouTube channel format: youtube.com/channel/CHANNEL_ID
        match = streamUrl.match(/youtube\.com\/channel\/([^&?]+)/);
      }
      if (!match) {
        // Try YouTube user format: youtube.com/user/USERNAME
        match = streamUrl.match(/youtube\.com\/user\/([^&?]+)/);
      }
      if (!match) {
        // Try YouTube @ format: youtube.com/@([^&?]+)
        match = streamUrl.match(/youtube\.com\/@([^&?]+)/);
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
        fetch('http://localhost:3001/api/v1/youtube', {
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
            startMessagePolling(newStream.id, data.connectionId);
          } else {
            console.error('Failed to connect to YouTube Live Chat:', data.message);
            alert(`Помилка підключення: ${data.message}`);
          }
        })
        .catch(error => {
          console.error('YouTube API error:', error);
          alert('Помилка підключення до YouTube Live Chat');
        });
      } else {
        // For Twitch, use simulation for now
        setTimeout(() => {
          setConnectedStreams(prev => prev.map(stream => {
            if (stream.id === newStream.id) {
              return {
                ...stream,
                messages: [
                  { id: 1, username: 'viewer1', message: 'Привіт з Twitch чату!', timestamp: new Date() },
                  { id: 2, username: 'viewer2', message: 'Крута трансляція!', timestamp: new Date() },
                ],
                questions: [
                  { id: 1, username: 'viewer1', question: 'Як почати стрімити?', upvotes: 5, answered: false },
                  { id: 2, username: 'viewer2', question: 'Що таке MellChat?', upvotes: 3, answered: false },
                ]
              };
            }
            return stream;
          }));
        }, 1000);
      }
    } else {
      alert('Не вдалося розпізнати платформу або канал. Перевірте посилання.');
    }
  };

  const handleDisconnect = (streamId) => {
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
      
      return updated;
    });
  };

  const switchToStream = (streamId) => {
    setActiveStreamId(streamId);
  };

  // Poll for new messages from YouTube Live Chat
  const startMessagePolling = (streamId, connectionId) => {
    const pollInterval = setInterval(() => {
      // Check if stream is still connected
      const stream = connectedStreams.find(s => s.id === streamId);
      if (!stream) {
        clearInterval(pollInterval);
        return;
      }

      // Poll for new messages (simplified - in real app would use WebSocket)
      fetch(`http://localhost:3001/api/v1/youtube/messages/${connectionId}`)
        .then(response => response.json())
        .then(data => {
          if (data.success && data.messages && data.messages.length > 0) {
            // Add new messages to stream
            setConnectedStreams(prev => prev.map(s => {
              if (s.id === streamId) {
                const newMessages = [...(s.messages || []), ...data.messages];
                return {
                  ...s,
                  messages: newMessages.slice(-100) // Keep last 100 messages
                };
              }
              return s;
            }));
          }
        })
        .catch(error => {
          console.error('Message polling error:', error);
        });
    }, 3000); // Poll every 3 seconds

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

      {/* Stream Tabs */}
      {connectedStreams.length > 0 && (
        <div className="stream-tabs">
          {connectedStreams.map(stream => (
            <div key={stream.id} className="stream-tab-container">
              <button 
                className={`stream-tab ${activeStreamId === stream.id ? 'active' : ''}`}
                onClick={() => switchToStream(stream.id)}
              >
                <span className="platform-icon">
                  {stream.platform === 'twitch' ? '📺' : '🎥'}
                </span>
                <span className="stream-title">{stream.channel}</span>
                <span className="stream-count">
                  {stream.messages?.length || 0}
                </span>
              </button>
              <button 
                className="disconnect-stream-btn"
                onClick={() => handleDisconnect(stream.id)}
                title="Відключитися"
              >
                ✕
              </button>
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