/**
 * Database Migration Runner
 * 
 * Runs all SQL migrations in order.
 * Idempotent:  Safe to run multiple times
 * 
 * Usage:  node migrate.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pkg from 'pg';

const { Client } = pkg;

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const client = new Client({
  user:  process.env.DB_USER || 'geko',
  password: process.env.DB_PASSWORD || 'dev-password',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'geko_ai',
});

async function runMigrations() {
  try {
    await client.connect();
    console.log('✅ Connected to PostgreSQL');

    // Get all migration files
    const migrationsDir = path.join(__dirname, 'migrations');
    const files = fs
      .readdirSync(migrationsDir)
      .filter((f) => f.endsWith('.sql'))
      .sort();

    console.log(`📂 Found ${files.length} migration files\n`);

    for (const file of files) {
      console.log(`⏳ Running:  ${file}`);
      const filePath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(filePath, 'utf-8');

      await client.query(sql);
      console.log(`✅ Completed: ${file}\n`);
    }

    console.log('🎉 All migrations completed successfully! ');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigrations();