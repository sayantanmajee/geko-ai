/**
 * User Queries
 * 
 * All database operations for users.
 * Automatically converts between snake_case (DB) and camelCase (Code).
 */

import { getPool } from '../../config/database'
import { createLogger } from '@package/shared-utils'
import { UserDbRow } from '../types'
import type { User } from '@package/shared-types'
import { generateSelectQuery, mapDbRowToCamelCase } from '../../utils/db-mapper.utils'

const logger = createLogger('user-queries')

const USER_COLUMNS = [
  'user_id',
  'tenant_id',
  'email',
  'password_hash',
  'name',
  'role',
  'status',
  'last_login_at',
  'created_at',
  'updated_at',
]

export class UserQueries {
  /**
   * Create a new user
   */
  static async create(data: {
    tenantId: string
    email:  string
    passwordHash?:  string
    name?: string
    role?: 'owner' | 'admin' | 'member'
  }): Promise<User> {
    const pool = getPool()

    logger.debug('Creating user', { email: data.email, tenantId: data.tenantId })

    try {
      const result = await pool.query(
        `INSERT INTO users (tenant_id, email, password_hash, name, role, status)
         VALUES ($1, $2, $3, $4, $5, 'active')
         RETURNING ${generateSelectQuery(USER_COLUMNS)}`,
        [
          data.tenantId,
          data.email,
          data.passwordHash || null,
          data.name || null,
          data.role || 'member',
        ]
      )

      const user = mapDbRowToCamelCase(result.rows[0]) as User
      logger.debug('User created successfully', { userId: user.userId })
      return user
    } catch (error) {
      logger.error('Failed to create user', {
        error: (error as Error).message,
        email: data.email,
        tenantId: data.tenantId,
      })
      throw error
    }
  }

  /**
   * Find user by ID
   */
  static async findById(userId: string): Promise<User | null> {
    const pool = getPool()

    const result = await pool.query(
      `SELECT ${generateSelectQuery(USER_COLUMNS)}
       FROM users
       WHERE user_id = $1 AND deleted_at IS NULL`,
      [userId]
    )

    return result.rows[0] ? (mapDbRowToCamelCase(result.rows[0]) as User) : null
  }

  /**
   * Find user by email in tenant
   */
  static async findByEmail(tenantId: string, email: string): Promise<User | null> {
    const pool = getPool()

    logger.debug('Finding user by email', { tenantId, email })

    const result = await pool.query(
      `SELECT ${generateSelectQuery(USER_COLUMNS)}
       FROM users
       WHERE tenant_id = $1 AND email = $2 AND deleted_at IS NULL`,
      [tenantId, email]
    )

    return result.rows[0] ? (mapDbRowToCamelCase(result.rows[0]) as User) : null
  }

  /**
   * Find user by email (any tenant) - for OAuth
   */
  static async findByEmailGlobal(email: string): Promise<User | null> {
    const pool = getPool()

    const result = await pool.query(
      `SELECT ${generateSelectQuery(USER_COLUMNS)}
       FROM users
       WHERE email = $1 AND deleted_at IS NULL`,
      [email]
    )

    return result.rows[0] ? (mapDbRowToCamelCase(result.rows[0]) as User) : null
  }

  /**
   * Update user
   */
  static async update(
    userId: string,
    data: Partial<{
      name: string
      role: string
      status: string
      lastLoginAt:  number
      passwordHash:  string
    }>
  ): Promise<User> {
    const pool = getPool()

    const updates: string[] = []
    const values: any[] = [userId]
    let paramCount = 2

    if (data.name !== undefined) {
      updates.push(`name = $${paramCount}`)
      values.push(data.name)
      paramCount++
    }

    if (data.role !== undefined) {
      updates.push(`role = $${paramCount}`)
      values.push(data.role)
      paramCount++
    }

    if (data.status !== undefined) {
      updates.push(`status = $${paramCount}`)
      values.push(data.status)
      paramCount++
    }

    if (data.lastLoginAt !== undefined) {
      updates.push(`last_login_at = $${paramCount}`)
      values.push(new Date(data.lastLoginAt))
      paramCount++
    }

    if (data.passwordHash !== undefined) {
      updates.push(`password_hash = $${paramCount}`)
      values.push(data.passwordHash)
      paramCount++
    }

    if (updates.length === 0) {
      return (await this.findById(userId)) as User
    } 

    const query = `UPDATE users 
                   SET ${updates.join(', ')}
                   WHERE user_id = $1
                   RETURNING ${generateSelectQuery(USER_COLUMNS)}`

    try {
      const result = await pool.query(query, values)
      logger.debug('User updated successfully', { userId })
      return mapDbRowToCamelCase(result.rows[0]) as User
    } catch (error) {
      logger.error('Failed to update user', { userId, error })
      throw error
    }
  }

  /**
   * Get user password hash (for login)
   */
  static async getPasswordHash(userId: string): Promise<string | null> {
    const pool = getPool()

    const result = await pool.query(
      `SELECT password_hash FROM users WHERE user_id = $1 AND deleted_at IS NULL`,
      [userId]
    )

    return result.rows[0]?.password_hash || null
  }
}