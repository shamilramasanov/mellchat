import React from 'react';
import './Button.css';

export const Button = ({ 
  children, 
  variant = 'primary', // primary, secondary, ghost, danger
  size = 'md', // sm, md, lg
  fullWidth = false,
  disabled = false,
  loading = false,
  onClick,
  className = '',
  ...props 
}) => {
  const classNames = [
    'btn',
    `btn--${variant}`,
    `btn--${size}`,
    fullWidth && 'btn--full',
    disabled && 'btn--disabled',
    loading && 'btn--loading',
    className
  ].filter(Boolean).join(' ');

  return (
    <button
      className={classNames}
      onClick={onClick}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <>
          <span className="btn__spinner"></span>
          <span className="btn__text" style={{ opacity: 0.7 }}>{children}</span>
        </>
      ) : (
        <span className="btn__text">{children}</span>
      )}
    </button>
  );
};

