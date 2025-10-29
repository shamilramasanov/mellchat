import { useState } from 'react';
import Header from './components/Header';
import StreamList from './components/StreamList';
import ChatView from './components/ChatView';
import './App.css';

function App() {
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
      unreadQuestions: 2,
      streamUrl: 'https://www.twitch.tv/bysl4m'
    },
    {
      id: '2',
      platform: 'youtube',
      author: 'streamer123',
      title: 'Геймплей стрим - Прохождение игры',
      viewers: 890,
      isLive: true,
      unreadCount: 12,
      unreadQuestions: 0,
      streamUrl: 'https://www.youtube.com/watch?v=example'
    },
    {
      id: '3',
      platform: 'kick',
      author: 'gamer_pro',
      title: 'Вечерний стрим - Общение с чатом',
      viewers: 543,
      isLive: true,
      unreadCount: 0,
      unreadQuestions: 1,
      streamUrl: 'https://kick.com/gamer_pro'
    }
  ]);

  const handleStreamSelect = (streamId) => {
    setActiveStreamId(streamId === activeStreamId ? null : streamId);
  };

  return (
    <div className="app">
      <Header />
      <div className="app__content">
        <StreamList 
          streams={streams} 
          activeStreamId={activeStreamId}
          onStreamSelect={handleStreamSelect}
        />
        <ChatView 
          activeStream={streams.find(s => s.id === activeStreamId)}
        />
      </div>
    </div>
  );
}

export default App;

