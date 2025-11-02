// Email Service - отправка email кодов для авторизации
const logger = require('../utils/logger');
const redisService = require('./redisService');
const nodemailer = require('nodemailer');
const crypto = require('crypto');

class EmailService {
  constructor() {
    this.CODE_LENGTH = 6;
    this.CODE_TTL_SECONDS = 600; // 10 минут (дольше чем SMS)
    this.TOKEN_TTL_SECONDS = 3600; // 1 час для верификации email
    this.RATE_LIMIT_WINDOW = 3600; // 1 час
    this.MAX_EMAILS_PER_HOUR = 5; // Больше чем SMS (email дешевле)
    this.RETRY_DELAY_SECONDS = 120; // 2 минуты между повторными отправками
    
    // Настройки email провайдера
    this.provider = process.env.EMAIL_PROVIDER || 'mock'; // 'smtp', 'sendgrid', 'mailgun', 'mock'
    
    // SMTP настройки (для Gmail, собственного SMTP и т.д.)
    this.smtpHost = process.env.SMTP_HOST;
    this.smtpPort = parseInt(process.env.SMTP_PORT || '587');
    this.smtpSecure = process.env.SMTP_SECURE === 'true'; // true для 465, false для других
    this.smtpUser = process.env.SMTP_USER;
    this.smtpPassword = process.env.SMTP_PASSWORD;
    this.smtpFrom = process.env.SMTP_FROM || this.smtpUser;
    
    // SendGrid (бесплатно до 100 писем/день)
    this.sendgridApiKey = process.env.SENDGRID_API_KEY;
    
    // Mailgun (бесплатно до 5000 писем/месяц)
    this.mailgunApiKey = process.env.MAILGUN_API_KEY;
    this.mailgunDomain = process.env.MAILGUN_DOMAIN;
    
    // Frontend URL для ссылок подтверждения
    this.frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    
    this.transporter = null;
  }

  /**
   * Инициализация транспортера email
   */
  async getTransporter() {
    if (this.transporter) return this.transporter;
    
    try {
      switch (this.provider) {
        case 'sendgrid':
          // SendGrid использует nodemailer-sendgrid-transport
          // Для простоты используем прямой API
          return null;
        
        case 'mailgun':
          // Mailgun также через API
          return null;
        
        case 'smtp':
        default:
          // Обычный SMTP (Gmail, собственный сервер и т.д.)
          if (!this.smtpHost || !this.smtpUser || !this.smtpPassword) {
            logger.warn('SMTP not configured, using mock mode');
            return null;
          }
          
          this.transporter = nodemailer.createTransport({
            host: this.smtpHost,
            port: this.smtpPort,
            secure: this.smtpSecure, // true для 465, false для других портов
            auth: {
              user: this.smtpUser,
              pass: this.smtpPassword
            }
          });
          
          // Проверяем соединение
          await this.transporter.verify();
          logger.info('SMTP transporter verified');
          
          return this.transporter;
      }
    } catch (error) {
      logger.error('Failed to create email transporter:', error);
      return null;
    }
  }

  /**
   * Генерация 6-значного кода
   */
  generateCode() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * Генерация токена для верификации email
   */
  generateToken() {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Валидация email адреса
   * @param {string} email - Email адрес
   * @returns {boolean} - Валидность
   */
  validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email) && email.length <= 255;
  }

  /**
   * Проверка rate limit для email
   * @param {string} email - Email адрес
   * @returns {Promise<{allowed: boolean, retryAfter?: number}>}
   */
  async checkRateLimit(email) {
    const normalized = email.toLowerCase().trim();
    const rateLimitKey = `email_rate_limit:${normalized}`;
    const lastSentKey = `email_last_sent:${normalized}`;
    
    const countStr = await redisService.get(rateLimitKey);
    const count = countStr ? parseInt(countStr, 10) : 0;
    
    if (count >= this.MAX_EMAILS_PER_HOUR) {
      const lastSentStr = await redisService.get(lastSentKey);
      if (lastSentStr) {
        const lastSent = parseInt(lastSentStr, 10);
        const elapsed = Math.floor((Date.now() - lastSent) / 1000);
        const retryAfter = this.RATE_LIMIT_WINDOW - elapsed;
        
        if (retryAfter > 0) {
          return {
            allowed: false,
            retryAfter: retryAfter
          };
        }
      }
    }
    
    return { allowed: true };
  }

  /**
   * Обновление rate limit счетчика
   * @param {string} email - Email адрес
   */
  async updateRateLimit(email) {
    const normalized = email.toLowerCase().trim();
    const rateLimitKey = `email_rate_limit:${normalized}`;
    const lastSentKey = `email_last_sent:${normalized}`;
    
    const countStr = await redisService.get(rateLimitKey);
    const count = countStr ? parseInt(countStr, 10) : 0;
    await redisService.setex(rateLimitKey, this.RATE_LIMIT_WINDOW, (count + 1).toString());
    await redisService.setex(lastSentKey, this.RATE_LIMIT_WINDOW, Date.now().toString());
  }

  /**
   * Отправка email через SMTP
   */
  async sendViaSMTP(to, subject, html) {
    const transporter = await this.getTransporter();
    if (!transporter) {
      // Если SMTP не настроен, но провайдер установлен как smtp - возвращаем ошибку
      if (this.provider === 'smtp') {
        logger.error('SMTP transporter not available. Check SMTP configuration:', {
          smtpHost: this.smtpHost ? 'configured' : 'missing',
          smtpUser: this.smtpUser ? 'configured' : 'missing',
          smtpPassword: this.smtpPassword ? 'configured' : 'missing'
        });
        throw new Error('SMTP не настроен. Проверьте переменные окружения SMTP_HOST, SMTP_USER, SMTP_PASSWORD. Или установите EMAIL_PROVIDER=mock для разработки.');
      }
      // Если провайдер не smtp, но вызвали sendViaSMTP - это странно
      throw new Error('SMTP transporter not available');
    }

    try {
      await transporter.sendMail({
        from: this.smtpFrom,
        to: to,
        subject: subject,
        html: html
      });
      return true;
    } catch (error) {
      logger.error('SMTP sendMail error:', { error: error.message, to });
      throw error;
    }
  }

  /**
   * Отправка email через SendGrid API
   */
  async sendViaSendGrid(to, subject, html) {
    if (!this.sendgridApiKey) {
      throw new Error('SendGrid API key not configured');
    }

    const fetch = require('node-fetch');
    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.sendgridApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        personalizations: [{
          to: [{ email: to }]
        }],
        from: { email: this.smtpFrom || 'noreply@mellchat.app' },
        subject: subject,
        content: [{
          type: 'text/html',
          value: html
        }]
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`SendGrid error: ${error}`);
    }

    return true;
  }

  /**
   * Отправка email через Mailgun API
   */
  async sendViaMailgun(to, subject, html) {
    if (!this.mailgunApiKey || !this.mailgunDomain) {
      throw new Error('Mailgun credentials not configured');
    }

    const fetch = require('node-fetch');
    const auth = Buffer.from(`api:${this.mailgunApiKey}`).toString('base64');
    
    const formData = new URLSearchParams();
    formData.append('from', this.smtpFrom || `noreply@${this.mailgunDomain}`);
    formData.append('to', to);
    formData.append('subject', subject);
    formData.append('html', html);

    const response = await fetch(`https://api.mailgun.net/v3/${this.mailgunDomain}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`
      },
      body: formData
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Mailgun error: ${error}`);
    }

    return true;
  }

  /**
   * Отправка email кода
   * @param {string} email - Email адрес
   * @returns {Promise<{success: boolean, retryAfter?: number, error?: string}>}
   */
  async sendCode(email) {
    try {
      logger.info('EmailService.sendCode called:', { email, provider: this.provider });
      
      if (!email || typeof email !== 'string') {
        logger.warn('EmailService.sendCode: invalid email input', { email, type: typeof email });
        return {
          success: false,
          error: 'Invalid email format'
        };
      }
      
      const normalized = email.toLowerCase().trim();
      logger.info('EmailService.sendCode: normalized email', { normalized });
      
      // Валидация
      if (!this.validateEmail(normalized)) {
        logger.warn('EmailService.sendCode: email validation failed', { normalized });
        return {
          success: false,
          error: 'Invalid email format'
        };
      }

      // Проверка rate limit
      let rateLimitCheck;
      try {
        rateLimitCheck = await this.checkRateLimit(normalized);
      } catch (error) {
        logger.error('EmailService.sendCode: Redis error in checkRateLimit', { error: error.message });
        // Продолжаем работу, если Redis недоступен (для разработки)
      }
      
      if (rateLimitCheck && !rateLimitCheck.allowed) {
        return {
          success: false,
          error: 'Rate limit exceeded',
          retryAfter: rateLimitCheck.retryAfter
        };
      }

      // Проверка времени последней отправки
      let lastSentStr = null;
      try {
        const lastSentKey = `email_last_sent:${normalized}`;
        lastSentStr = await redisService.get(lastSentKey);
      } catch (error) {
        logger.warn('EmailService.sendCode: Redis error getting last sent', { error: error.message });
      }
      
      if (lastSentStr) {
        const lastSent = parseInt(lastSentStr, 10);
        const elapsed = Math.floor((Date.now() - lastSent) / 1000);
        if (elapsed < this.RETRY_DELAY_SECONDS) {
          return {
            success: false,
            error: 'Please wait before requesting another code',
            retryAfter: this.RETRY_DELAY_SECONDS - elapsed
          };
        }
      }

      // Генерация кода
      const code = this.generateCode();
      
      // Сохранение кода в Redis
      const codeKey = `email_code:${normalized}`;
      const codeData = JSON.stringify({
        code: code,
        expiresAt: Date.now() + (this.CODE_TTL_SECONDS * 1000),
        attempts: 0
      });
      
      try {
        await redisService.setex(codeKey, this.CODE_TTL_SECONDS, codeData);
      } catch (error) {
        logger.error('EmailService.sendCode: Redis error saving code', { error: error.message });
        // В режиме разработки продолжаем, даже если Redis недоступен
        if (this.provider !== 'mock') {
          return {
            success: false,
            error: 'Service temporarily unavailable'
          };
        }
      }
      
      // Отправка email
      const subject = 'Ваш код подтверждения MellChat';
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .code { font-size: 32px; font-weight: bold; text-align: center; letter-spacing: 8px; color: #2563eb; padding: 20px; background: #f3f4f6; border-radius: 8px; margin: 20px 0; }
            .footer { margin-top: 30px; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>Подтверждение входа в MellChat</h1>
            <p>Ваш код подтверждения:</p>
            <div class="code">${code}</div>
            <p>Этот код действителен в течение ${this.CODE_TTL_SECONDS / 60} минут.</p>
            <p>Если вы не запрашивали этот код, просто проигнорируйте это письмо.</p>
            <div class="footer">
              <p>MellChat - Агрегатор чатов для стримеров</p>
            </div>
          </div>
        </body>
        </html>
      `;

      let sent = false;
      switch (this.provider) {
        case 'sendgrid':
          sent = await this.sendViaSendGrid(normalized, subject, html);
          break;
        case 'mailgun':
          sent = await this.sendViaMailgun(normalized, subject, html);
          break;
        case 'smtp':
          try {
            sent = await this.sendViaSMTP(normalized, subject, html);
          } catch (error) {
            logger.error('Failed to send via SMTP, falling back to mock:', { error: error.message });
            // Если SMTP не работает, логируем код в консоль (режим разработки)
            logger.info(`[MOCK EMAIL] SMTP недоступен. Код для ${normalized}: ${code}`);
            sent = true; // В режиме разработки продолжаем работу
          }
          break;
        case 'mock':
        default:
          // Режим разработки - только логируем
          logger.info(`[MOCK EMAIL] Код для ${normalized}: ${code}`);
          sent = true;
      }

      if (!sent) {
        await redisService.del(codeKey);
        return {
          success: false,
          error: 'Failed to send email'
        };
      }

      // Обновление rate limit
      try {
        await this.updateRateLimit(normalized);
      } catch (error) {
        logger.warn('EmailService.sendCode: Redis error updating rate limit', { error: error.message });
        // Продолжаем работу, даже если не удалось обновить rate limit
      }

      logger.info(`Email код отправлен на ${normalized}`);
      
      return {
        success: true,
        retryAfter: this.RETRY_DELAY_SECONDS
      };
    } catch (error) {
      logger.error('Ошибка отправки email кода:', { error: error.message, email });
      return {
        success: false,
        error: error.message || 'Internal error'
      };
    }
  }

  /**
   * Проверка email кода
   * @param {string} email - Email адрес
   * @param {string} code - Код для проверки
   * @returns {Promise<{valid: boolean, error?: string}>}
   */
  async verifyCode(email, code) {
    try {
      const normalized = email.toLowerCase().trim();
      const codeKey = `email_code:${normalized}`;
      
      const codeDataStr = await redisService.get(codeKey);
      if (!codeDataStr) {
        return {
          valid: false,
          error: 'Code not found or expired'
        };
      }

      const codeData = JSON.parse(codeDataStr);
      
      // Проверка количества попыток (максимум 5)
      if (codeData.attempts >= 5) {
        await redisService.del(codeKey);
        return {
          valid: false,
          error: 'Too many attempts. Code expired'
        };
      }

      // Проверка времени жизни
      if (Date.now() > codeData.expiresAt) {
        await redisService.del(codeKey);
        return {
          valid: false,
          error: 'Code expired'
        };
      }

      // Проверка кода
      if (codeData.code !== code) {
        codeData.attempts += 1;
        await redisService.setex(codeKey, this.CODE_TTL_SECONDS, JSON.stringify(codeData));
        
        return {
          valid: false,
          error: 'Invalid code',
          attemptsLeft: 5 - codeData.attempts
        };
      }

      // Код верный - удаляем из Redis
      await redisService.del(codeKey);
      
      logger.info(`Email код подтвержден для ${normalized}`);
      
      return {
        valid: true
      };
    } catch (error) {
      logger.error('Ошибка проверки email кода:', { error: error.message, email });
      return {
        valid: false,
        error: error.message || 'Internal error'
      };
    }
  }

  /**
   * Отправка токена для верификации email адреса
   * @param {string} userId - ID пользователя
   * @param {string} email - Email адрес
   * @returns {Promise<{success: boolean, token?: string, error?: string}>}
   */
  async sendVerificationToken(userId, email) {
    try {
      const normalized = email.toLowerCase().trim();
      
      if (!this.validateEmail(normalized)) {
        return {
          success: false,
          error: 'Invalid email format'
        };
      }

      // Генерация токена
      const token = this.generateToken();
      
      // Сохранение токена в БД (через databaseService)
      const databaseService = require('./databaseService');
      const expiresAt = new Date(Date.now() + (this.TOKEN_TTL_SECONDS * 1000));
      
      await databaseService.query(
        `INSERT INTO email_verifications (user_id, email, token, expires_at, verified)
         VALUES ($1, $2, $3, $4, false)
         ON CONFLICT (token) DO UPDATE SET expires_at = $4, verified = false`,
        [userId, normalized, token, expiresAt]
      );

      // Отправка email
      const verificationUrl = `${this.frontendUrl}/auth/verify-email?token=${token}`;
      const subject = 'Подтвердите ваш email адрес в MellChat';
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .button { display: inline-block; padding: 12px 24px; background: #2563eb; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
            .footer { margin-top: 30px; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>Подтвердите ваш email</h1>
            <p>Нажмите на кнопку ниже, чтобы подтвердить ваш email адрес:</p>
            <a href="${verificationUrl}" class="button">Подтвердить email</a>
            <p>Или скопируйте ссылку:</p>
            <p style="word-break: break-all; color: #666;">${verificationUrl}</p>
            <p>Эта ссылка действительна в течение 1 часа.</p>
            <div class="footer">
              <p>MellChat - Агрегатор чатов для стримеров</p>
            </div>
          </div>
        </body>
        </html>
      `;

      let sent = false;
      switch (this.provider) {
        case 'sendgrid':
          sent = await this.sendViaSendGrid(normalized, subject, html);
          break;
        case 'mailgun':
          sent = await this.sendViaMailgun(normalized, subject, html);
          break;
        case 'smtp':
          sent = await this.sendViaSMTP(normalized, subject, html);
          break;
        case 'mock':
        default:
          logger.info(`[MOCK EMAIL] Verification token для ${normalized}: ${token}`);
          sent = true;
      }

      if (!sent) {
        return {
          success: false,
          error: 'Failed to send verification email'
        };
      }

      return {
        success: true,
        token: token
      };
    } catch (error) {
      logger.error('Ошибка отправки токена верификации:', { error: error.message, email });
      return {
        success: false,
        error: error.message || 'Internal error'
      };
    }
  }
}

module.exports = new EmailService();

