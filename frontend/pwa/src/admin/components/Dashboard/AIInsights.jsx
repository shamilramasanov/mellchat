import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import useAdminStore from '../../store/adminStore';

const AIInsights = ({ recommendations = [], loading = false }) => {
  const [expandedCard, setExpandedCard] = useState(null);
  const { sendAIMessage } = useAdminStore();
  const [aiQuery, setAiQuery] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  const handleAIQuery = async () => {
    if (!aiQuery.trim()) return;

    setAiLoading(true);
    const result = await sendAIMessage(aiQuery);
    
    if (result.success) {
      setAiResponse(result.response);
    } else {
      setAiResponse(`Error: ${result.error}`);
    }
    
    setAiLoading(false);
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'red';
      case 'medium': return 'yellow';
      case 'low': return 'green';
      default: return 'blue';
    }
  };

  const getPriorityIcon = (priority) => {
    switch (priority) {
      case 'high': return '🚨';
      case 'medium': return '⚠️';
      case 'low': return '💡';
      default: return '🤖';
    }
  };

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="ai-insights ai-insights--loading"
      >
        <div className="ai-insights__skeleton">
          <div className="ai-insights__skeleton-header"></div>
          <div className="ai-insights__skeleton-content"></div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="ai-insights"
    >
      <div className="ai-insights__header">
        <h2>🤖 AI Insights & Recommendations</h2>
        <div className="ai-insights__badge">
          {recommendations.length} recommendations
        </div>
      </div>

      {/* AI Chat Interface */}
      <div className="ai-insights__chat">
        <div className="ai-insights__chat-header">
          <h3>Ask AI Assistant</h3>
        </div>
        <div className="ai-insights__chat-input">
          <input
            type="text"
            value={aiQuery}
            onChange={(e) => setAiQuery(e.target.value)}
            placeholder="Ask about system performance, user behavior, or optimization..."
            onKeyPress={(e) => e.key === 'Enter' && handleAIQuery()}
          />
          <button 
            onClick={handleAIQuery}
            disabled={aiLoading || !aiQuery.trim()}
            className="ai-insights__chat-btn"
          >
            {aiLoading ? '⏳' : '🚀'}
          </button>
        </div>
        {aiResponse && (
          <div className="ai-insights__chat-response">
            <div className="ai-insights__response-content">
              {aiResponse}
            </div>
          </div>
        )}
      </div>

      {/* Recommendations */}
      <div className="ai-insights__recommendations">
        <h3>Latest Recommendations</h3>
        
        {recommendations.length === 0 ? (
          <div className="ai-insights__empty">
            <p>No recommendations available. AI is analyzing system data...</p>
          </div>
        ) : (
          <div className="ai-insights__cards">
            <AnimatePresence>
              {recommendations.map((rec, index) => (
                <motion.div
                  key={rec.id || index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ delay: index * 0.1 }}
                  className={`ai-insights__card ai-insights__card--${getPriorityColor(rec.priority)}`}
                  onClick={() => setExpandedCard(expandedCard === index ? null : index)}
                >
                  <div className="ai-insights__card-header">
                    <div className="ai-insights__card-icon">
                      {getPriorityIcon(rec.priority)}
                    </div>
                    <div className="ai-insights__card-title">
                      <h4>{rec.title}</h4>
                      <span className={`ai-insights__card-priority ai-insights__card-priority--${getPriorityColor(rec.priority)}`}>
                        {rec.priority}
                      </span>
                    </div>
                    <div className="ai-insights__card-actions">
                      <button className="ai-insights__card-expand">
                        {expandedCard === index ? '▼' : '▶'}
                      </button>
                    </div>
                  </div>
                  
                  <div className="ai-insights__card-content">
                    <p>{rec.description}</p>
                    
                    {rec.metrics && (
                      <div className="ai-insights__card-metrics">
                        {Object.entries(rec.metrics).map(([key, value]) => (
                          <div key={key} className="ai-insights__metric">
                            <span className="ai-insights__metric-label">{key}:</span>
                            <span className="ai-insights__metric-value">{value}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <AnimatePresence>
                    {expandedCard === index && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="ai-insights__card-details"
                      >
                        <div className="ai-insights__card-actions-list">
                          {rec.actions?.map((action, actionIndex) => (
                            <button 
                              key={actionIndex}
                              className="ai-insights__action-btn"
                              onClick={(e) => {
                                e.stopPropagation();
                                // Handle action execution
                                console.log('Executing action:', action);
                              }}
                            >
                              {action.icon} {action.label}
                            </button>
                          ))}
                        </div>
                        
                        {rec.details && (
                          <div className="ai-insights__card-details-content">
                            <h5>Technical Details:</h5>
                            <pre>{JSON.stringify(rec.details, null, 2)}</pre>
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default AIInsights;
