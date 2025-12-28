/**
 * Database Queries
 * 
 * All database operations centralized here
 * Ensures SQL injection prevention (parameterized queries)
 * Single responsibility:  data access only
 */

import { query, queryOne, execute, transaction } from '@package/shared-utils';
import type { UserRecord, TenantRecord } from '../types/index.js';

/**
 * TENANT QUERIES
 */

export async function getTenantBySlug(slug: string): Promise<TenantRecord | null> {
  return queryOne<TenantRecord>(
    'SELECT * FROM tenants WHERE slug = $1 AND status = $2',
    [slug, 'active']
  );
}

export async function getTenantById(tenantId: string): Promise<TenantRecord | null> {
  return queryOne<TenantRecord>(
    'SELECT * FROM tenants WHERE tenantId = $1 AND status = $2',
    [tenantId, 'active']
  );
}

export async function createTenant(
  tenantId: string,
  name: string,
  slug: string
): Promise<TenantRecord> {
  const result = await query<TenantRecord>(
    `INSERT INTO tenants (tenantId, name, slug, status, createdAt, updatedAt)
     VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
     RETURNING *`,
    [tenantId, name, slug, 'active']
  );
  
  if (result.length === 0) {
    throw new Error('Failed to create tenant');
  }
  
  return result[0];
}

/**
 * USER QUERIES
 */

export async function getUserByEmail(
  email: string,
  tenantId: string
): Promise<UserRecord | null> {
  return queryOne<UserRecord>(
    `SELECT * FROM users 
     WHERE email = $1 AND tenantId = $2 AND status = $3`,
    [email, tenantId, 'active']
  );
}

export async function getUserById(
  userId: string,
  tenantId: string
): Promise<UserRecord | null> {
  return queryOne<UserRecord>(
    `SELECT * FROM users 
     WHERE userId = $1 AND tenantId = $2 AND status = $3`,
    [userId, tenantId, 'active']
  );
}

export async function createUser(
  userId: string,
  tenantId: string,
  email: string,
  passwordHash: string,
  firstName?:  string,
  lastName?: string
): Promise<UserRecord> {
  const result = await query<UserRecord>(
    `INSERT INTO users 
     (userId, tenantId, email, passwordHash, firstName, lastName, 
      emailVerified, status, createdAt, updatedAt)
     VALUES ($1, $2, $3, $4, $5, $6, false, 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
     RETURNING *`,
    [userId, tenantId, email, passwordHash, firstName, lastName]
  );
  
  if (result.length === 0) {
    throw new Error('Failed to create user');
  }
  
  return result[0];
}

export async function getUserByIdAcrossTenants(userId: string): Promise<UserRecord | null> {
  return queryOne<UserRecord>(
    'SELECT * FROM users WHERE userId = $1 AND status = $2',
    [userId, 'active']
  );
}

export async function updateLastLogin(userId: string): Promise<void> {
  await execute(
    'UPDATE users SET lastLoginAt = CURRENT_TIMESTAMP WHERE userId = $1',
    [userId]
  );
}

export async function verifyEmail(userId: string): Promise<void> {
  await execute(
    'UPDATE users SET emailVerified = true WHERE userId = $1',
    [userId]
  );
}

/**
 * TRANSACTION:  Register user + tenant
 * 
 * Atomic operation:  both succeed or both fail
 */
export async function registerUserWithTenant(
  userId: string,
  tenantId: string,
  tenantName: string,
  tenantSlug: string,
  email: string,
  passwordHash: string,
  firstName?:  string,
  lastName?: string
): Promise<{ user: UserRecord; tenant: TenantRecord }> {
  return transaction(async client => {
    // Create tenant
    const tenantResult = await client.query(
      `INSERT INTO tenants (tenantId, name, slug, status, createdAt, updatedAt)
       VALUES ($1, $2, $3, 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
       RETURNING *`,
      [tenantId, tenantName, tenantSlug]
    );
    
    if (tenantResult.rowCount === 0) {
      throw new Error('Failed to create tenant');
    }
    
    const tenant = tenantResult.rows[0] as TenantRecord;
    
    // Create user
    const userResult = await client.query(
      `INSERT INTO users 
       (userId, tenantId, email, passwordHash, firstName, lastName, 
        emailVerified, status, createdAt, updatedAt)
       VALUES ($1, $2, $3, $4, $5, $6, false, 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
       RETURNING *`,
      [userId, tenantId, email, passwordHash, firstName, lastName]
    );
    
    if (userResult.rowCount === 0) {
      throw new Error('Failed to create user');
    }
    
    const user = userResult.rows[0] as UserRecord;
    
    return { user, tenant };
  });
}

/**
 * SESSION QUERIES
 */

export async function createSession(
  sessionId: string,
  userId:  string,
  tenantId:  string,
  accessTokenHash: string,
  refreshTokenHash: string,
  ipAddress?:  string,
  userAgent?: string
): Promise<void> {
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
  
  await execute(
    `INSERT INTO sessions 
     (sessionId, userId, tenantId, accessTokenHash, refreshTokenHash, 
      createdAt, expiresAt, ipAddress, userAgent)
     VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP, $6, $7, $8)`,
    [sessionId, userId, tenantId, accessTokenHash, refreshTokenHash, expiresAt, ipAddress, userAgent]
  );
}

export async function getSession(sessionId: string): Promise<any> {
  return queryOne(
    'SELECT * FROM sessions WHERE sessionId = $1 AND expiresAt > CURRENT_TIMESTAMP',
    [sessionId]
  );
}

export async function revokeSession(sessionId: string): Promise<void> {
  await execute(
    'UPDATE sessions SET revokedAt = CURRENT_TIMESTAMP WHERE sessionId = $1',
    [sessionId]
  );
}

/**
 * AUDIT LOG QUERIES
 */

export async function logAuditEvent(
  tenantId: string,
  userId: string,
  action: string,
  resourceType: string,
  resourceId:  string,
  details?:  Record<string, any>
): Promise<void> {
  await execute(
    `INSERT INTO audit_logs 
     (auditLogId, tenantId, userId, action, resourceType, resourceId, details, createdAt)
     VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)`,
    [tenantId, userId, action, resourceType, resourceId, JSON.stringify(details || {})]
  );
}