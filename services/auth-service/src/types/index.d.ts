/**
 * Auth Service Types
 * 
 * Local types used only in this service
 * Reusable types imported from @package/shared-types
 */

/**
 * User from database (includes password hash)
 * NEVER expose in API responses
 */
export interface UserRecord {
  userId: string;
  tenantId: string;
  email: string;
  firstName?:  string;
  lastName?: string;
  passwordHash: string;
  emailVerified:  boolean;
  status: 'active' | 'suspended' | 'deleted';
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Tenant record
 */
export interface TenantRecord {
  tenantId:  string;
  name: string;
  slug: string;
  status: 'active' | 'suspended' | 'deleted';
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Internal service response
 */
export interface ServiceResponse<T> {
  success:  boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}