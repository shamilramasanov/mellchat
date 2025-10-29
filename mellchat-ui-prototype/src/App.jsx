import { useState } from 'react';
import BottomNav from './components/BottomNav';
import StreamsView from './components/StreamsView';
import ChatView from './components/ChatView';
import './App.css';

function App() {
  const [activeTab, setActiveTab] = useState('streams'); // 'streams' | 'chat'
  const [activeStreamId, setActiveStreamId] = useState(null);
  
  const [streams] = useState([
    {
      id: '1',
      platform: 'twitch',
      author: 'bysl4m',
      title: 'Поток бислама - Играем в новую игру',
      viewers: 1250,
      isLive: true,
      unreadCount: 5,
      unreadQuestions: 2
    },
    {
      id: '2',
      platform: 'youtube',
      author: 'streamer123',
      title: 'Геймплей стрим - Прохождение',
      viewers: 890,
      isLive: true,
      unreadCount: 12,
      unreadQuestions: 0
    },
    {
      id: '3',
      platform: 'kick',
      author: 'gamer_pro',
      title: 'Вечерний стрим',
      viewers: 543,
      isLive: false,
      unreadCount: 0,
      unreadQuestions: 1
    }
  ]);

  const handleStreamSelect = (streamId) => {
    setActiveStreamId(streamId);
    setActiveTab('chat');
  };

  return (
    <div className="app">
      {/* Main Content */}
      <main className="app__content">
        {activeTab === 'streams' && (
          <StreamsView 
            streams={streams}
            onStreamSelect={handleStreamSelect}
          />
        )}
        {activeTab === 'chat' && (
          <ChatView 
            stream={streams.find(s => s.id === activeStreamId)}
          />
        )}
      </main>

      {/* Bottom Navigation */}
      <BottomNav 
        activeTab={activeTab}
        onTabChange={setActiveTab}
        streams={streams}
        activeStreamId={activeStreamId}
      />
    </div>
  );
}

export default App;

