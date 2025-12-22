/**
 * User Queries
 * 
 * Database operations for users.
 */

import { getPool } from '../../config/database'
import type { User } from '@packages/shared-types'

interface UserCreateData {
  tenantId: string
  email:  string
  passwordHash?:  string
  name?:  string
  role?: 'owner' | 'admin' | 'member'
}

interface UserRow {
  user_id: string
  tenant_id: string
  email: string
  password_hash: string | null
  name: string | null
  role: string
  status: string
  last_login_at:  string | null
  created_at: string
  updated_at:  string
}

function rowToUser(row: UserRow): User {
  return {
    userId: row.user_id,
    tenantId: row.tenant_id,
    email: row.email,
    name: row.name || undefined,
    role: row.role as any,
    status: row.status as any,
    lastLoginAt:  row.last_login_at ?  new Date(row.last_login_at).getTime() : undefined,
    createdAt: new Date(row.created_at).getTime(),
    updatedAt: new Date(row.updated_at).getTime(),
  }
}

export class UserQueries {
  /**
   * Create a new user
   */
  static async create(data: UserCreateData): Promise<User> {
    const pool = getPool()

    const result = await pool.query(
      `INSERT INTO users (tenant_id, email, password_hash, name, role, status)
       VALUES ($1, $2, $3, $4, $5, 'active')
       RETURNING *`,
      [data.tenantId, data.email, data. passwordHash || null, data.name || null, data.role || 'member']
    )

    return rowToUser(result. rows[0])
  }

  /**
   * Find user by ID
   */
  static async findById(userId: string): Promise<User | null> {
    const pool = getPool()

    const result = await pool.query(
      `SELECT * FROM users
       WHERE user_id = $1 AND deleted_at IS NULL`,
      [userId]
    )

    return result.rows[0] ?  rowToUser(result.rows[0]) : null
  }

  /**
   * Find user by email in tenant
   */
  static async findByEmail(tenantId: string, email: string): Promise<User | null> {
    const pool = getPool()

    const result = await pool. query(
      `SELECT * FROM users
       WHERE tenant_id = $1 AND email = $2 AND deleted_at IS NULL`,
      [tenantId, email]
    )

    return result.rows[0] ? rowToUser(result.rows[0]) : null
  }

  /**
   * Find user by email (any tenant) - for OAuth
   */
  static async findByEmailGlobal(email: string): Promise<User | null> {
    const pool = getPool()

    const result = await pool.query(
      `SELECT * FROM users
       WHERE email = $1 AND deleted_at IS NULL`,
      [email]
    )

    return result.rows[0] ?  rowToUser(result.rows[0]) : null
  }

  /**
   * Update user
   */
  static async update(
    userId: string,
    data: Partial<{
      name:  string
      role:  string
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

    const query = `UPDATE users 
                   SET ${updates.join(', ')}
                   WHERE user_id = $1
                   RETURNING *`

    const result = await pool.query(query, values)

    return rowToUser(result. rows[0])
  }

  /**
   * Get user password hash (for login)
   */
  static async getPasswordHash(userId: string): Promise<string | null> {
    const pool = getPool()

    const result = await pool.query(
      `SELECT password_hash FROM users
       WHERE user_id = $1 AND deleted_at IS NULL`,
      [userId]
    )

    return result.rows[0]?.password_hash || null
  }
}