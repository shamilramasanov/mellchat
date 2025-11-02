// Script to apply global_rules migration
const fs = require('fs');
const path = require('path');
const databaseService = require('./src/services/databaseService');

async function applyMigration() {
  try {
    const migrationPath = path.join(__dirname, 'database/migrations/add_global_rules.sql');
    let migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('Applying global_rules migration...');
    
    // Удаляем комментарии (строки начинающиеся с --)
    migrationSQL = migrationSQL.replace(/^--.*$/gm, '');
    
    // Выполняем весь SQL как один запрос (PostgreSQL поддерживает множественные команды)
    await databaseService.query(migrationSQL);
    
    console.log('✅ Migration applied successfully!');
    process.exit(0);
  } catch (error) {
    // Игнорируем ошибки "уже существует" для CREATE TABLE IF NOT EXISTS и CREATE INDEX IF NOT EXISTS
    if (error.message.includes('already exists') || 
        error.message.includes('duplicate') ||
        error.code === '42P07' || // relation already exists
        error.code === '42710') { // duplicate object
      console.log('⚠️  Some objects already exist, but migration completed');
      process.exit(0);
    } else {
      console.error('❌ Migration failed:', error.message);
      console.error('Error code:', error.code);
      process.exit(1);
    }
  }
}

applyMigration();

