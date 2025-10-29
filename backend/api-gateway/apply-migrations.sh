#!/bin/bash

# Apply database migrations on Railway deployment
echo "🚀 Applying database migrations..."

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "❌ DATABASE_URL environment variable is not set"
    exit 1
fi

echo "✅ DATABASE_URL is set"

# Apply moderation fields migration using Node.js
echo "📝 Applying moderation fields migration..."
node -e "
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const client = new Client({
  connectionString: process.env.DATABASE_URL
});

async function runMigration() {
  try {
    await client.connect();
    console.log('Connected to database');
    
    const migrationSQL = fs.readFileSync(path.join(__dirname, 'database/migrations/add_moderation_fields.sql'), 'utf8');
    await client.query(migrationSQL);
    
    console.log('✅ Moderation fields migration applied successfully!');
    await client.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    await client.end();
    process.exit(1);
  }
}

runMigration();
"

if [ $? -eq 0 ]; then
    echo "🎉 All migrations completed successfully!"
else
    echo "❌ Migration failed!"
    exit 1
fi
