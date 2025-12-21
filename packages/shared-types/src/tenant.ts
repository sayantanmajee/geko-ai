/**
 * Tenant Type Definitions
 * 
 * A Tenant is the top-level isolation boundary. 
 * All data, users, and operations are scoped to a tenant.
 * 
 * Rule: Every database query MUST filter by tenantId. 
 */

export type Plan = 'free' | 'pro' | 'enterprise'
export type TenantStatus = 'active' | 'suspended' | 'deleted'

export interface Tenant {
  tenantId: string
  name:  string
  plan: Plan
  status: TenantStatus
  createdAt: number
  updatedAt: number
  metadata?: Record<string, unknown>
}

export interface TenantQuota {
  tenantId: string
  plan: Plan
  requestsPerDay: number
  tokensPerDay: number
  maxTools: number
  customModels: boolean
}

export const DEFAULT_QUOTAS: Record<Plan, Omit<TenantQuota, 'tenantId'>> = {
  free: {
    plan: 'free',
    requestsPerDay: 100,
    tokensPerDay: 10_000,
    maxTools: 3,
    customModels: false,
  },
  pro: {
    plan: 'pro',
    requestsPerDay: 10_000,
    tokensPerDay: 500_000,
    maxTools: 20,
    customModels: true,
  },
  enterprise:  {
    plan: 'enterprise',
    requestsPerDay:  -1, // unlimited
    tokensPerDay: -1,
    maxTools: -1,
    customModels:  true,
  },
}