import React, { useState, useEffect } from 'react';
import { AuthScreen } from './components/Auth/AuthScreen';
import { StreamCards } from './components/StreamCards/StreamCards';
import { ChatContainer } from './components/Chat/ChatContainer';
import { SettingsPanel } from './components/Settings/SettingsPanel';
import { AddStreamModal } from './components/AddStreamModal/AddStreamModal';
import { RecentStreams } from './components/RecentStreams/RecentStreams';
import { useWebSocket } from './hooks/useWebSocket';
import './App.css';

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
  
  // Use only WebSocket streams (no mock data)
  const streams = wsStreams;
  const [activeStreamId, setActiveStreamId] = useState(null);
  const [filter, setFilter] = useState('all');
  
  // Get messages for active stream OR all questions from all streams
  const activeStream = streams.find(s => s.id === activeStreamId);
  
  // Collect ALL messages from ALL streams (for counting)
  const allMessages = streams.flatMap(stream => {
    const streamMessages = stream.connectionId && wsMessages[stream.connectionId] 
      ? wsMessages[stream.connectionId] 
      : [];
    
    // Add stream info to each message
    return streamMessages.map(msg => ({
      ...msg,
      streamName: stream.title || stream.channel,
      streamPlatform: stream.platform,
      streamId: stream.id
      }));
    });
  
  // If 'all-questions' filter is active, collect questions from ALL streams
  const rawMessages = filter === 'all-questions' 
    ? allMessages.filter(msg => msg.text?.includes('?')) // Only questions
    : (activeStream?.connectionId && wsMessages[activeStream.connectionId] 
        ? wsMessages[activeStream.connectionId] 
        : []);
  
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
      const newStream = await wsAddStream(url);
      
      // Save to recent streams history
      if (newStream) {
        const recentStreams = JSON.parse(localStorage.getItem('mellchat-recent-streams') || '[]');
        const streamData = {
          url,
          platform: newStream.platform,
          channel: newStream.channel,
          title: newStream.title,
          lastViewed: Date.now()
        };
        
        // Remove duplicate if exists
        const filtered = recentStreams.filter(s => s.url !== url);
        
        // Add to beginning
        const updated = [streamData, ...filtered].slice(0, 10); // Keep last 10
        localStorage.setItem('mellchat-recent-streams', JSON.stringify(updated));
      }
      
      setShowAddStream(false);
    } catch (error) {
      console.error('Error adding stream:', error);
      alert(`Failed to add stream: ${error.message}`);
    }
  };
  
  const handleRecentStreamSelect = (url) => {
    handleAddStreamSubmit(url);
  };
  
  const handleLogoClick = () => {
    // Close all streams to show Recent Streams screen
    streams.forEach(stream => {
      wsRemoveStream(stream.id);
    });
    setActiveStreamId(null);
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
    <div className="app">
      {/* Header - Fixed */}
      <header className="app__header" style={{
        flex: '0 0 auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0.5rem 1rem',
        background: 'rgba(15, 15, 35, 0.95)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        boxShadow: '0 2px 10px rgba(0, 0, 0, 0.3)'
      }}>
        <h1 
          className="app__logo" 
          onClick={handleLogoClick}
          style={{ 
            fontSize: '1.5rem', 
            margin: 0,
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => {
            e.target.style.transform = 'scale(1.05)';
            e.target.style.filter = 'brightness(1.2)';
          }}
          onMouseLeave={(e) => {
            e.target.style.transform = 'scale(1)';
            e.target.style.filter = 'brightness(1)';
          }}
          title="Show Recent Streams"
        >
          MellChat v2.0
        </h1>
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
        </header>
        
      {/* Main Content - Scrollable */}
      <main 
        className="app__main scrollable" 
        style={{
          flex: '1 1 auto',
          overflowY: 'auto',
          WebkitOverflowScrolling: 'touch',
          position: 'relative',
          zIndex: 10
        }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {streams.length === 0 ? (
          <RecentStreams onSelectStream={handleRecentStreamSelect} />
        ) : (
          <>
            <StreamCards
              streams={streams}
              activeStreamId={activeStreamId}
              onStreamClick={handleStreamClick}
              onStreamClose={handleStreamClose}
            />
            
            <ChatContainer
              messages={messages}
              allMessages={allMessages}
              filter={filter}
              onFilterChange={setFilter}
              onAddStream={handleAddStream}
              onReaction={handleReaction}
              onBookmark={handleBookmark}
            />
          </>
        )}

        {/* Global FAB - Add Stream (always visible) */}
              <button 
          className="global-fab" 
          onClick={handleAddStream}
          title="Add Stream"
          style={{
            position: 'fixed',
            bottom: streams.length === 0 ? '2rem' : '8rem',
            right: '2rem',
            width: '56px',
            height: '56px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #4CC9F0, #7209B7)',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            borderRadius: '50%',
            fontSize: '2rem',
            fontWeight: 300,
            color: 'white',
            cursor: 'pointer',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            boxShadow: '0 8px 32px rgba(76, 201, 240, 0.4), 0 0 0 0 rgba(76, 201, 240, 0.4)',
            zIndex: 1000,
            animation: 'pulse 2s ease-in-out infinite'
          }}
          onMouseEnter={(e) => {
            e.target.style.transform = 'scale(1.1) rotate(90deg)';
            e.target.style.boxShadow = '0 12px 48px rgba(76, 201, 240, 0.6), 0 0 0 8px rgba(76, 201, 240, 0.2)';
          }}
          onMouseLeave={(e) => {
            e.target.style.transform = 'scale(1) rotate(0deg)';
            e.target.style.boxShadow = '0 8px 32px rgba(76, 201, 240, 0.4), 0 0 0 0 rgba(76, 201, 240, 0.4)';
          }}
        >
          +
            </button>
      </main>

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
