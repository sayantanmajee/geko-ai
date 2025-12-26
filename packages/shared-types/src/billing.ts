/**
 * Billing & Quota Management
 * 
 * Three pricing models:
 * 1. FREE: No charge, limited tokens (based on provider free tier)
 * 2. PRO: $29/month, unlimited tokens, all models
 * 3. PAYGO: Per-token billing with markup
 * 
 * Quota enforcement:
 * - Check BEFORE calling AI (prevent overage)
 * - Soft limit (80%): Warning email
 * - Hard limit (100%): Deny request
 */

import type { UUID, Timestamp, PlanType } from './common';

/**
 * Workspace subscription to billing plan
 */
export interface Subscription {
  subscriptionId:  string;
  workspaceId: string;
  tenantId: string;
  plan: PlanType;
  status: 'active' | 'paused' | 'cancelled';
  
  // Payment integration
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  
  // Current usage (reset monthly)
  currentMonthCost: number;
  budgetLimit?:  number;     // For PayGo tier
  
  // Timestamps
  startedAt: Timestamp;
  renewedAt?: Timestamp;
  cancelledAt?: Timestamp;
  createdAt: Timestamp;
}

/**
 * Token usage record (every AI call)
 * Used for billing, quotas, analytics
 */
export interface TokenUsage {
  usageId: string;
  workspaceId: string;
  userId: string;
  modelId:  string;
  conversationId?: string;
  
  // Token counts from provider
  inputTokens: number;
  outputTokens: number;
  
  // Cost calculation
  costToUs: number;        // What we paid provider
  chargeToUser: number;    // What we charge user (with markup)
  
  createdAt: Timestamp;
}

/**
 * Monthly usage aggregation
 * Used for invoicing and analytics
 */
export interface MonthlyUsage {
  workspaceId: string;
  month: string;           // "2024-01"
  totalTokens: number;
  totalCostToUs: number;
  totalChargeToUser: number;
  byModel:  Record<string, {
    tokens: number;
    costToUs: number;
    chargeToUser: number;
  }>;
}

/**
 * Invoice sent to customer
 * Created monthly for subscriptions or on-demand for PayGo
 */
export interface Invoice {
  invoiceId:  string;
  workspaceId: string;
  tenantId: string;
  
  // Payment tracking
  stripeInvoiceId?: string;
  amount: number;          // In cents (e.g., 2900 = $29.00)
  currency: string;        // "usd"
  
  // Status machine:  draft → sent → paid (or failed)
  status: 'draft' | 'sent' | 'paid' | 'failed';
  
  // Period
  periodStart: Timestamp;
  periodEnd: Timestamp;
  dueDate: Timestamp;
  paidAt?: Timestamp;
  
  createdAt: Timestamp;
}

/**
 * Usage quota for a workspace
 * Resets monthly
 */
export interface Quota {
  quotaId: string;
  workspaceId: string;
  
  // Limits (based on plan)
  tokensLimitPerMonth: number;
  requestsLimitPerMonth: number;
  
  // Current month progress
  tokensUsedThisMonth: number;
  requestsUsedThisMonth: number;
  
  // Reset date
  resetAt: Timestamp;
  createdAt: Timestamp;
}

/**
 * Cost matrix for all models
 * Updated when new models release or pricing changes
 */
export interface ModelPricing {
  modelId:  string;
  provider: string;
  costPerMInputTokens: number;
  costPerMOutputTokens: number;
  markupPercentage: number;  // We charge 1.5x what we pay (default 50%)
  effectiveFrom: Timestamp;
  effectiveTo?:  Timestamp;
}