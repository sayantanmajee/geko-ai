/**
 * Tenant Management
 * 
 * A tenant is a complete isolated environment for an organization. 
 * All data in GEKO-AI is scoped to a tenant.
 * 
 * Isolation rules:
 * - No cross-tenant queries
 * - No cross-tenant user access
 * - All RLS policies filter by tenantId
 */

import type { UUID, Timestamp } from './common';

/**
 * Tenant entity (organization)
 */
export interface Tenant {
  tenantId: string;
  name: string;
  slug: string;           // URL-friendly identifier
  status: 'active' | 'suspended' | 'deleted';
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/**
 * Create tenant input
 */
export interface CreateTenantInput {
  name:  string;
  slug: string;
}

/**
 * Tenant metadata for analytics
 */
export interface TenantStats {
  tenantId: string;
  totalUsers: number;
  totalWorkspaces: number;
  activeWorkspacesCount: number;
  totalTokensUsedThisMonth: number;
  totalCostThisMonth: number;
}