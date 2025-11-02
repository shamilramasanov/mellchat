#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const databaseService = require('./src/services/databaseService');

async function applyMigration() {
  try {
    console.log('📊 Применение миграции user_activity_log...');
    
    const migrationPath = path.join(__dirname, 'database', 'migrations', 'add_user_activity_log.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');
    
    // Выполняем весь SQL как один запрос (PostgreSQL поддерживает множественные команды)
    try {
      await databaseService.query(sql);
      console.log('✅ Миграция применена');
    } catch (error) {
      // Игнорируем ошибки "already exists"
      if (error.message.includes('already exists') || error.message.includes('duplicate')) {
        console.log('⚠️ Некоторые объекты уже существуют, проверяем...');
        // Проверяем, существует ли таблица
        const checkTable = await databaseService.query(`
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'user_activity_log'
          );
        `);
        if (checkTable.rows[0].exists) {
          console.log('✅ Таблица уже существует, миграция не требуется');
        } else {
          throw error;
        }
      } else {
        throw error;
      }
    }
    
    console.log('✅ Миграция user_activity_log применена успешно!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Ошибка при применении миграции:', error.message);
    process.exit(1);
  }
}

applyMigration();

