import React from 'react';
import './GlassCard.css';

export const GlassCard = ({ children, className = '', hover = false, ...props }) => {
  return (
    <div 
      className={`glass-card ${hover ? 'glass-card--hover' : ''} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

