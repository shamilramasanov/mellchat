// Auth Service - сервис авторизации пользователей
const logger = require('../utils/logger');

logger.info('✅ AuthService loading');

const databaseService = require('./databaseService');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

logger.info('✅ AuthService loaded');

// In-memory хранилище для Google OAuth (можно перевести в БД позже)
const googleUsers = new Map();

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = '7d'; // 7 дней

const authService = {
  /**
   * Генерация JWT токена
   * @param {Object} user - Объект пользователя
   * @returns {string} - JWT токен
   */
  generateToken(user) {
    const payload = {
      userId: user.id,
      email: user.email
    };
    
    return jwt.sign(payload, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN
    });
  },

  /**
   * Верификация JWT токена
   * @param {string} token - JWT токен
   * @returns {Object|null} - Payload токена или null
   */
  verifyToken(token) {
    try {
      return jwt.verify(token, JWT_SECRET);
    } catch (error) {
      logger.error('Token verification failed:', error.message);
      return null;
    }
  },

  /**
   * Поиск или создание пользователя по Google OAuth
   * @param {Object} profile - Профиль Google
   * @param {string} provider - Провайдер OAuth
   * @returns {Promise<Object>} - Пользователь
   */
  async findOrCreateUser(profile, provider) {
    const email = profile.emails?.[0]?.value || `${profile.id}@${provider}.com`;
    
    try {
      // Сначала проверяем в БД
      let user = await this.findUserByEmail(email);
      
      if (user) {
        // Обновляем google_id если нужно
        if (!user.googleId && profile.id) {
          await this.updateUser(user.id, { google_id: profile.id });
          user.googleId = profile.id;
        }
        logger.info(`User found in DB: ${email}`);
        return user;
      }
      
      // Если нет в БД - создаем в БД (НЕ передаем id - пусть БД создаст UUID)
      const newUser = await this.createUser({
        email: email,
        email_verified: true, // Используем snake_case для БД
        name: profile.displayName || profile.username || 'User',
        google_id: profile.id, // Используем snake_case для БД
        avatar_url: profile.photos?.[0]?.value // Используем snake_case для БД
        // НЕ передаем id - createUser создаст UUID
      });
      
      logger.info(`User created in DB: ${email} (${newUser.id}), google_id: ${profile.id}`);
      return newUser;
    } catch (error) {
      logger.error('Error in findOrCreateUser:', error);
      // Fallback на память если БД недоступна
      const existingUser = Array.from(googleUsers.values()).find(u => u.email === email);
      if (existingUser) {
        return existingUser;
      }
      
      const newUser = {
        id: profile.id,
        email: email,
        name: profile.displayName || profile.username || 'User',
        provider: provider,
        createdAt: new Date()
      };
      
      googleUsers.set(profile.id, newUser);
      logger.warn(`User created in memory (fallback): ${email}`);
      return newUser;
    }
  },

  /**
   * Получить пользователя по ID (из памяти для Google OAuth)
   */
  getUserById(id) {
    return googleUsers.get(id) || null;
  },

  /**
   * Получить пользователя по email (из памяти для Google OAuth)
   */
  getUserByEmail(email) {
    return Array.from(googleUsers.values()).find(u => u.email === email) || null;
  },

  // ===== Новые методы для работы с БД (app_users) =====


  /**
   * Найти пользователя по email
   * @param {string} email - Email
   * @returns {Promise<Object|null>}
   */
  async findUserByEmail(email) {
    try {
      const query = `
        SELECT 
          id, phone, phone_verified, email, email_verified,
          password_hash, name, avatar_url, google_id,
          created_at, updated_at, last_login_at
        FROM app_users
        WHERE email = $1
        LIMIT 1
      `;
      
      const result = await databaseService.query(query, [email]);
      
      if (result.rows && result.rows.length > 0) {
        return this.mapUserFromDB(result.rows[0]);
      }
      
      return null;
    } catch (error) {
      logger.error('Error finding user by email:', error);
      return null;
    }
  },

  /**
   * Найти пользователя по Google ID
   * @param {string} googleId - Google ID
   * @returns {Promise<Object|null>}
   */
  async findUserByGoogleId(googleId) {
    try {
      const query = `
        SELECT 
          id, phone, phone_verified, email, email_verified,
          password_hash, name, avatar_url, google_id,
          created_at, updated_at, last_login_at
        FROM app_users
        WHERE google_id = $1
        LIMIT 1
      `;
      
      const result = await databaseService.query(query, [googleId]);
      
      if (result.rows && result.rows.length > 0) {
        return this.mapUserFromDB(result.rows[0]);
      }
      
      return null;
    } catch (error) {
      logger.error('Error finding user by Google ID:', error);
      return null;
    }
  },

  /**
   * Получить пользователя по ID из БД
   * @param {string} userId - ID пользователя
   * @returns {Promise<Object|null>}
   */
  async findUserById(userId) {
    try {
      // Сначала проверяем в БД
      const query = `
        SELECT 
          id, phone, phone_verified, email, email_verified,
          password_hash, name, avatar_url, google_id,
          created_at, updated_at, last_login_at
        FROM app_users
        WHERE id = $1 OR google_id = $1
        LIMIT 1
      `;
      
      const result = await databaseService.query(query, [userId]);
      
      if (result.rows && result.rows.length > 0) {
        return this.mapUserFromDB(result.rows[0]);
      }
      
      // Если не найден в БД, проверяем память (для старых Google OAuth пользователей)
      const memoryUser = googleUsers.get(userId);
      if (memoryUser) {
        logger.warn(`User found in memory (should migrate to DB): ${memoryUser.email}`);
        return memoryUser;
      }
      
      return null;
    } catch (error) {
      logger.error('Error finding user by ID:', error);
      // Fallback на память
      return googleUsers.get(userId) || null;
    }
  },

  /**
   * Создать нового пользователя
   * @param {Object} userData - Данные пользователя
   * @returns {Promise<Object>} - Созданный пользователь
   */
  async createUser(userData) {
    try {
      const userId = userData.id || uuidv4();
      const now = new Date();
      
      const query = `
        INSERT INTO app_users (
          id, phone, phone_verified, email, email_verified,
          password_hash, name, avatar_url, google_id,
          created_at, updated_at, last_login_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        RETURNING *
      `;
      
      const result = await databaseService.query(query, [
        userId,
        userData.phone || null,
        userData.phone_verified || userData.phoneVerified || false,
        userData.email || null,
        userData.email_verified || userData.emailVerified || false,
        userData.password_hash || userData.passwordHash || null,
        userData.name || null,
        userData.avatar_url || userData.avatarUrl || null,
        userData.google_id || userData.googleId || null,
        now,
        now,
        now
      ]);
      
      if (result.rows && result.rows.length > 0) {
        const user = this.mapUserFromDB(result.rows[0]);
        logger.info(`User created in DB: ${userId} (${userData.phone || userData.email})`);
        return user;
      }
      
      throw new Error('Failed to create user');
    } catch (error) {
      logger.error('Error creating user:', error);
      throw error;
    }
  },

  /**
   * Обновить пользователя
   * @param {string} userId - ID пользователя
   * @param {Object} updates - Обновления
   * @returns {Promise<Object>} - Обновленный пользователь
   */
  async updateUser(userId, updates) {
    try {
      const setParts = [];
      const values = [];
      let paramIndex = 1;
      
      if (updates.phone !== undefined) {
        setParts.push(`phone = $${paramIndex++}`);
        values.push(updates.phone);
      }
      if (updates.phone_verified !== undefined) {
        setParts.push(`phone_verified = $${paramIndex++}`);
        values.push(updates.phone_verified);
      }
      if (updates.email !== undefined) {
        setParts.push(`email = $${paramIndex++}`);
        values.push(updates.email);
      }
      if (updates.email_verified !== undefined) {
        setParts.push(`email_verified = $${paramIndex++}`);
        values.push(updates.email_verified);
      }
      if (updates.password_hash !== undefined) {
        setParts.push(`password_hash = $${paramIndex++}`);
        values.push(updates.password_hash);
      }
      if (updates.name !== undefined) {
        setParts.push(`name = $${paramIndex++}`);
        values.push(updates.name);
      }
      if (updates.avatar_url !== undefined) {
        setParts.push(`avatar_url = $${paramIndex++}`);
        values.push(updates.avatar_url);
      }
      if (updates.google_id !== undefined) {
        setParts.push(`google_id = $${paramIndex++}`);
        values.push(updates.google_id);
      }
      if (updates.last_login_at !== undefined) {
        setParts.push(`last_login_at = $${paramIndex++}`);
        values.push(updates.last_login_at);
      }
      
      // Всегда обновляем updated_at
      setParts.push(`updated_at = NOW()`);
      
      if (setParts.length === 0) {
        // Нет обновлений
        return await this.findUserById(userId);
      }
      
      values.push(userId);
      const query = `
        UPDATE app_users
        SET ${setParts.join(', ')}
        WHERE id = $${paramIndex}
        RETURNING *
      `;
      
      const result = await databaseService.query(query, values);
      
      if (result.rows && result.rows.length > 0) {
        return this.mapUserFromDB(result.rows[0]);
      }
      
      return null;
    } catch (error) {
      logger.error('Error updating user:', error);
      throw error;
    }
  },

  /**
   * Поиск или создание пользователя по email
   * @param {string} email - Email адрес
   * @returns {Promise<Object>} - Пользователь
   */
  async findOrCreateByEmail(email) {
    const normalized = email.toLowerCase().trim();
    let user = await this.findUserByEmail(normalized);
    
    if (!user) {
      // Создаем нового пользователя
      user = await this.createUser({
        email: normalized,
        email_verified: true
      });
    } else {
      // Обновляем last_login_at
      await this.updateUser(user.id, {
        last_login_at: new Date()
      });
    }
    
    return user;
  },

  /**
   * Хэширование пароля
   * @param {string} password - Пароль
   * @returns {Promise<string>} - Хэш пароля
   */
  async hashPassword(password) {
    const saltRounds = 10;
    return await bcrypt.hash(password, saltRounds);
  },

  /**
   * Проверка пароля
   * @param {string} password - Пароль
   * @param {string} hash - Хэш пароля
   * @returns {Promise<boolean>} - Совпадение
   */
  async comparePassword(password, hash) {
    return await bcrypt.compare(password, hash);
  },

  /**
   * Преобразование пользователя из БД в формат для API
   * @param {Object} dbUser - Пользователь из БД
   * @returns {Object} - Пользователь для API
   */
  mapUserFromDB(dbUser) {
    return {
      id: dbUser.id,
      phone: dbUser.phone,
      phoneVerified: dbUser.phone_verified,
      email: dbUser.email,
      emailVerified: dbUser.email_verified,
      hasPassword: !!dbUser.password_hash,
      name: dbUser.name,
      avatarUrl: dbUser.avatar_url,
      googleId: dbUser.google_id,
      createdAt: dbUser.created_at,
      updatedAt: dbUser.updated_at,
      lastLoginAt: dbUser.last_login_at
    };
  }
};

module.exports = authService;
