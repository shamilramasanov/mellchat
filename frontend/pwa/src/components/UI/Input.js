import React from 'react';
import './Input.css';

export const Input = ({ 
  type = 'text',
  placeholder = '',
  value,
  onChange,
  icon,
  className = '',
  fullWidth = false,
  disabled = false,
  ...props 
}) => {
  const classNames = [
    'input-wrapper',
    fullWidth && 'input-wrapper--full',
    className
  ].filter(Boolean).join(' ');

  return (
    <div className={classNames}>
      {icon && <span className="input__icon">{icon}</span>}
      <input
        type={type}
        className={`input ${icon ? 'input--with-icon' : ''}`}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        disabled={disabled}
        {...props}
      />
    </div>
  );
};

