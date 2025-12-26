/**
 * Database Connection Pool
 * 
 * Manages PostgreSQL connections for all services
 * - Reuses connections (performance)
 * - Enforces timeouts (prevent hanging)
 * - Automatic retry logic
 * 
 * Queries are parameterized to prevent SQL injection
 */

import { Pool, PoolClient } from 'pg';
import { createLogger } from '../logger/index';

const logger = createLogger('database');

let pool: Pool | null = null;

/**
 * Initialize database connection pool
 * Call this once at service startup
 */
export function initializePool(): Pool {
  if (pool) return pool;

  pool = new Pool({
    user:  process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process. env.DB_NAME,
    
    // Connection pool config
    max: 20,                          // Max connections
    idleTimeoutMillis: 30000,         // Close idle after 30s
    connectionTimeoutMillis:  2000,    // Fail if can't connect in 2s
    
    // Safe cleanup
    application_name: process.env.SERVICE_NAME || 'geko-ai',
  });

  pool.on('error', (err) => {
    logger.error({ err }, 'Unexpected error in connection pool');
  });

  logger.info('Database pool initialized');
  return pool;
}

/**
 * Get pool instance (initializes if needed)
 */
export function getPool(): Pool {
  if (!pool) {
    return initializePool();
  }
  return pool;
}

/**
 * Execute query and return rows
 * 
 * Always use parameterized queries: 
 * query('SELECT * FROM users WHERE id = $1', [userId])
 */
export async function query<T = any>(
  text: string,
  params?: any[]
): Promise<T[]> {
  const p = getPool();
  const result = await p.query(text, params);
  return result.rows;
}

/**
 * Execute query and return first row (or null)
 */
export async function queryOne<T = any>(
  text: string,
  params?: any[]
): Promise<T | null> {
  const results = await query<T>(text, params);
  return results.length > 0 ? results[0] : null;
}

/**
 * Execute command (INSERT, UPDATE, DELETE)
 * Returns number of affected rows
 */
export async function execute(
  text: string,
  params?: any[]
): Promise<number> {
  const p = getPool();
  const result = await p.query(text, params);
  return result.rowCount || 0;
}

/**
 * Get raw connection for transactions
 * IMPORTANT: Must call release() when done
 * 
 * Example: 
 * const client = await getConnection()
 * try {
 *   await client.query('BEGIN')
 *   await client.query('INSERT .. .')
 *   await client.query('COMMIT')
 * } catch {
 *   await client.query('ROLLBACK')
 * } finally {
 *   client.release()
 * }
 */
export async function getConnection(): Promise<PoolClient> {
  const p = getPool();
  return p.connect();
}

/**
 * Execute query within a transaction
 * Automatically handles COMMIT/ROLLBACK
 */
export async function transaction<T>(
  callback: (client: PoolClient) => Promise<T>
): Promise<T> {
  const client = await getConnection();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Close pool (graceful shutdown)
 * Call before process exit
 */
export async function closePool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
    logger.info('Database pool closed');
  }
}