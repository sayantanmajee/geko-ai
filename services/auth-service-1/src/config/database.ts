/**
 * PostgreSQL Connection Configuration
 * 
 * Creates connection pool for database access. 
 */

import { Pool, PoolClient } from 'pg'
import { createLogger } from '@packages/shared-utils'
import { AppConfig } from './index'

const logger = createLogger('auth-db')

let pool: Pool | null = null

export function getPool(): Pool {
  if (!pool) {
    throw new Error('Database pool not initialized.  Call initDb() first.')
  }
  return pool
}

export async function initDb(config: AppConfig): Promise<void> {
  try {
    pool = new Pool({
      host:  config.dbHost,
      port: config.dbPort,
      database: config.dbName,
      user: config.dbUser,
      password: config.dbPassword,
      ssl: config.dbSsl ?  { rejectUnauthorized: false } : false,
      max: 20, // Max pool size
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis:  2000,
    })

    // Test connection
    const client = await pool.connect()
    await client.query('SELECT NOW()')
    client.release()

    logger.info('Database connected', {
      host: config.dbHost,
      database: config.dbName,
    })
  } catch (error) {
    logger.error('Failed to connect to database', { error })
    throw error
  }
}

export async function closeDb(): Promise<void> {
  if (pool) {
    await pool.end()
    pool = null
    logger.info('Database connection closed')
  }
}

export async function getClient(): Promise<PoolClient> {
  const pool_ = getPool()
  return await pool_.connect()
}

export async function withTransaction<T>(
  callback: (client: PoolClient) => Promise<T>
): Promise<T> {
  const client = await getClient()

  try {
    await client.query('BEGIN')
    const result = await callback(client)
    await client.query('COMMIT')
    return result
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
}