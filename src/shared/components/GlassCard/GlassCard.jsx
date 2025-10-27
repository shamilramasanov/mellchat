import { cn } from '@shared/utils/helpers';
import './GlassCard.css';

const GlassCard = ({ 
  children,
  variant = 'regular', // clear | regular | frosted
  interactive = false,
  className = '',
  ...props
}) => {
  const classes = cn(
    'glass-card',
    `glass-card--${variant}`,
    interactive && 'glass-card--interactive',
    className
  );

  return (
    <div className={classes} {...props}>
      {/* True Liquid Glass Layers */}
      <div className="glass-card__effect" />
      <div className="glass-card__tint" />
      <div className="glass-card__shine" />
      
      {/* Card Content */}
      <div className="glass-card__content">
        {children}
      </div>
    </div>
  );
};

export default GlassCard;

