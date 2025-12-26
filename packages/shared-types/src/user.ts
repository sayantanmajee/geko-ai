/**
 * User Management
 * 
 * Users belong to a Tenant. 
 * Users can have multiple Workspaces.
 * User identity is (tenantId + userId)
 */

import type { UUID, Timestamp } from './common';

/**
 * User entity
 */
export interface User {
  userId:  string;
  tenantId:  string;
  email: string;
  firstName?: string;
  lastName?: string;
  emailVerified: boolean;
  status: 'active' | 'suspended' | 'deleted';
  lastLoginAt?: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/**
 * Database representation (has passwordHash)
 * Never exposed in API responses
 */
export interface UserWithPassword extends User {
  passwordHash:  string;
}

/**
 * User profile (public data)
 */
export interface UserProfile {
  userId: string;
  email: string;
  firstName?:  string;
  lastName?: string;
  avatar?: string;
}