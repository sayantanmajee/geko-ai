/**
 * Database Migration Runner
 * 
 * Executes SQL migrations in order: 
 * 1.Core schema (001)
 * 2.Models (002)
 * 3.Billing (003)
 * ...etc
 * 
 * Then seeds test data if development
 * 
 * Usage:
 * await runMigrations('./infra/postgres/migrations')
 * await runSeeds('./infra/postgres/seeds')
 */

import fs from 'fs/promises';
import path from 'path';
import { getPool } from './index.js';
import { createLogger } from '../logger/index.js';

const logger = createLogger('migrations');

/**
 * Run all migrations in order
 * 
 * Migrations are SQL files named:  NNN_description.sql
 * Executed in alphabetical order (NNN = sequence number)
 */
export async function runMigrations(migrationsDir: string): Promise<void> {
  logger.info('Starting migrations...');
  
  const pool = getPool();
  const files = await fs.readdir(migrationsDir);
  const sqlFiles = files
    .filter(f => f.endsWith('.sql'))
    .sort(); // Alphabetical order ensures 001, 002, 003, etc
  
  for (const file of sqlFiles) {
    try {
      const filePath = path.join(migrationsDir, file);
      const sql = await fs.readFile(filePath, 'utf-8');
      
      logger.info(`Executing migration: ${file}`);
      await pool.query(sql);
      logger.info(`✓ Migration completed: ${file}`);
    } catch (error) {
      logger.error(`✗ Migration failed: ${file}`, error);
      throw error;
    }
  }
  
  logger.info('All migrations completed');
}

/**
 * Run all seed files
 * 
 * Seeds are optional data insertions
 * Safe to run multiple times (uses ON CONFLICT)
 */
export async function runSeeds(seedsDir: string): Promise<void> {
  // Only seed in development or if explicitly enabled
  if (process.env.NODE_ENV === 'production' && !process.env.ENABLE_SEEDS) {
    logger.warn('Skipping seeds in production (set ENABLE_SEEDS=true to override)');
    return;
  }
  
  logger.info('Starting seeds...');
  
  const pool = getPool();
  const files = await fs.readdir(seedsDir);
  const sqlFiles = files
    .filter(f => f.endsWith('.sql'))
    .sort();
  
  for (const file of sqlFiles) {
    try {
      const filePath = path.join(seedsDir, file);
      const sql = await fs.readFile(filePath, 'utf-8');
      
      logger.info(`Executing seed: ${file}`);
      await pool.query(sql);
      logger.info(`✓ Seed completed: ${file}`);
    } catch (error) {
      logger.error(`✗ Seed failed: ${file}`, error);
      // Don't throw on seed failure (idempotent, may already exist)
      logger.warn('Continuing with next seed...');
    }
  }
  
  logger.info('All seeds completed');
}