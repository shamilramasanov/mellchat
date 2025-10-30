import { useState, useRef, useEffect } from 'react';
import { HapticFeedback } from '@shared/utils/hapticFeedback';
import './PullToRefresh.css';

const PullToRefresh = ({ onRefresh, children, threshold = 60, disabled = false }) => {
  const [isPulling, setIsPulling] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const containerRef = useRef(null);
  const startY = useRef(0);
  const currentY = useRef(0);

  const handleTouchStart = (e) => {
    if (disabled || isRefreshing) return;
    
    startY.current = e.touches[0].clientY;
    currentY.current = startY.current;
  };

  const handleTouchMove = (e) => {
    if (disabled || isRefreshing) return;
    
    currentY.current = e.touches[0].clientY;
    const distance = currentY.current - startY.current;
    
    // Только если скроллим вниз и находимся в самом верху
    if (distance > 0 && containerRef.current?.scrollTop === 0) {
      e.preventDefault();
      
      const pullDistance = Math.min(distance * 0.5, threshold * 1.5);
      setPullDistance(pullDistance);
      setIsPulling(pullDistance > 10);
      
      // Haptic feedback при достижении порога
      if (pullDistance >= threshold && !isPulling) {
        HapticFeedback.medium();
      }
    }
  };

  const handleTouchEnd = async () => {
    if (disabled || isRefreshing) return;
    
    if (pullDistance >= threshold) {
      setIsRefreshing(true);
      HapticFeedback.success();
      
      try {
        await onRefresh();
      } catch (error) {
        console.error('Pull-to-refresh error:', error);
        HapticFeedback.error();
      } finally {
        setIsRefreshing(false);
      }
    }
    
    setIsPulling(false);
    setPullDistance(0);
  };

  const refreshIconRotation = Math.min((pullDistance / threshold) * 180, 180);
  const refreshIconOpacity = Math.min(pullDistance / threshold, 1);

  return (
    <div 
      ref={containerRef}
      className="pull-to-refresh"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div 
        className={`pull-to-refresh__indicator ${isPulling ? 'pull-to-refresh__indicator--active' : ''} ${isRefreshing ? 'pull-to-refresh__indicator--refreshing' : ''}`}
        style={{
          transform: `translateY(${Math.min(pullDistance, threshold)}px)`,
          opacity: refreshIconOpacity
        }}
      >
        <div 
          className="pull-to-refresh__icon"
          style={{
            transform: `rotate(${refreshIconRotation}deg)`
          }}
        >
          {isRefreshing ? '⟳' : '↓'}
        </div>
        <div className="pull-to-refresh__text">
          {isRefreshing ? 'Обновление...' : pullDistance >= threshold ? 'Отпустите для обновления' : 'Потяните для обновления'}
        </div>
      </div>
      {children}
    </div>
  );
};

export default PullToRefresh;
