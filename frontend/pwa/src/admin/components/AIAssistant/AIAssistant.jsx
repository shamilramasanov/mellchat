import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import useAdminStore from '../../store/adminStore';
import './AIAssistant.css';

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

  const handleInputChange = (e) => {
    setInput(e.target.value);
    // Auto-resize textarea
    const textarea = e.target;
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
  };

  const clearChat = () => {
    setMessages([]);
  };

  const handleSuggestionClick = (suggestion) => {
    setInput(suggestion);
  };

  const suggestions = [
    'Анализ производительности',
    'Диагностика проблем',
    'Рекомендации по оптимизации'
  ];

  return (
    <div className="ai-assistant">
      <div className="ai-assistant__header">
        <div className="ai-assistant__title">
          <div className="ai-assistant__icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h1>AI Assistant</h1>
        </div>
        <div className="ai-assistant__actions">
          <button 
            onClick={clearChat}
            className="ai-assistant__clear-btn"
            disabled={messages.length === 0}
            title="Очистить чат"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M3 6H5H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M8 6V4C8 3.46957 8.21071 2.96086 8.58579 2.58579C8.96086 2.21071 9.46957 2 10 2H14C14.5304 2 15.0391 2.21071 15.4142 2.58579C15.7893 2.96086 16 3.46957 16 4V6M19 6V20C19 20.5304 18.7893 21.0391 18.4142 21.4142C18.0391 21.7893 17.5304 22 17 22H7C6.46957 22 5.96086 21.7893 5.58579 21.4142C5.21071 21.0391 5 20.5304 5 20V6H19Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
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
                <div className="ai-assistant__welcome-icon">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
                    <path d="M21 15C21 15.5304 20.7893 16.0391 20.4142 16.4142C20.0391 16.7893 19.5304 17 19 17H7L3 21V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H19C19.5304 3 20.0391 3.21071 20.4142 3.58579C20.7893 3.96086 21 4.46957 21 5V15Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <h3>Добро пожаловать в AI Assistant</h3>
                <p>Задайте мне вопросы о системе MellChat:</p>
                <div className="ai-assistant__suggestions">
                  {suggestions.map((suggestion, index) => (
                    <div 
                      key={index}
                      className="ai-assistant__suggestion"
                      onClick={() => handleSuggestionClick(suggestion)}
                    >
                      <div className="ai-assistant__suggestion-icon">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                          <path d="M3 3V21H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M9 9L12 6L16 10L20 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </div>
                      <span>{suggestion}</span>
                    </div>
                  ))}
                </div>
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
                  <div className="ai-assistant__message-avatar">
                    {message.role === 'user' ? (
                      <div className="ai-assistant__avatar ai-assistant__avatar--user">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                          <path d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </div>
                    ) : (
                      <div className="ai-assistant__avatar ai-assistant__avatar--ai">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                          <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </div>
                    )}
                  </div>
                  <div className="ai-assistant__message-content">
                    <div className="ai-assistant__message-text">
                      {message.content}
                    </div>
                    <div className="ai-assistant__message-time">
                      {new Date(message.timestamp).toLocaleTimeString()}
                    </div>
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
              <div className="ai-assistant__message-avatar">
                <div className="ai-assistant__avatar ai-assistant__avatar--ai">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              </div>
              <div className="ai-assistant__typing-content">
                <div className="ai-assistant__typing-dots">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
                <span>AI анализирует...</span>
              </div>
            </motion.div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        <div className="ai-assistant__input-container">
          <div className="ai-assistant__input">
            <textarea
              value={input}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              placeholder="Задайте вопрос о системе MellChat..."
              disabled={isLoading}
              rows={1}
              className="ai-assistant__textarea"
            />
            <button
              onClick={handleSendMessage}
              disabled={!input.trim() || isLoading}
              className="ai-assistant__send-btn"
              title="Отправить сообщение"
            >
              {isLoading ? (
                <div className="ai-assistant__spinner"></div>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M22 2L11 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
            </button>
          </div>
          <div className="ai-assistant__input-hint">
            Нажмите Enter для отправки, Shift+Enter для новой строки
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIAssistant;
