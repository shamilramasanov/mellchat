import { useEffect, useRef, useState } from 'react';

const LiquidGlassButton = ({
  text = '➕',
  size = 24,
  type = 'circle',
  onClick,
  className = '',
  disabled = false,
  tintOpacity = 0.2,
  warp = false,
  borderRadius = 28
}) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
        <button
          className={`liquid-glass-button ${className}`}
          onClick={onClick}
          disabled={disabled}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          style={{
            borderRadius: '50%',
            border: '2px solid rgba(255, 255, 255, 0.3)',
            background: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a52 100%)',
            color: 'white',
            fontSize: '24px',
            cursor: 'pointer',
            boxShadow: `
              0 8px 24px rgba(255, 107, 107, 0.4),
              0 4px 12px rgba(0, 0, 0, 0.3),
              inset 0 1px 0 rgba(255, 255, 255, 0.3),
              inset 0 -1px 0 rgba(0, 0, 0, 0.2)
            `,
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            overflow: 'hidden',
            transform: isHovered ? 'scale(1.1)' : 'scale(1)',
            fontWeight: 'bold',
            textShadow: '0 1px 2px rgba(0, 0, 0, 0.5)'
          }}
        >
      
          {/* Text content */}
          <span>
            {text}
          </span>
    </button>
  );
};

export default LiquidGlassButton;