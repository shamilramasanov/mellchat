// Dashboard для мониторинга производительности в реальном времени
import React, { useState, useEffect, memo } from 'react';
import performanceLogger from '../utils/performanceLogger';
import { useDeviceDetection } from '../hooks/useDeviceDetection';
import './PerformanceDashboard.css';

const PerformanceDashboard = () => {
  console.log('🔧 PerformanceDashboard rendering...');
  
  const [isVisible, setIsVisible] = useState(false);
  const [stats, setStats] = useState(null);
  const [logs, setLogs] = useState([]);
  
  // Используем кэшированный хук
  const { adaptiveSettings, toggleVirtualization } = useDeviceDetection();

  useEffect(() => {
    console.log('🚀 PerformanceDashboard mounted');
    
    // Обновляем статистику каждые 2 секунды
    const interval = setInterval(() => {
      setStats(performanceLogger.getStats());
      setLogs(performanceLogger.logs.slice(-10)); // Последние 10 логов
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const toggleVisibility = () => {
    setIsVisible(!isVisible);
  };

  const clearLogs = () => {
    performanceLogger.logs = [];
    setLogs([]);
  };

  const exportLogs = () => {
    const data = performanceLogger.exportLogs();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mellchat-performance-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const toggleVirtualizationHandler = () => {
    if (!adaptiveSettings || !adaptiveSettings.virtualScroll) {
      console.error('❌ Cannot get adaptive settings');
      return;
    }
    
    const newEnabled = !adaptiveSettings.virtualScroll.enabled;
    toggleVirtualization(newEnabled);
    
    // Перезагружаем страницу для применения изменений
    setTimeout(() => {
      window.location.reload();
    }, 500);
  };

  if (!isVisible) {
    return (
      <div className="performance-dashboard-toggle">
        <button 
          onClick={() => {
            console.log('📊 Performance Dashboard button clicked');
            toggleVisibility();
          }}
          className="performance-toggle-btn"
          title="Показать мониторинг производительности"
        >
          📊
        </button>
        {/* Временная отладочная информация */}
        <div style={{
          position: 'fixed',
          top: '80px',
          right: '20px',
          background: 'rgba(0,0,0,0.8)',
          color: 'white',
          padding: '10px',
          borderRadius: '5px',
          fontSize: '12px',
          zIndex: 10000
        }}>
          Dashboard Button Active
        </div>
      </div>
    );
  }

  return (
    <div className="performance-dashboard">
      <div className="performance-dashboard-header">
        <h3>🚀 MellChat Performance Monitor</h3>
        <div className="performance-controls">
          <button onClick={clearLogs} className="performance-btn">Очистить</button>
          <button onClick={exportLogs} className="performance-btn">Экспорт</button>
          <button onClick={toggleVirtualizationHandler} className="performance-btn virtualization-toggle">
            {adaptiveSettings?.virtualScroll?.enabled ? '🔧 Выключить виртуализацию' : '⚡ Включить виртуализацию'}
          </button>
          <button onClick={toggleVisibility} className="performance-btn">✕</button>
        </div>
      </div>

      <div className="performance-metrics">
        <div className="metric-card">
          <h4>🎯 Виртуализация</h4>
          <div className="metric-value">
            {stats?.metrics.virtualization.enabled ? '✅ Включена' : '❌ Выключена'}
          </div>
          <div className="metric-details">
            Рендер: {stats?.metrics.virtualization.renderedItems || 0}/{stats?.metrics.virtualization.totalItems || 0}
          </div>
          <div className="metric-details">
            Время: {stats?.metrics.virtualization.renderTime || 0}ms
          </div>
        </div>

        <div className="metric-card">
          <h4>📱 Устройство</h4>
          <div className="metric-value">
            {stats?.metrics.deviceDetection.deviceType || 'unknown'}
          </div>
          <div className="metric-details">
            Производительность: {stats?.metrics.deviceDetection.performance || 'unknown'}
          </div>
          <div className="metric-details">
            Вирт. скролл: {stats?.metrics.deviceDetection.adaptiveSettings?.virtualScroll?.enabled ? 'ON' : 'OFF'}
          </div>
        </div>

        <div className="metric-card">
          <h4>💾 Кэш</h4>
          <div className="metric-value">
            Hit Rate: {stats?.metrics.cache.hitRate?.toFixed(1) || 0}%
          </div>
          <div className="metric-details">
            Hits: {stats?.metrics.cache.hits || 0} | Misses: {stats?.metrics.cache.misses || 0}
          </div>
          <div className="metric-details">
            Размер: {stats?.metrics.cache.size || 0}
          </div>
        </div>

        <div className="metric-card">
          <h4>📜 Скролл</h4>
          <div className="metric-value">
            Debounce Rate: {stats?.metrics.scroll.debounceRate?.toFixed(1) || 0}%
          </div>
          <div className="metric-details">
            События: {stats?.metrics.scroll.debouncedEvents || 0}/{stats?.metrics.scroll.totalEvents || 0}
          </div>
        </div>

        <div className="metric-card">
          <h4>🚀 Prefetching</h4>
          <div className="metric-value">
            Страниц: {stats?.metrics.prefetching.prefetchedPages || 0}
          </div>
          <div className="metric-details">
            Cache Hits: {stats?.metrics.prefetching.cacheHits || 0}
          </div>
        </div>

        <div className="metric-card">
          <h4>📈 Общее</h4>
          <div className="metric-value">
            Логов: {stats?.totalLogs || 0}
          </div>
          <div className="metric-details">
            Статус: {stats?.enabled ? '✅ Активен' : '❌ Выключен'}
          </div>
        </div>
      </div>

      <div className="performance-logs">
        <h4>📋 Последние логи</h4>
        <div className="logs-container">
          {logs.map((log, index) => (
            <div key={index} className={`log-entry log-${log.type}`}>
              <span className="log-time">
                {new Date(log.timestamp).toLocaleTimeString()}
              </span>
              <span className="log-type">[{log.type}]</span>
              <span className="log-message">
                {log.type === 'virtualization' && 
                  `${log.data.enabled ? 'ENABLED' : 'DISABLED'} | ${log.data.renderedItems}/${log.data.totalItems} | ${log.data.renderTime}ms`
                }
                {log.type === 'deviceDetection' && 
                  `${log.data.deviceType} | ${log.data.performance} | Virtual: ${log.data.adaptiveSettings?.virtualScroll?.enabled ? 'ON' : 'OFF'}`
                }
                {log.type === 'cache' && 
                  `Hits: ${log.data.hits} | Misses: ${log.data.misses} | Rate: ${log.data.hitRate?.toFixed(1)}%`
                }
                {log.type === 'scroll' && 
                  `Debounced: ${log.data.debouncedEvents}/${log.data.totalEvents} | Rate: ${log.data.debounceRate?.toFixed(1)}%`
                }
                {log.type === 'prefetching' && 
                  `Pages: ${log.data.prefetchedPages} | Cache Hits: ${log.data.cacheHits}`
                }
                {log.type === 'performance' && 
                  `${log.data.component}.${log.data.action}: ${log.data.duration}ms`
                }
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default memo(PerformanceDashboard, (prevProps, nextProps) => {
  // Рендер только если реально изменились важные метрики
  // Поскольку у нас нет props, всегда рендерим
  return false; // Всегда перерендериваем, но с memo это будет реже
});
