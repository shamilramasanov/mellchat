import React from 'react';
import { motion } from 'framer-motion';

const MetricCard = ({ 
  title, 
  value, 
  icon, 
  color = 'blue', 
  trend = 0, 
  loading = false,
  subtitle = null 
}) => {
  const getTrendIcon = (trend) => {
    if (trend > 0) return '↗️';
    if (trend < 0) return '↘️';
    return '➡️';
  };

  const getTrendColor = (trend) => {
    if (trend > 0) return 'text-green-500';
    if (trend < 0) return 'text-red-500';
    return 'text-gray-500';
  };

  const getColorClasses = (color) => {
    const colors = {
      blue: 'bg-blue-500',
      green: 'bg-green-500',
      purple: 'bg-purple-500',
      orange: 'bg-orange-500',
      red: 'bg-red-500',
      yellow: 'bg-yellow-500'
    };
    return colors[color] || colors.blue;
  };

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="metric-card metric-card--loading"
      >
        <div className="metric-card__skeleton">
          <div className="metric-card__skeleton-header"></div>
          <div className="metric-card__skeleton-value"></div>
          <div className="metric-card__skeleton-trend"></div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.02 }}
      className={`metric-card metric-card--${color}`}
    >
      <div className="metric-card__header">
        <h3 className="metric-card__title">{title}</h3>
        {trend !== 0 && (
          <div className={`metric-card__trend ${getTrendColor(trend)}`}>
            <span className="metric-card__trend-icon">
              {getTrendIcon(trend)}
            </span>
            <span className="metric-card__trend-value">
              {Math.abs(trend)}%
            </span>
          </div>
        )}
      </div>
      
      <div className="metric-card__content">
        <div className="metric-card__value-container">
          <span className="metric-card__icon">{icon}</span>
          <span className="metric-card__value">{value}</span>
        </div>
        
        {subtitle && (
          <p className="metric-card__subtitle">{subtitle}</p>
        )}
      </div>
      
      <div className={`metric-card__accent ${getColorClasses(color)}`}></div>
    </motion.div>
  );
};

export default MetricCard;
