import { useState } from 'react';
import './ChatView.css';

const ChatView = ({ activeStream }) => {
  const [messages] = useState([
    {
      id: '1',
      username: 'user123',
      text: 'Привет всем! Отличный стрим!',
      platform: 'twitch',
      timestamp: new Date(Date.now() - 300000),
      isQuestion: false
    },
    {
      id: '2',
      username: 'viewer456',
      text: 'Когда следующий ивент?',
      platform: 'twitch',
      timestamp: new Date(Date.now() - 240000),
      isQuestion: true
    },
    {
      id: '3',
      username: 'fan789',
      text: 'Спасибо за контент! 🔥',
      platform: 'twitch',
      timestamp: new Date(Date.now() - 180000),
      isQuestion: false
    },
    {
      id: '4',
      username: 'admin',
      text: 'Добро пожаловать на стрим!',
      platform: 'admin',
      timestamp: new Date(Date.now() - 120000),
      isQuestion: false,
      isAdmin: true
    },
    {
      id: '5',
      username: 'curious_user',
      text: 'Как настроить камеру?',
      platform: 'twitch',
      timestamp: new Date(Date.now() - 60000),
      isQuestion: true
    },
    {
      id: '6',
      username: 'supporter',
      text: 'Отличная игра! Продолжай в том же духе!',
      platform: 'twitch',
      timestamp: new Date(Date.now() - 30000),
      isQuestion: false
    },
    {
      id: '7',
      username: 'gamer_fan',
      text: 'Какая следующая игра?',
      platform: 'twitch',
      timestamp: new Date(Date.now() - 15000),
      isQuestion: true
    }
  ]);

  if (!activeStream) {
    return (
      <div className="chat-view chat-view--empty">
        <div className="chat-view__empty">
          <div className="chat-view__empty-icon">💬</div>
          <h3>Выберите стрим</h3>
          <p>Выберите стрим из списка для просмотра чата</p>
        </div>
      </div>
    );
  }

  return (
    <div className="chat-view">
      <div className="chat-view__header">
        <div>
          <h2 className="chat-view__title">
            {activeStream.streamUrl ? (
              <a 
                href={activeStream.streamUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="chat-view__title-link"
              >
                {activeStream.author}
              </a>
            ) : (
              activeStream.author
            )}
          </h2>
          <p className="chat-view__subtitle">{activeStream.title}</p>
        </div>
        <div className="chat-view__stats">
          <span>👁 {activeStream.viewers}</span>
        </div>
      </div>
      
      <div className="chat-view__messages">
        {messages.map(message => (
          <div
            key={message.id}
            className={`message ${message.isQuestion ? 'message--question' : ''} ${message.isAdmin ? 'message--admin' : ''}`}
            data-message-id={message.id}
          >
            <div className="message__header">
              <span className="message__username">{message.username}</span>
              <span className="message__time">
                {message.timestamp.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
            <div className="message__text">{message.text}</div>
            {message.isQuestion && (
              <div className="message__question-badge">❓ Вопрос</div>
            )}
          </div>
        ))}
      </div>
      
      <div className="chat-view__input">
        <input
          type="text"
          className="md-input"
          placeholder="Поиск сообщений..."
        />
      </div>
    </div>
  );
};

export default ChatView;

