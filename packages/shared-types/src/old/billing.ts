export type PlanType = 'free' | 'pro' | 'paygo';

export interface Subscription {
  subscriptionId: string;
  workspaceId: string;
  plan: PlanType;
  stripeCustomerId?:  string;
  stripeSubscriptionId?: string;
  currentMonthCost: number;
  budgetLimit?:  number;
  startedAt: Date;
  renewedAt?:  Date;
  cancelledAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface TokenUsage {
  usageId: string;
  workspaceId: string;
  userId: string;
  modelId: string;
  conversationId?: string;
  inputTokens: number;
  outputTokens: number;
  costToUs: number;
  chargeToUser: number;
  createdAt: Date;
}

export interface MonthlyUsage {
  workspaceId: string;
  month: string;
  totalTokens: number;
  totalCostToUs: number;
  totalChargeToUser: number;
  breakdownByModel:  Record<string, { tokens: number; cost: number }>;
}

export interface Invoice {
  invoiceId: string;
  workspaceId:  string;
  stripeInvoiceId?: string;
  amount: number;
  currency:  string;
  status: 'draft' | 'sent' | 'paid' | 'failed';
  periodStart: Date;
  periodEnd: Date;
  dueDate: Date;
  paidAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Quota {
  quotaId: string;
  workspaceId:  string;
  tokensLimitPerMonth: number;
  requestsLimitPerMonth: number;
  tokensUsedThisMonth: number;
  requestsUsedThisMonth: number;
  resetAt:  Date;
  createdAt:  Date;
  updatedAt: Date;
}