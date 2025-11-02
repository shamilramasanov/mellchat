#!/usr/bin/env node

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function runMigrations() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });

  try {
    await client.connect();
    console.log('✅ Connected to database');

    const migrationsDir = path.join(__dirname, 'database', 'migrations');
    console.log('📂 Migrations directory:', migrationsDir);

    // Get all SQL files sorted by name
    const files = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort();

    console.log(`📝 Found ${files.length} migration files`);

    for (const file of files) {
      const filePath = path.join(migrationsDir, file);
      console.log(`\n📄 Applying migration: ${file}`);
      
      try {
        const migrationSQL = fs.readFileSync(filePath, 'utf8');
        await client.query(migrationSQL);
        console.log(`✅ Migration ${file} applied successfully!`);
      } catch (error) {
        // If migration already applied, ignore error (for idempotency)
        if (error.message.includes('already exists') || 
            error.message.includes('duplicate') ||
            error.message.includes('IF NOT EXISTS')) {
          console.log(`⚠️  Migration ${file} already applied, skipping`);
          continue;
        }
        throw error;
      }
    }

    console.log('\n🎉 All migrations completed successfully!');
    await client.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error('Stack:', error.stack);
    await client.end();
    process.exit(1);
  }
}

// Check if DATABASE_URL is set
if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL environment variable is not set');
  process.exit(1);
}

runMigrations();

