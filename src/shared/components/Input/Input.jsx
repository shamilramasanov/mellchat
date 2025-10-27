import { forwardRef } from 'react';
import { cn } from '@shared/utils/helpers';
import './Input.css';

const Input = forwardRef(({ 
  type = 'text',
  label = '',
  error = '',
  leftIcon = null,
  rightIcon = null,
  fullWidth = false,
  className = '',
  ...props
}, ref) => {
  const hasError = !!error;

  return (
    <div className={cn('input-wrapper', fullWidth && 'input-wrapper--full-width', className)}>
      {label && (
        <label className="input-label" htmlFor={props.id}>
          {label}
        </label>
      )}
      
      <div className={cn(
        'input-container',
        hasError && 'input-container--error',
        props.disabled && 'input-container--disabled'
      )}>
        {/* True Liquid Glass Layers */}
        <div className="input-container__glass-effect" />
        <div className="input-container__glass-tint" />
        <div className="input-container__glass-shine" />
        
        {leftIcon && (
          <span className="input-icon input-icon--left">
            {leftIcon}
          </span>
        )}
        
        <input
          ref={ref}
          type={type}
          className={cn(
            'input',
            leftIcon && 'input--has-left-icon',
            rightIcon && 'input--has-right-icon'
          )}
          {...props}
        />
        
        {rightIcon && (
          <span className="input-icon input-icon--right">
            {rightIcon}
          </span>
        )}
      </div>
      
      {error && (
        <span className="input-error">{error}</span>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;
