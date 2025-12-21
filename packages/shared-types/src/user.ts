/**
 * User Type Definitions
 * 
 * A User always belongs to exactly ONE Tenant.
 * Identity (userId + tenantId) is the key. 
 */

export type UserRole = 'owner' | 'member' | 'admin'
export type UserStatus = 'active' | 'inactive' | 'deleted'

export interface User {
  userId: string
  tenantId: string
  email: string
  name?:  string
  role: UserRole
  status: UserStatus
  lastLoginAt?: number
  createdAt: number
  updatedAt: number
  metadata?: Record<string, unknown>
}

export interface UserLoginRecord {
  userId: string
  tenantId: string
  loginAt: number
  ipAddress?:  string
  userAgent?: string
}

/**
 * Local auth (username + password)
 * Stored in DB, hashed
 */
export interface LocalAuthCredential {
  userId: string
  email: string
  passwordHash: string
  createdAt: number
  lastChangedAt: number
}

/**
 * OAuth external identity
 * Links external provider (Google, GitHub) to user
 */
export interface OAuthProvider {
  userId: string
  provider: 'google' | 'github'
  providerId: string
  accessToken?:  string
  refreshToken?: string
  expiresAt?: number
  createdAt: number
  updatedAt: number
}