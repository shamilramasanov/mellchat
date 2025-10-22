import React, { useState, useEffect } from 'react';
import { AuthScreen } from './components/Auth/AuthScreen';
import { StreamCards } from './components/StreamCards/StreamCards';
import { ChatContainer } from './components/Chat/ChatContainer';
import { SettingsPanel } from './components/Settings/SettingsPanel';
import { AddStreamModal } from './components/AddStreamModal/AddStreamModal';
import { useWebSocket } from './hooks/useWebSocket';
import './App.css';

// Mock data for demo
const mockStreams = [
  {
    id: '1',
    platform: 'youtube',
    channel: 'DemoChannel',
    title: 'Live Stream Demo',
    isLive: true,
    viewers: 1234,
    messageCount: 42
  },
  {
    id: '2',
    platform: 'twitch',
    channel: 'DemoStreamer',
    title: 'Gaming Session',
    isLive: true,
    viewers: 567,
    messageCount: 28
  }
];

const mockMessages = [
  {
    id: '1',
    username: 'User123',
    text: 'Hello everyone! How are you?',
    timestamp: Date.now() - 60000,
    color: '#4CC9F0',
    reactions: { like: 5, dislike: 0 }
  },
  {
    id: '2',
    username: 'Viewer456',
    text: 'Great stream!',
    timestamp: Date.now() - 50000,
    color: '#7209B7',
    reactions: { like: 3, dislike: 0 }
  },
  {
    id: '3',
    username: 'Fan789',
    text: 'When is the next stream?',
    timestamp: Date.now() - 40000,
    color: '#F72585',
    reactions: { like: 2, dislike: 0 }
  }
];

function App() {
  // WebSocket integration
  const { 
    isConnected, 
    streams: wsStreams, 
    messages: wsMessages, 
    addStream: wsAddStream, 
    removeStream: wsRemoveStream 
  } = useWebSocket();

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showAuth, setShowAuth] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [showAddStream, setShowAddStream] = useState(false);
  
  // Local storage for reactions and bookmarks
  const [localReactions, setLocalReactions] = useState({});
  const [localBookmarks, setLocalBookmarks] = useState(new Set());
  
  // Use WebSocket streams if available, otherwise use mock data
  const streams = wsStreams.length > 0 ? wsStreams : mockStreams;
  const [activeStreamId, setActiveStreamId] = useState(null);
  
  // Get messages for active stream
  const activeStream = streams.find(s => s.id === activeStreamId);
  const rawMessages = activeStream?.connectionId && wsMessages[activeStream.connectionId] 
    ? wsMessages[activeStream.connectionId] 
    : (wsStreams.length === 0 ? mockMessages : []);
  
  // Enrich messages with local reactions and bookmarks
  const messages = rawMessages.map(msg => ({
    ...msg,
    userReaction: localReactions[msg.id] || null,
    isBookmarked: localBookmarks.has(msg.id),
    // Update reaction counts based on local reactions
    reactions: {
      ...msg.reactions,
      ...(localReactions[msg.id] ? {
        [localReactions[msg.id]]: (msg.reactions?.[localReactions[msg.id]] || 0) + 1
      } : {})
    }
  }));
  
  const [filter, setFilter] = useState('all');
  const [settings, setSettings] = useState({
    autoTranslate: false,
    fontSize: 'medium',
    autoScroll: true,
    autoScrollDelay: 5,
    density: 'comfortable',
    notifyMessages: false,
    notifyQuestions: true,
    historyRetention: 30,
    nicknameColors: 'random',
    language: 'en'
  });

  // Check if user is authenticated or skipped auth
  useEffect(() => {
    const authSkipped = localStorage.getItem('auth_skipped');
    const token = localStorage.getItem('mellchat-token');
    
    if (authSkipped === 'true' || token) {
      setShowAuth(false);
      setIsAuthenticated(!!token);
    }
  }, []);

  const handleSkipAuth = () => {
    localStorage.setItem('auth_skipped', 'true');
    setShowAuth(false);
  };

  // Set initial active stream when streams change
  useEffect(() => {
    if (streams.length > 0 && !activeStreamId) {
      setActiveStreamId(streams[0].id);
    }
  }, [streams, activeStreamId]);

  const handleStreamClick = (streamId) => {
    setActiveStreamId(streamId);
  };

  const handleStreamClose = async (streamId) => {
    try {
      await wsRemoveStream(streamId);
      if (activeStreamId === streamId) {
        const remainingStreams = streams.filter(s => s.id !== streamId);
        setActiveStreamId(remainingStreams[0]?.id || null);
      }
    } catch (error) {
      console.error('Error closing stream:', error);
      alert(`Failed to close stream: ${error.message}`);
    }
  };

  // Swipe navigation for switching between streams
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  const minSwipeDistance = 75; // minimum swipe distance in pixels

  const onTouchStart = (e) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe || isRightSwipe) {
      const currentIndex = streams.findIndex(s => s.id === activeStreamId);
      
      if (isLeftSwipe && currentIndex < streams.length - 1) {
        // Swipe left -> next stream
        setActiveStreamId(streams[currentIndex + 1].id);
      } else if (isRightSwipe && currentIndex > 0) {
        // Swipe right -> previous stream
        setActiveStreamId(streams[currentIndex - 1].id);
      }
    }
  };

  const handleAddStream = () => {
    setShowAddStream(true);
  };

  const handleAddStreamSubmit = async (url) => {
    try {
      await wsAddStream(url);
      setShowAddStream(false);
    } catch (error) {
      console.error('Error adding stream:', error);
      alert(`Failed to add stream: ${error.message}`);
    }
  };

  const handleReaction = (messageId, reactionType) => {
    setLocalReactions(prev => {
      const current = prev[messageId];
      if (current === reactionType) {
        // Toggle off
        const newReactions = { ...prev };
        delete newReactions[messageId];
        return newReactions;
        } else {
        // Set new reaction
        return { ...prev, [messageId]: reactionType };
      }
    });
  };

  const handleBookmark = (messageId) => {
    setLocalBookmarks(prev => {
      const newBookmarks = new Set(prev);
      if (newBookmarks.has(messageId)) {
        newBookmarks.delete(messageId);
      } else {
        newBookmarks.add(messageId);
      }
      return newBookmarks;
    });
  };

  const handleSettingsChange = (newSettings) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  };

  if (showAuth) {
    return <AuthScreen onSkip={handleSkipAuth} />;
  }

  return (
    <div className="app" style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      overflow: 'hidden',
      position: 'relative'
    }}>
      {/* NEW VERSION - Icons on the RIGHT */}
      <div className="app__header" style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0.5rem 1rem',
        background: 'rgba(15, 15, 35, 0.95)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        position: 'sticky',
        top: 0,
        zIndex: 1000,
        flexShrink: 0,
        boxShadow: '0 2px 10px rgba(0, 0, 0, 0.3)'
      }}>
        <h1 className="app__logo" style={{ fontSize: '1.5rem', margin: 0 }}>MellChat v2.0</h1>
        <div className="app__header-actions" style={{
          display: 'flex',
          gap: '0.5rem'
        }}>
            <button 
            className="app__icon-btn"
            onClick={() => alert('User profile - coming soon!')}
            title="Profile"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '40px',
              height: '40px',
              background: 'rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(24px)',
              WebkitBackdropFilter: 'blur(24px)',
              border: '1px solid rgba(255, 255, 255, 0.18)',
              borderRadius: '50%',
              fontSize: '1.1rem',
              cursor: 'pointer',
              transition: 'all 0.25s',
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.3)'
            }}
            onMouseEnter={(e) => {
              e.target.style.background = 'rgba(255, 255, 255, 0.15)';
              e.target.style.transform = 'scale(1.1)';
              e.target.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.4), 0 0 20px rgba(76, 201, 240, 0.3)';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = 'rgba(255, 255, 255, 0.1)';
              e.target.style.transform = 'scale(1)';
              e.target.style.boxShadow = '0 4px 16px rgba(0, 0, 0, 0.3)';
            }}
          >
            👤
            </button>
            <button 
            className="app__icon-btn"
            onClick={() => setShowSettings(true)}
            title="Settings"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '40px',
              height: '40px',
              background: 'rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(24px)',
              WebkitBackdropFilter: 'blur(24px)',
              border: '1px solid rgba(255, 255, 255, 0.18)',
              borderRadius: '50%',
              fontSize: '1.1rem',
              cursor: 'pointer',
              transition: 'all 0.25s',
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.3)'
            }}
            onMouseEnter={(e) => {
              e.target.style.background = 'rgba(255, 255, 255, 0.15)';
              e.target.style.transform = 'scale(1.1)';
              e.target.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.4), 0 0 20px rgba(76, 201, 240, 0.3)';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = 'rgba(255, 255, 255, 0.1)';
              e.target.style.transform = 'scale(1)';
              e.target.style.boxShadow = '0 4px 16px rgba(0, 0, 0, 0.3)';
            }}
            >
              ⚙️
            </button>
          </div>
        </div>
        
      <div 
        className="app__main" 
        style={{
          display: 'flex',
          flexDirection: 'column',
          flex: 1,
          overflow: 'hidden',
          position: 'relative',
          zIndex: 10
        }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <StreamCards
          streams={streams}
          activeStreamId={activeStreamId}
          onStreamClick={handleStreamClick}
          onStreamClose={handleStreamClose}
        />
        
        <ChatContainer
          messages={messages}
          filter={filter}
          onFilterChange={setFilter}
          onAddStream={handleAddStream}
          onReaction={handleReaction}
          onBookmark={handleBookmark}
                        />
                      </div>

      <AddStreamModal
        isOpen={showAddStream}
        onClose={() => setShowAddStream(false)}
        onSubmit={handleAddStreamSubmit}
      />

      <SettingsPanel
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        settings={settings}
        onSettingsChange={handleSettingsChange}
      />
    </div>
  );
}

export default App;
