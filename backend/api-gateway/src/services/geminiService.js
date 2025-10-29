const logger = require('../utils/logger');

class GeminiService {
  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY;
    this.baseUrl = 'https://generativelanguage.googleapis.com/v1beta';
    
    if (!this.apiKey) {
      logger.warn('⚠️ GEMINI_API_KEY не установлен. Gemini функции будут недоступны.');
    } else {
      logger.info('✅ Gemini API key configured');
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
      const url = `${this.baseUrl}/models`;
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
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

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Gemini API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
      }

      const data = await response.json();
      
      if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
        throw new Error('Invalid response from Gemini API');
      }

      return data.candidates[0].content.parts[0].text;
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
      const response = await this.makeRequest('gemini-pro', prompt);
      
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
      const response = await this.makeRequest('gemini-pro', prompt);
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
      const response = await this.makeRequest('gemini-pro', prompt);
      
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
      const response = await this.makeRequest('gemini-pro', prompt);
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
   * Чат с ИИ помощником (для AI Assistant)
   */
  async chat(message, conversationHistory = []) {
    const context = conversationHistory.slice(-10).map(msg => ({
      role: msg.role || 'user',
      content: msg.content || msg.message || msg.text
    }));

    const prompt = `Ты - AI помощник для админ панели MellChat, агрегатора чатов для Twitch, YouTube и Kick.

Правила:
- Отвечай на русском языке
- Будь кратким и конкретным
- Фокусируйся на технических аспектах системы
- Если не знаешь ответа - честно скажи об этом

Вопрос админа: ${message}`;

    try {
      const response = await this.makeRequest('gemini-pro', prompt, context);
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
      const response = await this.makeRequest('gemini-pro', prompt);
      
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
}

module.exports = new GeminiService();

