/**
 * Tenant Queries
 * 
 * Database operations for tenants. 
 */

import { getPool } from '../../config/database'
import type { Tenant } from '@packages/shared-types'

export class TenantQueries {
  /**
   * Create a new tenant
   */
  static async create(data: {
    name: string
    plan?:  'free' | 'pro' | 'enterprise'
  }): Promise<Tenant> {
    const pool = getPool()

    const result = await pool.query(
      `INSERT INTO tenants (name, plan, status)
       VALUES ($1, $2, 'active')
       RETURNING 
         tenant_id as tenantId,
         name,
         plan,
         status,
         created_at as createdAt,
         updated_at as updatedAt`,
      [data.name, data.plan || 'free']
    )

    return result.rows[0]
  }

  /**
   * Find tenant by ID
   */
  static async findById(tenantId: string): Promise<Tenant | null> {
    const pool = getPool()

    const result = await pool.query(
      `SELECT 
         tenant_id as tenantId,
         name,
         plan,
         status,
         created_at as createdAt,
         updated_at as updatedAt
       FROM tenants
       WHERE tenant_id = $1 AND deleted_at IS NULL`,
      [tenantId]
    )

    return result.rows[0] || null
  }

  /**
   * Find tenant by name
   */
  static async findByName(name: string): Promise<Tenant | null> {
    const pool = getPool()

    const result = await pool.query(
      `SELECT 
         tenant_id as tenantId,
         name,
         plan,
         status,
         created_at as createdAt,
         updated_at as updatedAt
       FROM tenants
       WHERE name = $1 AND deleted_at IS NULL`,
      [name]
    )

    return result.rows[0] || null
  }

  /**
   * Update tenant
   */
  static async update(
    tenantId: string,
    data:  Partial<{ name:  string; plan:  string; status: string }>
  ): Promise<Tenant> {
    const pool = getPool()

    const updates:  string[] = []
    const values:  any[] = [tenantId]
    let paramCount = 2

    if (data.name !== undefined) {
      updates.push(`name = $${paramCount}`)
      values. push(data.name)
      paramCount++
    }

    if (data.plan !== undefined) {
      updates.push(`plan = $${paramCount}`)
      values.push(data.plan)
      paramCount++
    }

    if (data.status !== undefined) {
      updates.push(`status = $${paramCount}`)
      values.push(data.status)
      paramCount++
    }

    const query = `UPDATE tenants 
                   SET ${updates.join(', ')}
                   WHERE tenant_id = $1
                   RETURNING 
                     tenant_id as tenantId,
                     name,
                     plan,
                     status,
                     created_at as createdAt,
                     updated_at as updatedAt`

    const result = await pool.query(query, values)

    return result. rows[0]
  }
}