const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
const path = require('path');

// Создаем директорию для логов
const logDir = path.join(__dirname, '../../logs');

// Формат для логов
const logFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss.SSS'
  }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.prettyPrint()
);

// Создаем Winston logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  defaultMeta: { 
    service: 'mellchat-api',
    version: process.env.npm_package_version || '1.0.0'
  },
  transports: [
    // Консольный вывод
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple(),
        winston.format.printf(({ timestamp, level, message, ...meta }) => {
          const metaStr = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : '';
          return `${timestamp} [${level}] ${message} ${metaStr}`;
        })
      )
    }),
    
    // Файл для всех логов
    new DailyRotateFile({
      filename: path.join(logDir, 'mellchat-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '14d',
      zippedArchive: true
    }),
    
    // Отдельный файл для ошибок
    new DailyRotateFile({
      filename: path.join(logDir, 'error-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      level: 'error',
      maxSize: '20m',
      maxFiles: '30d',
      zippedArchive: true
    }),
    
    // Файл для производительности
    new DailyRotateFile({
      filename: path.join(logDir, 'performance-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      level: 'info',
      maxSize: '20m',
      maxFiles: '7d',
      zippedArchive: true,
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      )
    })
  ],
  
  // Обработка исключений
  exceptionHandlers: [
    new winston.transports.File({ 
      filename: path.join(logDir, 'exceptions.log'),
      maxSize: '20m',
      maxFiles: 5
    })
  ],
  
  // Обработка отклоненных промисов
  rejectionHandlers: [
    new winston.transports.File({ 
      filename: path.join(logDir, 'rejections.log'),
      maxSize: '20m',
      maxFiles: 5
    })
  ]
});

// Добавляем методы для удобства
logger.performance = (message, data = {}) => {
  logger.info(message, { ...data, type: 'performance' });
};

logger.security = (message, data = {}) => {
  logger.warn(message, { ...data, type: 'security' });
};

logger.database = (message, data = {}) => {
  logger.info(message, { ...data, type: 'database' });
};

logger.websocket = (message, data = {}) => {
  logger.info(message, { ...data, type: 'websocket' });
};

module.exports = logger;
