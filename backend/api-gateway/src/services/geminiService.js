const logger = require('../utils/logger');

// Polyfill for fetch in Node.js
if (typeof fetch === 'undefined') {
  global.fetch = require('node-fetch');
}

class GeminiService {
  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY;
    this.baseUrl = 'https://generativelanguage.googleapis.com/v1beta';
    
    // Статистика запросов для метрик
    this.requestStats = {
      totalRequests: 0,
      todayRequests: 0,
      responseTimes: [],
      lastResetDate: new Date().toDateString(),
      errors: 0,
      successes: 0
    };
    
    // Сбрасываем счетчик запросов за день при изменении даты
    setInterval(() => {
      const currentDate = new Date().toDateString();
      if (this.requestStats.lastResetDate !== currentDate) {
        this.requestStats.todayRequests = 0;
        this.requestStats.lastResetDate = currentDate;
      }
    }, 60000); // Проверяем каждую минуту
    
    if (!this.apiKey) {
      logger.warn('⚠️ GEMINI_API_KEY не установлен. Gemini функции будут недоступны.');
    } else {
      logger.info('✅ Gemini API key configured');
    }
  }
  
  /**
   * Получение статистики запросов
   */
  getRequestStats() {
    const avgResponseTime = this.requestStats.responseTimes.length > 0
      ? (this.requestStats.responseTimes.reduce((a, b) => a + b, 0) / this.requestStats.responseTimes.length).toFixed(1)
      : 0;
    
    const accuracyRate = this.requestStats.totalRequests > 0
      ? ((this.requestStats.successes / this.requestStats.totalRequests) * 100).toFixed(1)
      : 100;
    
    // Оставляем только последние 100 значений времени отклика
    if (this.requestStats.responseTimes.length > 100) {
      this.requestStats.responseTimes = this.requestStats.responseTimes.slice(-100);
    }
    
    return {
      totalRequests: this.requestStats.totalRequests,
      todayRequests: this.requestStats.todayRequests,
      avgResponseTime: avgResponseTime > 0 ? `${avgResponseTime}s` : 'N/A',
      accuracyRate: `${accuracyRate}%`,
      errors: this.requestStats.errors,
      successes: this.requestStats.successes
    };
  }
  
  /**
   * Регистрация запроса для статистики
   */
  recordRequest(responseTime, success = true) {
    this.requestStats.totalRequests++;
    
    // Проверяем, нужно ли сбросить счетчик дня
    const currentDate = new Date().toDateString();
    if (this.requestStats.lastResetDate !== currentDate) {
      this.requestStats.todayRequests = 0;
      this.requestStats.lastResetDate = currentDate;
    }
    
    this.requestStats.todayRequests++;
    
    if (success) {
      this.requestStats.successes++;
      if (responseTime) {
        this.requestStats.responseTimes.push(responseTime);
      }
    } else {
      this.requestStats.errors++;
    }
  }

  /**
   * Проверка доступности API
   */
  isAvailable() {
    return !!this.apiKey;
  }

  /**
   * Получение списка доступных моделей
   */
  async getAvailableModels() {
    if (!this.isAvailable()) {
      throw new Error('Gemini API key not configured');
    }

    try {
      const url = `${this.baseUrl}/models?key=${this.apiKey}`;
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Gemini API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
      }

      const data = await response.json();
      logger.info('Available Gemini models:', data.models?.length || 0);
      
      return data.models || [];
    } catch (error) {
      logger.error('Failed to get Gemini models:', error);
      throw error;
    }
  }

  /**
   * Отправка запроса к Gemini API
   */
  async makeRequest(model, prompt, context = [], options = {}) {
    if (!this.isAvailable()) {
      throw new Error('Gemini API key not configured');
    }

    try {
      const url = `${this.baseUrl}/models/${model}:generateContent?key=${this.apiKey}`;
      
      const requestBody = {
        contents: [
          ...context.map(msg => ({
            role: msg.role === 'user' ? 'user' : 'model',
            parts: [{ text: msg.content }]
          })),
          {
            parts: [{ text: prompt }]
          }
        ],
        ...options
      };

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 50000); // 50 секунд таймаут
      
      const startTime = Date.now();
      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        const responseTime = (Date.now() - startTime) / 1000; // В секундах

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          this.recordRequest(responseTime, false);
          throw new Error(`Gemini API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
        }

        const data = await response.json();
        
        if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
          this.recordRequest(responseTime, false);
          throw new Error('Invalid response from Gemini API');
        }

        // Регистрируем успешный запрос
        this.recordRequest(responseTime, true);
        
        return data.candidates[0].content.parts[0].text;
      } catch (error) {
        clearTimeout(timeoutId);
        const responseTime = (Date.now() - startTime) / 1000;
        
        if (error.name === 'AbortError') {
          this.recordRequest(responseTime, false);
          logger.error('Gemini API request timeout (50s)');
          throw new Error('AI запрос превысил время ожидания. Попробуйте упростить запрос.');
        }
        
        // Регистрируем ошибку только если это не был AbortError (уже зарегистрирован)
        if (error.name !== 'AbortError') {
          this.recordRequest(responseTime, false);
        }
        
        logger.error('Gemini API request failed:', error);
        throw error;
      }
    } catch (error) {
      logger.error('Gemini API request failed:', error);
      throw error;
    }
  }

  /**
   * Анализ контента сообщений
   */
  async analyzeContent(messages) {
    const prompt = `Проанализируй следующие сообщения чата и предоставь анализ:

1. Общие тренды настроений (sentiment trends)
2. Потенциальные паттерны спама
3. Аномалии в поведении пользователей
4. Проблемы качества контента
5. Рекомендации по улучшению

Сообщения (первые 50 для анализа):
${JSON.stringify(messages.slice(0, 50), null, 2)}

Верни ответ в формате JSON:
{
  "sentiment": "positive/neutral/negative",
  "spamPatterns": ["pattern1", "pattern2"],
  "anomalies": ["anomaly1", "anomaly2"],
  "contentIssues": ["issue1", "issue2"],
  "recommendations": ["rec1", "rec2"]
}`;

    try {
      const response = await this.makeRequest('gemini-2.5-flash', prompt);
      
      // Пытаемся распарсить JSON из ответа
      try {
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          return JSON.parse(jsonMatch[0]);
        }
      } catch (e) {
        // Если не получилось распарсить JSON, возвращаем текстовый ответ
        logger.warn('Failed to parse JSON from Gemini response, returning text');
      }
      
      return {
        analysis: response,
        sentiment: 'neutral',
        spamPatterns: [],
        anomalies: [],
        contentIssues: [],
        recommendations: []
      };
    } catch (error) {
      logger.error('Failed to analyze content with Gemini:', error);
      throw error;
    }
  }

  /**
   * Генерация отчета
   */
  async generateReport(metrics, timeRange = '24h') {
    const prompt = `Сгенерируй аналитический отчет для системы MellChat на основе следующих метрик:

Временной диапазон: ${timeRange}
Метрики:
${JSON.stringify(metrics, null, 2)}

Включи в отчет:
1. Ключевые метрики и их интерпретацию
2. Основные тренды
3. Выявленные проблемы (если есть)
4. Рекомендации по улучшению

Формат отчета должен быть структурированным и читаемым.`;

    try {
      const response = await this.makeRequest('gemini-2.5-flash', prompt);
      return {
        report: response,
        generatedAt: new Date().toISOString(),
        timeRange
      };
    } catch (error) {
      logger.error('Failed to generate report with Gemini:', error);
      throw error;
    }
  }

  /**
   * Оптимизация системы
   */
  async optimizeSystem(systemMetrics) {
    const prompt = `Проанализируй метрики системы и предложи оптимизации:

${JSON.stringify(systemMetrics, null, 2)}

Верни рекомендации по оптимизации в формате JSON:
{
  "recommendations": [
    {
      "title": "Название",
      "description": "Описание",
      "priority": "high/medium/low",
      "impact": "Ожидаемое улучшение"
    }
  ],
  "summary": "Краткое резюме"
}`;

    try {
      const response = await this.makeRequest('gemini-2.5-flash', prompt);
      
      try {
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          return JSON.parse(jsonMatch[0]);
        }
      } catch (e) {
        logger.warn('Failed to parse JSON from Gemini optimization response');
      }
      
      return {
        recommendations: [],
        summary: response
      };
    } catch (error) {
      logger.error('Failed to optimize system with Gemini:', error);
      throw error;
    }
  }

  /**
   * Помощь в troubleshooting
   */
  async troubleshootIssue(errorLogs, systemState) {
    const prompt = `Помоги диагностировать проблему в системе MellChat:

Логи ошибок:
${errorLogs.length > 10 ? errorLogs.slice(0, 10).join('\n') : errorLogs.join('\n')}

Состояние системы:
${JSON.stringify(systemState, null, 2)}

Проанализируй ошибки и предложи:
1. Вероятную причину проблемы
2. Шаги для диагностики
3. Возможные решения
4. Профилактические меры`;

    try {
      const response = await this.makeRequest('gemini-2.5-flash', prompt);
      return {
        diagnosis: response,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logger.error('Failed to troubleshoot with Gemini:', error);
      throw error;
    }
  }

  /**
   * Автоматическая настройка глобальных правил на основе анализа данных
   * @param {Object} metrics - Системные метрики
   * @param {Object} currentRules - Текущие правила
   * @param {Array} sampleMessages - Образец сообщений для анализа
   * @returns {Promise<Object>} - Оптимизированные настройки правил
   */
  async optimizeGlobalRules(metrics, currentRules = {}, sampleMessages = []) {
    if (!this.isAvailable()) {
      throw new Error('Gemini API key not configured');
    }

    const messagesSample = sampleMessages.slice(0, 100).map(msg => ({
      text: msg.text || '',
      isSpam: msg.is_spam || false,
      isQuestion: msg.is_question || false,
      sentiment: msg.sentiment || 'neutral',
      length: (msg.text || '').length
    }));

    const prompt = `Ты - эксперт по настройке фильтров чата. Проанализируй данные и предложи оптимальные настройки для глобальных правил.

Текущие метрики системы:
${JSON.stringify(metrics, null, 2)}

Текущие правила:
${JSON.stringify(currentRules, null, 2)}

Образец сообщений (${messagesSample.length} сообщений):
${JSON.stringify(messagesSample, null, 2)}

Проанализируй:
1. Процент спама в выборке
2. Частоту вопросов
3. Среднюю длину сообщений
4. Использование эмодзи и заглавных букв
5. Настроение чата (sentiment)

Верни оптимизированные настройки в формате JSON:
{
  "spam": {
    "threshold": 0.0-1.0,
    "minLength": число,
    "maxLength": число,
    "emojiRatio": 0.0-1.0,
    "capsRatio": 0.0-1.0,
    "repeatRatio": 0.0-1.0,
    "enabled": true/false,
    "reason": "объяснение настроек"
  },
  "questions": {
    "enabled": true/false,
    "minLength": число,
    "questionWords": ["список", "слов"],
    "reason": "объяснение настроек"
  },
  "mood": {
    "enabled": true/false,
    "sampleSize": 10-200,
    "happyThreshold": 0.0-1.0,
    "neutralThreshold": 0.0-1.0,
    "sadThreshold": 0.0-1.0,
    "updateInterval": число (мс),
    "reason": "объяснение настроек"
  },
  "summary": "Общее резюме оптимизации"
}`;

    try {
      const response = await this.makeRequest('gemini-2.5-flash', prompt);
      
      try {
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const optimized = JSON.parse(jsonMatch[0]);
          logger.info('AI optimized global rules:', optimized.summary);
          return optimized;
        }
      } catch (e) {
        logger.warn('Failed to parse JSON from Gemini rules optimization response');
      }
      
      // Fallback - возвращаем текущие правила
      return {
        spam: currentRules.spam?.settings || {},
        questions: currentRules.questions?.settings || {},
        mood: currentRules.mood?.settings || {},
        summary: 'Не удалось распарсить ответ ИИ, используйте текущие настройки'
      };
    } catch (error) {
      logger.error('Failed to optimize global rules with Gemini:', error);
      throw error;
    }
  }

  /**
   * Создать пользовательское правило через ИИ
   * @param {string} userRequest - Запрос пользователя в свободной форме
   * @param {string} userId - ID пользователя
   * @param {Object} globalRules - Текущие глобальные правила (для контекста)
   * @returns {Promise<Object>} - Созданное правило
   */
  async createUserRule(userRequest, userId, globalRules = {}) {
    const prompt = `Ты - помощник для создания пользовательских правил фильтрации чата. 
Пользователь хочет создать правило, которое дополняет глобальные правила системы.

Запрос пользователя: "${userRequest}"

Доступные типы правил:
1. spam - фильтрация спама
2. questions - фильтрация вопросов  
3. mood - анализ настроения

ВАЖНО:
- Пользователь НЕ видит глобальные правила, только может дополнять их
- Правило должно быть дополнением, а не заменой глобальных правил
- Правило должно быть безопасным и не ломать систему

Проанализируй запрос и создай JSON с правилом:

{
  "ruleType": "spam|questions|mood",
  "settings": {
    // Настройки для spam:
    "threshold": 0.0-1.0 (опционально, только если пользователь хочет изменить порог),
    "spamWords": ["список", "слов"] (если пользователь указал конкретные слова),
    "patterns": ["regex"] (если пользователь указал паттерны),
    "emojiRatio": 0.0-1.0 (если пользователь хочет ограничить эмодзи),
    "capsRatio": 0.0-1.0 (если пользователь хочет ограничить CAPS),
    "repeatRatio": 0.0-1.0 (если пользователь хочет ограничить повторения),
    // Настройки для questions:
    "questionWords": ["список", "слов"] (дополнительные слова-вопросы),
    "minLength": число (минимальная длина вопроса),
    // Настройки для mood:
    "sampleSize": число (размер выборки для анализа),
    "happyThreshold": 0.0-1.0,
    "neutralThreshold": 0.0-1.0,
    "sadThreshold": 0.0-1.0
  },
  "description": "Человекочитаемое описание правила",
  "enabled": true
}

Если запрос непонятен или не относится к правилам фильтрации, верни null.

Ответ должен быть ТОЛЬКО JSON, без дополнительного текста.`;

    try {
      const response = await this.makeRequest('gemini-2.5-flash', prompt);
      
      try {
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const ruleData = JSON.parse(jsonMatch[0]);
          
          // Валидация
          if (!ruleData.ruleType || !['spam', 'questions', 'mood'].includes(ruleData.ruleType)) {
            throw new Error('Invalid rule type');
          }
          
          if (!ruleData.settings || typeof ruleData.settings !== 'object') {
            throw new Error('Settings must be an object');
          }
          
          return ruleData;
        }
      } catch (e) {
        logger.warn('Failed to parse JSON from Gemini user rule creation response');
        throw new Error('Не удалось создать правило. Попробуйте сформулировать запрос иначе.');
      }
      
      throw new Error('ИИ не смог распознать запрос для создания правила');
    } catch (error) {
      logger.error('Failed to create user rule with Gemini:', error);
      throw error;
    }
  }

  /**
   * Валидация SQL запроса - разрешаем SELECT и безопасные UPDATE
   */
  validateSQLQuery(sql, isAdmin = false) {
    if (!sql || typeof sql !== 'string') {
      return { valid: false, error: 'SQL query must be a string' };
    }

    const trimmed = sql.trim().toUpperCase();
    
    // Разрешенные таблицы для UPDATE (только для админов)
    const allowedUpdateTables = ['GLOBAL_RULES', 'USER_SETTINGS', 'USER_SPAM_RULES'];
    
    // Запрещаем опасные операции
    const dangerousKeywords = [
      'DROP', 'DELETE', 'TRUNCATE', 'ALTER', 'CREATE',
      'EXEC', 'EXECUTE', 'GRANT', 'REVOKE', 'MERGE', 'CALL'
    ];

    for (const keyword of dangerousKeywords) {
      if (trimmed.includes(keyword)) {
        return { valid: false, error: `Dangerous SQL keyword detected: ${keyword}` };
      }
    }

    // Разрешаем SELECT для всех
    if (trimmed.startsWith('SELECT')) {
      return { valid: true, queryType: 'SELECT' };
    }

    // Разрешаем UPDATE только для админов и только для определенных таблиц
    if (trimmed.startsWith('UPDATE')) {
      if (!isAdmin) {
        return { valid: false, error: 'UPDATE queries are only allowed for admins' };
      }

      // Проверяем, что обновляется разрешенная таблица
      const tableMatch = trimmed.match(/UPDATE\s+(\w+)/i);
      if (tableMatch) {
        const tableName = tableMatch[1].toUpperCase();
        if (!allowedUpdateTables.includes(tableName)) {
          return { 
            valid: false, 
            error: `UPDATE on table ${tableName} is not allowed. Allowed tables: ${allowedUpdateTables.join(', ')}` 
          };
        }
      }

      // Запрещаем обновление критичных полей
      const forbiddenFields = ['ID', 'CREATED_AT', 'USER_ID'];
      for (const field of forbiddenFields) {
        if (trimmed.includes(`SET ${field}`) || trimmed.includes(`${field} =`)) {
          return { valid: false, error: `Updating field ${field} is not allowed` };
        }
      }

      return { valid: true, queryType: 'UPDATE' };
    }

    return { valid: false, error: 'Only SELECT and UPDATE queries are allowed' };
  }

  /**
   * Выполнение безопасного SQL запроса к базе данных
   */
  async executeSafeQuery(sql, databaseService, isAdmin = false) {
    // Валидация запроса
    const validation = this.validateSQLQuery(sql, isAdmin);
    if (!validation.valid) {
      throw new Error(`SQL validation failed: ${validation.error}`);
    }

    try {
      const result = await databaseService.query(sql);
      return {
        success: true,
        queryType: validation.queryType,
        rows: result.rows || [],
        rowCount: result.rowCount || 0
      };
    } catch (error) {
      logger.error('SQL query execution error:', error);
      throw new Error(`SQL query failed: ${error.message}`);
    }
  }

  /**
   * Получение схемы базы данных для AI
   */
  async getDatabaseSchema(databaseService) {
    try {
      const schemaQuery = `
        SELECT 
          table_name,
          column_name,
          data_type,
          is_nullable
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name IN ('messages', 'users', 'streams', 'questions', 'app_users', 'global_rules', 'user_settings', 'user_spam_rules')
        ORDER BY table_name, ordinal_position
      `;
      
      const result = await databaseService.query(schemaQuery);
      
      const schema = {};
      result.rows.forEach(row => {
        if (!schema[row.table_name]) {
          schema[row.table_name] = [];
        }
        schema[row.table_name].push({
          column: row.column_name,
          type: row.data_type,
          nullable: row.is_nullable === 'YES'
        });
      });

      return schema;
    } catch (error) {
      logger.error('Failed to get database schema:', error);
      // Возвращаем базовую схему при ошибке
      return {
        messages: [
          { column: 'id', type: 'text', nullable: false },
          { column: 'stream_id', type: 'text', nullable: false },
          { column: 'platform', type: 'text', nullable: false },
          { column: 'username', type: 'text', nullable: false },
          { column: 'content', type: 'text', nullable: false },
          { column: 'created_at', type: 'timestamp', nullable: false },
          { column: 'is_spam', type: 'boolean', nullable: true },
          { column: 'is_question', type: 'boolean', nullable: true },
          { column: 'sentiment', type: 'varchar', nullable: true }
        ]
      };
    }
  }

  async chat(message, conversationHistory = [], options = {}) {
    const databaseService = options.databaseService || null;
    const isAdmin = options.isAdmin !== undefined ? options.isAdmin : true; // По умолчанию true для админки
    const context = conversationHistory.slice(-10).map(msg => ({
      role: msg.role || 'user',
      content: msg.content || msg.message || msg.text
    }));

    // Получаем схему БД для контекста AI
    let dbSchema = null;
    if (databaseService) {
      try {
        dbSchema = await this.getDatabaseSchema(databaseService);
      } catch (error) {
        logger.warn('Failed to get database schema for AI:', error);
      }
    }

    const schemaContext = dbSchema ? `
\n📊 СХЕМА БАЗЫ ДАННЫХ:
${JSON.stringify(dbSchema, null, 2)}

Ты можешь использовать SQL запросы для получения и изменения данных в базе данных.
Формат запроса: используй специальный тег <SQL>твой SQL запрос</SQL>
Пример SELECT: <SQL>SELECT COUNT(*) FROM messages WHERE platform = 'twitch'</SQL>
Пример UPDATE: <SQL>UPDATE global_rules SET settings_json = '{"threshold": 0.8}'::jsonb WHERE rule_type = 'spam'</SQL>

Правила SQL запросов:
- SELECT запросы для получения данных
- UPDATE запросы для изменения настроек (только для таблиц: global_rules, user_settings, user_spam_rules)
- Можно изменять настройки правил, но нельзя менять id, created_at, user_id
- Если пользователь просит настроить параметры - используй UPDATE запрос
- Если пользователь спрашивает про данные - используй SELECT запрос
- После выполнения запроса - интерпретируй результаты и отвечай на русском языке

ВАЖНО: Ты МОЖЕШЬ и ДОЛЖЕН настраивать параметры системы через UPDATE запросы, когда пользователь просит!
` : '';

    const prompt = `Ты - AI помощник для админ панели MellChat, агрегатора чатов для Twitch, YouTube и Kick.

Правила:
- Отвечай на русском языке
- Будь кратким и конкретным
- Фокусируйся на технических аспектах системы
- Если пользователь спрашивает про данные в базе - используй SQL запросы${schemaContext ? ' (см. схему ниже)' : ''}
- Если не знаешь ответа - честно скажи об этом${schemaContext ? schemaContext : ''}

Вопрос админа: ${message}`;

    try {
      const response = await this.makeRequest('gemini-2.5-flash', prompt, context);
      
      // Проверяем, есть ли SQL запросы в ответе AI
      const sqlMatch = response.match(/<SQL>(.*?)<\/SQL>/s);
      
      if (sqlMatch && databaseService) {
        const sqlQuery = sqlMatch[1].trim();
        logger.info('AI requested SQL query:', sqlQuery);
        
        try {
          // Выполняем безопасный SQL запрос (с проверкой прав админа)
          const queryResult = await this.executeSafeQuery(sqlQuery, databaseService, isAdmin);
          
          // Формируем контекст с результатами запроса
          const sqlContext = `
Результаты SQL запроса:
${JSON.stringify(queryResult, null, 2)}

Интерпретируй эти результаты и ответь на вопрос пользователя на русском языке.`;
          
          // Запрашиваем интерпретацию результатов
          const interpretedResponse = await this.makeRequest(
            'gemini-2.5-flash',
            `Интерпретируй результаты SQL запроса и ответь на вопрос пользователя на русском языке:\n\nВопрос: ${message}\n\n${sqlContext}`,
            []
          );
          
          return {
            response: interpretedResponse.trim(),
            timestamp: new Date().toISOString(),
            sqlQuery: sqlQuery,
            sqlResult: queryResult
          };
        } catch (sqlError) {
          logger.error('SQL query execution error:', sqlError);
          return {
            response: `Ошибка при выполнении SQL запроса: ${sqlError.message}. Ответ AI без данных: ${response.replace(/<SQL>.*?<\/SQL>/s, '').trim()}`,
            timestamp: new Date().toISOString(),
            error: sqlError.message
          };
        }
      }
      
      return {
        response: response.trim(),
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logger.error('Failed to chat with Gemini:', error);
      throw error;
    }
  }

  /**
   * Получение рекомендаций
   */
  async getRecommendations(metrics) {
    const prompt = `На основе метрик системы MellChat, предоставь рекомендации:

${JSON.stringify(metrics, null, 2)}

Верни рекомендации в формате JSON массива:
[
  {
    "id": "unique-id",
    "title": "Название рекомендации",
    "description": "Описание",
    "priority": "high/medium/low",
    "metrics": {"key": "value"},
    "actions": [{"icon": "🔍", "label": "Действие"}]
  }
]`;

    try {
      const response = await this.makeRequest('gemini-2.5-flash', prompt);
      
      try {
        const jsonMatch = response.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          return JSON.parse(jsonMatch[0]);
        }
      } catch (e) {
        logger.warn('Failed to parse JSON from Gemini recommendations response');
      }
      
      return [];
    } catch (error) {
      logger.error('Failed to get recommendations from Gemini:', error);
      throw error;
    }
  }

  /**
   * AI фильтрация сообщений по запросу пользователя
   * @param {Array} messages - Массив сообщений для анализа
   * @param {string} userQuery - Запрос пользователя (например, "5 самых интересных вопросов")
   * @param {number} limit - Максимальное количество сообщений для возврата
   * @returns {Promise<Object>} - { messageIds: [], reason: string }
   */
  async filterMessagesByQuery(messages, userQuery, limit = 10) {
    if (!this.isAvailable()) {
      throw new Error('Gemini API key not configured');
    }

    if (!messages || messages.length === 0) {
      return { messageIds: [], reason: 'Нет сообщений для анализа' };
    }

    // Ограничиваем количество сообщений для анализа (экономия токенов)
    const messagesToAnalyze = messages.slice(0, 100);
    
    // Формируем список сообщений для AI
    const messagesList = messagesToAnalyze.map((msg, index) => ({
      index,
      id: msg.id,
      username: msg.username,
      text: msg.text || msg.content || '',
      isQuestion: msg.isQuestion || false,
      timestamp: msg.timestamp,
      sentiment: msg.sentiment || 'neutral'
    }));

    const prompt = `Ты помощник для стримера, который управляет чатом. 
Проанализируй следующие сообщения и выбери самые подходящие согласно запросу пользователя.

ЗАПРОС ПОЛЬЗОВАТЕЛЯ: "${userQuery}"

Сообщения чата:
${JSON.stringify(messagesList, null, 2)}

Твоя задача: выбрать максимум ${limit} самых подходящих сообщений согласно запросу.

ВЕРНИ ОТВЕТ СТРОГО В ФОРМАТЕ JSON (только JSON, без дополнительного текста):
{
  "selectedIds": ["id1", "id2", "id3", ...],
  "reason": "краткое объяснение почему выбраны эти сообщения"
}

ВАЖНО:
- Верни только массив IDs выбранных сообщений в поле "selectedIds"
- IDs должны быть из поля "id" сообщений выше
- Выбирай сообщения, которые максимально соответствуют запросу пользователя
- Если запрос про вопросы - выбирай только сообщения с isQuestion: true
- Если запрос про интересные - выбирай наиболее важные и содержательные
- Если запрос про конкретную тему - выбирай сообщения на эту тему`;

    try {
      const response = await this.makeRequest('gemini-2.5-flash', prompt);
      
      // Пытаемся извлечь JSON из ответа
      let result;
      try {
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          result = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('No JSON found in response');
        }
      } catch (parseError) {
        logger.warn('Failed to parse JSON from Gemini response:', response);
        throw new Error('AI вернул невалидный ответ. Попробуйте переформулировать запрос.');
      }

      // Валидация результата
      if (!result.selectedIds || !Array.isArray(result.selectedIds)) {
        throw new Error('AI вернул некорректный формат ответа');
      }

      // Ограничиваем количество до лимита
      const selectedIds = result.selectedIds.slice(0, limit);

      logger.info(`AI выбрал ${selectedIds.length} сообщений из ${messagesToAnalyze.length}`, {
        query: userQuery,
        selectedCount: selectedIds.length,
        reason: result.reason
      });

      return {
        messageIds: selectedIds,
        reason: result.reason || 'Сообщения выбраны на основе анализа'
      };
    } catch (error) {
      logger.error('Failed to filter messages with AI:', error);
      throw error;
    }
  }
}

module.exports = new GeminiService();

