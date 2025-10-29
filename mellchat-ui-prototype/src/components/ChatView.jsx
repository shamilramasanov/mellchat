import { useState } from 'react';
import './ChatView.css';

const ChatView = ({ stream }) => {
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
    }
  ]);

  if (!stream) {
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
          <h2 className="chat-view__title">{stream.author}</h2>
          <p className="chat-view__subtitle">{stream.title}</p>
        </div>
        <div className="chat-view__stats">
          <span>👁 {stream.viewers}</span>
        </div>
      </div>
      
      <div className="chat-view__messages">
        {messages.map(message => (
          <div
            key={message.id}
            className={`message ${message.isQuestion ? 'message--question' : ''} ${message.isAdmin ? 'message--admin' : ''}`}
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
