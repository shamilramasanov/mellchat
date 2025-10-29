import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const SystemAlerts = ({ alerts = [] }) => {
  const [dismissedAlerts, setDismissedAlerts] = useState(new Set());

  const dismissAlert = (alertId) => {
    setDismissedAlerts(prev => new Set([...prev, alertId]));
  };

  const getAlertIcon = (type) => {
    switch (type) {
      case 'error': return '🚨';
      case 'warning': return '⚠️';
      case 'info': return 'ℹ️';
      case 'success': return '✅';
      default: return '🔔';
    }
  };

  const getAlertColor = (type) => {
    switch (type) {
      case 'error': return 'red';
      case 'warning': return 'yellow';
      case 'info': return 'blue';
      case 'success': return 'green';
      default: return 'gray';
    }
  };

  const visibleAlerts = alerts.filter(alert => !dismissedAlerts.has(alert.id));

  if (visibleAlerts.length === 0) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="system-alerts"
    >
      <AnimatePresence>
        {visibleAlerts.map((alert) => (
          <motion.div
            key={alert.id}
            initial={{ opacity: 0, x: -300 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 300 }}
            className={`system-alert system-alert--${getAlertColor(alert.type)}`}
          >
            <div className="system-alert__icon">
              {getAlertIcon(alert.type)}
            </div>
            
            <div className="system-alert__content">
              <div className="system-alert__header">
                <h4 className="system-alert__title">{alert.title}</h4>
                <span className="system-alert__timestamp">
                  {new Date(alert.timestamp).toLocaleTimeString()}
                </span>
              </div>
              
              <p className="system-alert__message">{alert.message}</p>
              
              {alert.details && (
                <div className="system-alert__details">
                  <details>
                    <summary>Technical Details</summary>
                    <pre>{JSON.stringify(alert.details, null, 2)}</pre>
                  </details>
                </div>
              )}
            </div>
            
            <div className="system-alert__actions">
              {alert.actions?.map((action, index) => (
                <button
                  key={index}
                  className="system-alert__action-btn"
                  onClick={() => {
                    // Handle action
                    console.log('Executing action:', action);
                  }}
                >
                  {action.icon} {action.label}
                </button>
              ))}
              
              <button
                className="system-alert__dismiss-btn"
                onClick={() => dismissAlert(alert.id)}
                title="Dismiss alert"
              >
                ✕
              </button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </motion.div>
  );
};

export default SystemAlerts;
