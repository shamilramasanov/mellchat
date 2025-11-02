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
        
        // Check if migration contains CONCURRENTLY commands
        const hasConcurrently = migrationSQL.includes('CONCURRENTLY');
        
        if (hasConcurrently) {
          // Split SQL by semicolon and execute commands separately
          // CONCURRENTLY commands must run outside transaction
          const commands = migrationSQL
            .split(';')
            .map(cmd => cmd.trim())
            .filter(cmd => cmd.length > 0 && !cmd.startsWith('--'));
          
          for (const command of commands) {
            if (command.trim().length === 0) continue;
            
            // Skip SELECT statements (they're for display only)
            if (command.trim().toUpperCase().startsWith('SELECT')) {
              console.log('  ⏭️  Skipping SELECT statement');
              continue;
            }
            
            // Execute without transaction wrapper for CONCURRENTLY
            try {
              await client.query(command);
            } catch (cmdError) {
              // Ignore "already exists" errors for idempotency
              if (cmdError.message.includes('already exists') || 
                  cmdError.message.includes('duplicate')) {
                console.log(`  ⚠️  Index already exists, skipping`);
                continue;
              }
              throw cmdError;
            }
          }
        } else {
          // Regular migration - execute as single query (may be wrapped in transaction)
          await client.query(migrationSQL);
        }
        
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

