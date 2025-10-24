import { forwardRef } from 'react';
import { cn } from '@shared/utils/helpers';
import './Button.css';

const Button = forwardRef(({ 
  children,
  variant = 'primary', // primary | secondary | danger | ghost
  size = 'md', // sm | md | lg
  fullWidth = false,
  disabled = false,
  loading = false,
  leftIcon = null,
  rightIcon = null,
  className = '',
  ...props
}, ref) => {
  const classes = cn(
    'button',
    `button--${variant}`,
    `button--${size}`,
    fullWidth && 'button--full-width',
    disabled && 'button--disabled',
    loading && 'button--loading',
    className
  );

  return (
    <button
      ref={ref}
      className={classes}
      disabled={disabled || loading}
      {...props}
    >
      {/* True Liquid Glass Layers */}
      <div className="button__glass-effect" />
      <div className="button__glass-tint" />
      <div className="button__glass-shine" />
      
      {/* Button Content */}
      <div className="button__content">
        {loading && (
          <span className="button__spinner">
            <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          </span>
        )}
        {!loading && leftIcon && <span className="button__icon button__icon--left">{leftIcon}</span>}
        <span className="button__text">{children}</span>
        {!loading && rightIcon && <span className="button__icon button__icon--right">{rightIcon}</span>}
      </div>
    </button>
  );
});

Button.displayName = 'Button';

export default Button;

