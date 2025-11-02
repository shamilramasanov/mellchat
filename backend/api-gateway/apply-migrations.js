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

    // Get all SQL files sorted by name with priority:
    // 1. Files starting with number prefix (01_, 02_, etc.)
    // 2. Files starting with 'add_auth_users' (must come before 'add_auth_tables')
    // 3. Other files alphabetically
    const files = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort((a, b) => {
        // Priority 1: Numbered migrations first
        const aNum = parseInt(a.match(/^(\d+)_/)?.[1] || '999999');
        const bNum = parseInt(b.match(/^(\d+)_/)?.[1] || '999999');
        if (aNum !== 999999 || bNum !== 999999) {
          return aNum - bNum;
        }
        
        // Priority 2: add_guest_sessions before add_fingerprint_to_guest_sessions
        if (a === 'add_guest_sessions.sql' && b === 'add_fingerprint_to_guest_sessions.sql') return -1;
        if (a === 'add_fingerprint_to_guest_sessions.sql' && b === 'add_guest_sessions.sql') return 1;
        
        // Priority 3: add_auth_users before add_auth_tables
        if (a === 'add_auth_users.sql' && b === 'add_auth_tables.sql') return -1;
        if (a === 'add_auth_tables.sql' && b === 'add_auth_users.sql') return 1;
        
        // Priority 4: Alphabetical
        return a.localeCompare(b);
      });

    console.log(`📝 Found ${files.length} migration files`);

    for (const file of files) {
      const filePath = path.join(migrationsDir, file);
      console.log(`\n📄 Applying migration: ${file}`);
      
      try {
        const migrationSQL = fs.readFileSync(filePath, 'utf8');
        
        // Check if migration contains CONCURRENTLY commands
        const hasConcurrently = migrationSQL.includes('CONCURRENTLY');
        
        // Check if this is materialized views migration - it needs special handling
        const isMaterializedViews = file.includes('materialized_views');
        
        if (hasConcurrently && !isMaterializedViews) {
          // Split SQL by semicolon and execute commands separately
          // CONCURRENTLY commands must run outside transaction
          // BUT: Skip this for materialized_views as it has complex multi-line statements
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
          // Regular migration or materialized views - execute as single query
          // Materialized views migration contains CONCURRENTLY but needs full SQL execution
          try {
            await client.query(migrationSQL);
          } catch (error) {
            // For materialized views, check if tables exist first
            if (isMaterializedViews && error.message.includes('does not exist')) {
              // Check if required tables exist
              const tablesCheck = await client.query(`
                SELECT table_name 
                FROM information_schema.tables 
                WHERE table_schema = 'public' 
                  AND table_name IN ('streams', 'messages', 'users')
              `);
              
              const existingTables = tablesCheck.rows.map(r => r.table_name);
              const requiredTables = ['streams', 'messages', 'users'];
              const missingTables = requiredTables.filter(t => !existingTables.includes(t));
              
              if (missingTables.length > 0) {
                console.log(`  ⚠️  Missing required tables: ${missingTables.join(', ')}`);
                console.log(`  ⚠️  Skipping materialized views migration - tables must be created first`);
                continue;
              }
            }
            throw error;
          }
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

