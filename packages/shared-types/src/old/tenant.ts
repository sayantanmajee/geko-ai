/**
 * Tenant Type Definitions
 * 
 * A Tenant is the top-level isolation boundary. 
 * All data, users, and operations are scoped to a tenant.
 * 
 * Rule: Every database query MUST filter by tenantId. 
 */
export interface Tenant {
  tenantId: string;
  name: string;
  slug: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateTenantInput {
  name: string;
  slug: string;
}