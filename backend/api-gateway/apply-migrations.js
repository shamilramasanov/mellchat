#!/usr/bin/env node

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

async function connectWithRetry(maxRetries = 10, retryDelay = 2000) {
  let lastError;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const client = new Client({
        connectionString: process.env.DATABASE_URL,
        connectionTimeoutMillis: 30000,
      });
      
      await client.connect();
      console.log(`✅ Connected to database on attempt ${attempt}`);
      return client;
    } catch (error) {
      lastError = error;
      console.log(`⚠️  Connection attempt ${attempt}/${maxRetries} failed: ${error.message}`);
      
      if (attempt < maxRetries) {
        const delay = retryDelay * attempt;
        console.log(`🔄 Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError;
}

async function ensureMigrationsTable(client) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id SERIAL PRIMARY KEY,
      filename VARCHAR(255) NOT NULL UNIQUE,
      checksum VARCHAR(64) NOT NULL,
      applied_at TIMESTAMP DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_schema_migrations_filename 
      ON schema_migrations(filename);
  `);
  console.log('✅ Migrations tracking table ready');
}

function calculateChecksum(content) {
  return crypto.createHash('sha256').update(content).digest('hex');
}

async function isMigrationApplied(client, filename, checksum) {
  const result = await client.query(
    'SELECT checksum FROM schema_migrations WHERE filename = $1',
    [filename]
  );
  
  if (result.rows.length === 0) {
    return false;
  }
  
  if (result.rows[0].checksum !== checksum) {
    console.warn(`⚠️  WARNING: Migration ${filename} has been modified after being applied!`);
    console.warn(`   Previous checksum: ${result.rows[0].checksum}`);
    console.warn(`   Current checksum:  ${checksum}`);
    console.warn(`   Skipping re-application...`);
  }
  
  return true;
}

async function recordMigration(client, filename, checksum) {
  await client.query(
    'INSERT INTO schema_migrations (filename, checksum) VALUES ($1, $2) ON CONFLICT (filename) DO NOTHING',
    [filename, checksum]
  );
}

async function runMigrations() {
  const client = await connectWithRetry();
  
  try {
    // Ensure migrations tracking table exists
    await ensureMigrationsTable(client);

    const migrationsDir = path.join(__dirname, 'database', 'migrations');
    console.log('📂 Migrations directory:', migrationsDir);

    // Get all SQL files sorted by name
    const files = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort((a, b) => {
        // Priority 1: Numbered migrations first
        const aNum = parseInt(a.match(/^(\d+)_/)?.[1] || '999999');
        const bNum = parseInt(b.match(/^(\d+)_/)?.[1] || '999999');
        if (aNum !== 999999 || bNum !== 999999) {
          return aNum - bNum;
        }
        
        // Priority 2: Special ordering
        const priority = {
          'add_guest_sessions.sql': 1,
          'add_fingerprint_to_guest_sessions.sql': 2,
          'add_auth_users.sql': 3,
          'add_auth_tables.sql': 4,
          'add_message_scoring_fields.sql': 5,
          'add_moderation_fields.sql': 6,
          'add_materialized_views.sql': 7,
        };
        
        const aPriority = priority[a] || 999;
        const bPriority = priority[b] || 999;
        
        if (aPriority !== bPriority) {
          return aPriority - bPriority;
        }
        
        // Default: Alphabetical
        return a.localeCompare(b);
      });

    console.log(`📝 Found ${files.length} migration files`);
    
    let appliedCount = 0;
    let skippedCount = 0;

    for (const file of files) {
      const filePath = path.join(migrationsDir, file);
      const migrationSQL = fs.readFileSync(filePath, 'utf8');
      const checksum = calculateChecksum(migrationSQL);
      
      // Check if migration already applied
      if (await isMigrationApplied(client, file, checksum)) {
        console.log(`⏭️  Skipping ${file} (already applied)`);
        skippedCount++;
        continue;
      }
      
      console.log(`\n📄 Applying migration: ${file}`);
      
      try {
        const hasConcurrently = migrationSQL.includes('CONCURRENTLY');
        const isMaterializedViews = file.includes('materialized_views');
        
        if (hasConcurrently && !isMaterializedViews) {
          // Execute CONCURRENTLY commands separately (outside transaction)
          const commands = migrationSQL
            .split(';')
            .map(cmd => cmd.trim())
            .filter(cmd => cmd.length > 0 && !cmd.startsWith('--'));
          
          for (const command of commands) {
            if (command.trim().length === 0) continue;
            if (command.trim().toUpperCase().startsWith('SELECT')) continue;
            
            try {
              await client.query(command);
            } catch (cmdError) {
              if (cmdError.message.includes('already exists') || 
                  cmdError.message.includes('duplicate')) {
                console.log(`  ⚠️  Object already exists, continuing...`);
                continue;
              }
              throw cmdError;
            }
          }
        } else {
          // Regular migration
          try {
            await client.query(migrationSQL);
          } catch (error) {
            // Check for materialized views special case
            if (isMaterializedViews && error.message.includes('does not exist')) {
              console.log(`  ⚠️  Required tables not yet created, skipping materialized views`);
              continue;
            }
            throw error;
          }
        }
        
        // Record successful migration
        await recordMigration(client, file, checksum);
        console.log(`✅ Migration ${file} applied successfully!`);
        appliedCount++;
        
      } catch (error) {
        // If migration already applied (based on error), record it
        if (error.message.includes('already exists') || 
            error.message.includes('duplicate')) {
          console.log(`⚠️  Migration ${file} objects already exist, recording...`);
          await recordMigration(client, file, checksum);
          skippedCount++;
          continue;
        }
        throw error;
      }
    }

    console.log(`\n🎉 Migrations completed!`);
    console.log(`   ✅ Applied: ${appliedCount}`);
    console.log(`   ⏭️  Skipped: ${skippedCount}`);
    
    await client.end();
    // НЕ выходим - allow next command in chain to run
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error('Stack:', error.stack);
    
    if (client && !client._ending) {
      await client.end();
    }
    
    // Exit with error to prevent app from starting with broken schema
    process.exit(1);
  }
}

// Main execution
(async () => {
  // Check if DATABASE_URL is set
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL environment variable is not set');
    process.exit(1);
  }

  try {
    await runMigrations();
    // Миграции завершены, теперь следующая команда в цепочке (node src/index.js) запустится
  } catch (error) {
    console.error('❌ Migration execution failed:', error);
    process.exit(1);
  }
})();