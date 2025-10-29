import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import Chart from 'chart.js/auto';

const ChartContainer = ({ 
  title, 
  data, 
  type = 'line', 
  loading = false,
  options = {} 
}) => {
  const canvasRef = useRef(null);
  const chartInstance = useRef(null);
  const [error, setError] = useState(null);

  const defaultOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: '#e5e7eb',
          font: {
            size: 12
          }
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#ffffff',
        bodyColor: '#ffffff',
        borderColor: '#374151',
        borderWidth: 1
      }
    },
    scales: type !== 'doughnut' ? {
      x: {
        grid: {
          color: '#374151'
        },
        ticks: {
          color: '#9ca3af'
        }
      },
      y: {
        grid: {
          color: '#374151'
        },
        ticks: {
          color: '#9ca3af'
        }
      }
    } : {}
  };

  const mergedOptions = { ...defaultOptions, ...options };

  useEffect(() => {
    if (!canvasRef.current || loading || !data) return;

    // Destroy existing chart
    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    try {
      const ctx = canvasRef.current.getContext('2d');
      
      chartInstance.current = new Chart(ctx, {
        type: type,
        data: data,
        options: mergedOptions
      });
      
      setError(null);
    } catch (err) {
      console.error('Chart error:', err);
      setError(err.message);
    }

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [data, type, loading, mergedOptions]);

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="chart-container chart-container--loading"
      >
        <div className="chart-container__header">
          <h3 className="chart-container__title">{title}</h3>
        </div>
        <div className="chart-container__skeleton">
          <div className="chart-container__skeleton-content"></div>
        </div>
      </motion.div>
    );
  }

  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="chart-container chart-container--error"
      >
        <div className="chart-container__header">
          <h3 className="chart-container__title">{title}</h3>
        </div>
        <div className="chart-container__error">
          <p>❌ Error loading chart: {error}</p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="chart-container"
    >
      <div className="chart-container__header">
        <h3 className="chart-container__title">{title}</h3>
        <div className="chart-container__actions">
          <button 
            className="chart-container__action-btn"
            onClick={() => {
              if (chartInstance.current) {
                chartInstance.current.resetZoom();
              }
            }}
            title="Reset zoom"
          >
            🔍
          </button>
        </div>
      </div>
      
      <div className="chart-container__canvas-wrapper">
        <canvas ref={canvasRef}></canvas>
      </div>
    </motion.div>
  );
};

export default ChartContainer;
