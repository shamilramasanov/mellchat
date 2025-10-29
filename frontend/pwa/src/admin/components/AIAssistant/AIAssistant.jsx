import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import useAdminStore from '../../store/adminStore';

const AIAssistant = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const { sendAIMessage } = useAdminStore();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = {
      role: 'user',
      content: input.trim(),
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const result = await sendAIMessage(input, messages);
      
      if (result.success) {
        const aiMessage = {
          role: 'assistant',
          content: result.response,
          timestamp: result.timestamp || new Date().toISOString()
        };
        setMessages(prev => [...prev, aiMessage]);
      } else {
        const errorMessage = {
          role: 'assistant',
          content: `❌ Ошибка: ${result.error}`,
          timestamp: new Date().toISOString(),
          isError: true
        };
        setMessages(prev => [...prev, errorMessage]);
      }
    } catch (error) {
      const errorMessage = {
        role: 'assistant',
        content: `❌ Ошибка соединения: ${error.message}`,
        timestamp: new Date().toISOString(),
        isError: true
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const clearChat = () => {
    setMessages([]);
  };

  return (
    <div className="admin-page ai-assistant">
      <div className="ai-assistant__header">
        <h1>🤖 AI Assistant</h1>
        <div className="ai-assistant__actions">
          <button 
            onClick={clearChat}
            className="ai-assistant__clear-btn"
            disabled={messages.length === 0}
          >
            🗑️ Очистить чат
          </button>
        </div>
      </div>

      <div className="ai-assistant__container">
        <div className="ai-assistant__messages">
          <AnimatePresence>
            {messages.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="ai-assistant__welcome"
              >
                <h3>👋 Добро пожаловать в AI Assistant!</h3>
                <p>Задайте мне вопросы о системе MellChat:</p>
                <ul>
                  <li>📊 Анализ производительности</li>
                  <li>🔧 Диагностика проблем</li>
                  <li>⚡ Рекомендации по оптимизации</li>
                  <li>📈 Анализ метрик</li>
                  <li>🛠️ Помощь в настройке</li>
                </ul>
              </motion.div>
            ) : (
              messages.map((message, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className={`ai-assistant__message ai-assistant__message--${message.role} ${message.isError ? 'ai-assistant__message--error' : ''}`}
                >
                  <div className="ai-assistant__message-header">
                    <span className="ai-assistant__message-role">
                      {message.role === 'user' ? '👤 Вы' : '🤖 AI Assistant'}
                    </span>
                    <span className="ai-assistant__message-time">
                      {new Date(message.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <div className="ai-assistant__message-content">
                    {message.content}
                  </div>
                </motion.div>
              ))
            )}
          </AnimatePresence>
          
          {isLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="ai-assistant__typing"
            >
              <div className="ai-assistant__typing-dots">
                <span></span>
                <span></span>
                <span></span>
              </div>
              <span>AI думает...</span>
            </motion.div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        <div className="ai-assistant__input-container">
          <div className="ai-assistant__input">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Задайте вопрос о системе MellChat..."
              disabled={isLoading}
              rows={3}
            />
            <button
              onClick={handleSendMessage}
              disabled={!input.trim() || isLoading}
              className="ai-assistant__send-btn"
            >
              {isLoading ? '⏳' : '🚀'}
            </button>
          </div>
          <div className="ai-assistant__input-hint">
            💡 Нажмите Enter для отправки, Shift+Enter для новой строки
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIAssistant;
