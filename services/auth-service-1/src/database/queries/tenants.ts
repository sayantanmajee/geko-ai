/**
 * Tenant Queries
 * 
 * All database operations for tenants.
 */

import { getPool } from '../../config/database'
import { createLogger } from '@packages/shared-utils'
import type { Tenant } from '@packages/shared-types'
import { generateSelectQuery, mapDbRowToCamelCase } from '../../utils/db-mapper.utils'

const logger = createLogger('tenant-queries')

const TENANT_COLUMNS = ['tenant_id', 'name', 'plan', 'status', 'created_at', 'updated_at']

export class TenantQueries {
  /**
   * Create a new tenant
   */
  static async create(data: {
    name: string
    plan? :  'free' | 'pro' | 'enterprise'
  }): Promise<Tenant> {
    const pool = getPool()

    logger.debug('Creating tenant', { name: data.name })

    try {
      const result = await pool.query(
        `INSERT INTO tenants (name, plan, status)
         VALUES ($1, $2, 'active')
         RETURNING ${generateSelectQuery(TENANT_COLUMNS)}`,
        [data.name, data.plan || 'free']
      )

      const tenant = mapDbRowToCamelCase(result.rows[0]) as Tenant
      logger. debug('Tenant created successfully', { tenantId: tenant.tenantId })
      return tenant
    } catch (error) {
      logger.error('Failed to create tenant', {
        error: (error as Error).message,
        name: data.name,
      })
      throw error
    }
  }

  /**
   * Find tenant by ID
   */
  static async findById(tenantId: string): Promise<Tenant | null> {
    const pool = getPool()

    const result = await pool.query(
      `SELECT ${generateSelectQuery(TENANT_COLUMNS)}
       FROM tenants
       WHERE tenant_id = $1 AND deleted_at IS NULL`,
      [tenantId]
    )

    return result.rows[0] ?  (mapDbRowToCamelCase(result.rows[0]) as Tenant) : null
  }

  /**
   * Find tenant by name
   */
  static async findByName(name:  string): Promise<Tenant | null> {
    const pool = getPool()

    const result = await pool.query(
      `SELECT ${generateSelectQuery(TENANT_COLUMNS)}
       FROM tenants
       WHERE name = $1 AND deleted_at IS NULL`,
      [name]
    )

    return result.rows[0] ? (mapDbRowToCamelCase(result.rows[0]) as Tenant) : null
  }

  /**
   * Update tenant
   */
  static async update(
    tenantId: string,
    data:  Partial<{ name:  string; plan:  string; status: string }>
  ): Promise<Tenant> {
    const pool = getPool()

    const updates: string[] = []
    const values: any[] = [tenantId]
    let paramCount = 2

    if (data.name !== undefined) {
      updates.push(`name = $${paramCount}`)
      values.push(data.name)
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
                   RETURNING ${generateSelectQuery(TENANT_COLUMNS)}`

    const result = await pool.query(query, values)
    return mapDbRowToCamelCase(result.rows[0]) as Tenant
  }
}