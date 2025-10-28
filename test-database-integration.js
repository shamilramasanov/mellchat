#!/usr/bin/env node

/**
 * Тест интеграции с базой данных MellChat
 * Проверяет корректность сохранения, корреляции и выгрузки сообщений
 */

import axios from 'axios';

// Простой logger для тестов
const logger = {
  info: (msg, data) => console.log(`ℹ️ ${msg}`, data || ''),
  error: (msg, data) => console.error(`❌ ${msg}`, data || ''),
  debug: (msg, data) => console.log(`🔍 ${msg}`, data || '')
};

// Конфигурация
const API_BASE_URL = process.env.API_URL || 'http://localhost:3001';
const TEST_STREAM_ID = 'test-stream-' + Date.now();

// Тестовые данные
const testMessages = [
  {
    id: `test-msg-1-${Date.now()}`,
    username: 'testuser1',
    text: 'Привет всем! Как дела?',
    platform: 'twitch',
    timestamp: Date.now(),
    isQuestion: true
  },
  {
    id: `test-msg-2-${Date.now()}`,
    username: 'testuser2', 
    text: 'Отличный стрим!',
    platform: 'kick',
    timestamp: Date.now() + 1000,
    isQuestion: false
  },
  {
    id: `test-msg-3-${Date.now()}`,
    username: 'testuser3',
    text: 'What is your favorite game?',
    platform: 'youtube',
    timestamp: Date.now() + 2000,
    isQuestion: true
  }
];

class DatabaseIntegrationTester {
  constructor() {
    this.results = {
      saveMessages: [],
      getMessages: null,
      getQuestions: null,
      getStats: null,
      searchMessages: null,
      errors: []
    };
  }

  async runAllTests() {
    console.log('🧪 Запуск тестов интеграции с базой данных...\n');
    
    try {
      // 1. Тест сохранения сообщений
      await this.testSaveMessages();
      
      // 2. Тест получения сообщений
      await this.testGetMessages();
      
      // 3. Тест получения вопросов
      await this.testGetQuestions();
      
      // 4. Тест статистики
      await this.testGetStats();
      
      // 5. Тест поиска
      await this.testSearchMessages();
      
      // 6. Тест здоровья БД
      await this.testDatabaseHealth();
      
      // Выводим результаты
      this.printResults();
      
    } catch (error) {
      console.error('❌ Критическая ошибка тестирования:', error.message);
      this.results.errors.push(error.message);
    }
  }

  async testSaveMessages() {
    console.log('📝 Тестирование сохранения сообщений...');
    
    for (const message of testMessages) {
      try {
        // Симулируем сохранение через messageHandler
        const response = await axios.post(`${API_BASE_URL}/api/test/save-message`, {
          message: {
            ...message,
            streamId: TEST_STREAM_ID
          },
          connectionId: `${message.platform}-${TEST_STREAM_ID}-${Date.now()}`
        });
        
        this.results.saveMessages.push({
          messageId: message.id,
          success: response.data.success,
          data: response.data
        });
        
        console.log(`  ✅ Сообщение ${message.id} сохранено`);
        
      } catch (error) {
        console.log(`  ❌ Ошибка сохранения ${message.id}:`, error.message);
        this.results.errors.push(`Save ${message.id}: ${error.message}`);
      }
    }
  }

  async testGetMessages() {
    console.log('📖 Тестирование получения сообщений...');
    
    try {
      const response = await axios.get(`${API_BASE_URL}/api/database/messages/${TEST_STREAM_ID}`, {
        params: { limit: 10, offset: 0 }
      });
      
      this.results.getMessages = {
        success: response.data.success,
        count: response.data.count,
        messages: response.data.messages
      };
      
      console.log(`  ✅ Получено ${response.data.count} сообщений`);
      
      // Проверяем корректность данных
      this.validateMessageStructure(response.data.messages);
      
    } catch (error) {
      console.log(`  ❌ Ошибка получения сообщений:`, error.message);
      this.results.errors.push(`Get messages: ${error.message}`);
    }
  }

  async testGetQuestions() {
    console.log('❓ Тестирование получения вопросов...');
    
    try {
      const response = await axios.get(`${API_BASE_URL}/api/database/questions/${TEST_STREAM_ID}`, {
        params: { limit: 10, offset: 0 }
      });
      
      this.results.getQuestions = {
        success: response.data.success,
        count: response.data.count,
        questions: response.data.questions
      };
      
      console.log(`  ✅ Получено ${response.data.count} вопросов`);
      
    } catch (error) {
      console.log(`  ❌ Ошибка получения вопросов:`, error.message);
      this.results.errors.push(`Get questions: ${error.message}`);
    }
  }

  async testGetStats() {
    console.log('📊 Тестирование статистики...');
    
    try {
      const response = await axios.get(`${API_BASE_URL}/api/database/stats/${TEST_STREAM_ID}`);
      
      this.results.getStats = {
        success: response.data.success,
        stats: response.data.stats
      };
      
      console.log(`  ✅ Статистика получена:`, response.data.stats);
      
    } catch (error) {
      console.log(`  ❌ Ошибка получения статистики:`, error.message);
      this.results.errors.push(`Get stats: ${error.message}`);
    }
  }

  async testSearchMessages() {
    console.log('🔍 Тестирование поиска сообщений...');
    
    try {
      const response = await axios.get(`${API_BASE_URL}/api/database/search/${TEST_STREAM_ID}`, {
        params: { q: 'игра', limit: 10, offset: 0 }
      });
      
      this.results.searchMessages = {
        success: response.data.success,
        count: response.data.count,
        searchQuery: response.data.searchQuery,
        messages: response.data.messages
      };
      
      console.log(`  ✅ Найдено ${response.data.count} сообщений по запросу "игра"`);
      
    } catch (error) {
      console.log(`  ❌ Ошибка поиска:`, error.message);
      this.results.errors.push(`Search: ${error.message}`);
    }
  }

  async testDatabaseHealth() {
    console.log('🏥 Тестирование здоровья БД...');
    
    try {
      const response = await axios.get(`${API_BASE_URL}/api/database/health`);
      
      console.log(`  ✅ База данных:`, response.data.database);
      
    } catch (error) {
      console.log(`  ❌ Ошибка проверки здоровья БД:`, error.message);
      this.results.errors.push(`Health check: ${error.message}`);
    }
  }

  validateMessageStructure(messages) {
    console.log('🔍 Проверка структуры сообщений...');
    
    const requiredFields = ['id', 'stream_id', 'username', 'text', 'platform', 'created_at'];
    
    for (const message of messages) {
      for (const field of requiredFields) {
        if (!message.hasOwnProperty(field)) {
          console.log(`  ⚠️ Отсутствует поле ${field} в сообщении ${message.id}`);
        }
      }
    }
    
    console.log(`  ✅ Структура ${messages.length} сообщений проверена`);
  }

  printResults() {
    console.log('\n📋 РЕЗУЛЬТАТЫ ТЕСТИРОВАНИЯ');
    console.log('='.repeat(50));
    
    // Сохранение сообщений
    console.log('\n📝 Сохранение сообщений:');
    this.results.saveMessages.forEach(result => {
      const status = result.success ? '✅' : '❌';
      console.log(`  ${status} ${result.messageId}`);
    });
    
    // Получение сообщений
    if (this.results.getMessages) {
      const status = this.results.getMessages.success ? '✅' : '❌';
      console.log(`\n📖 Получение сообщений: ${status} (${this.results.getMessages.count} сообщений)`);
    }
    
    // Получение вопросов
    if (this.results.getQuestions) {
      const status = this.results.getQuestions.success ? '✅' : '❌';
      console.log(`\n❓ Получение вопросов: ${status} (${this.results.getQuestions.count} вопросов)`);
    }
    
    // Статистика
    if (this.results.getStats) {
      const status = this.results.getStats.success ? '✅' : '❌';
      console.log(`\n📊 Статистика: ${status}`);
      if (this.results.getStats.stats) {
        console.log(`  Всего сообщений: ${this.results.getStats.stats.total_messages}`);
        console.log(`  Вопросов: ${this.results.getStats.stats.question_count}`);
      }
    }
    
    // Поиск
    if (this.results.searchMessages) {
      const status = this.results.searchMessages.success ? '✅' : '❌';
      console.log(`\n🔍 Поиск: ${status} (${this.results.searchMessages.count} результатов)`);
    }
    
    // Ошибки
    if (this.results.errors.length > 0) {
      console.log('\n❌ ОШИБКИ:');
      this.results.errors.forEach(error => {
        console.log(`  • ${error}`);
      });
    }
    
    // Общий результат
    const totalTests = 5;
    const passedTests = [
      this.results.saveMessages.filter(r => r.success).length > 0,
      this.results.getMessages?.success,
      this.results.getQuestions?.success,
      this.results.getStats?.success,
      this.results.searchMessages?.success
    ].filter(Boolean).length;
    
    console.log(`\n🎯 ИТОГО: ${passedTests}/${totalTests} тестов пройдено`);
    
    if (this.results.errors.length === 0) {
      console.log('🎉 Все тесты пройдены успешно!');
    } else {
      console.log('⚠️ Обнаружены проблемы, требующие внимания.');
    }
  }
}

// Запуск тестов
const tester = new DatabaseIntegrationTester();
tester.runAllTests().catch(console.error);

export default DatabaseIntegrationTester;
