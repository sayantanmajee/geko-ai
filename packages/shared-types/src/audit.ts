/**
 * Audit Logging
 * 
 * Log all significant actions for: 
 * - Security audits
 * - Compliance (GDPR, etc.)
 * - Debugging user issues
 * - Analytics
 * 
 * Rule: Log before action, include results
 */

import type { UUID, Timestamp } from './common';

export type AuditAction =
  // User actions
  | 'USER_REGISTERED'
  | 'USER_LOGIN'
  | 'USER_LOGOUT'
  | 'USER_PASSWORD_CHANGED'
  
  // Workspace actions
  | 'WORKSPACE_CREATED'
  | 'WORKSPACE_UPDATED'
  | 'WORKSPACE_DELETED'
  
  // Member actions
  | 'MEMBER_INVITED'
  | 'MEMBER_JOINED'
  | 'MEMBER_REMOVED'
  | 'MEMBER_ROLE_CHANGED'
  
  // Model actions
  | 'MODEL_ENABLED'
  | 'MODEL_DISABLED'
  
  // Chat actions
  | 'CHAT_CREATED'
  | 'CHAT_COMPLETED'
  
  // Quota/Billing actions
  | 'QUOTA_CHECKED'
  | 'QUOTA_EXCEEDED'
  | 'PLAN_UPGRADED'
  | 'PLAN_DOWNGRADED'
  
  // Payment actions
  | 'PAYMENT_INITIATED'
  | 'PAYMENT_COMPLETED'
  | 'PAYMENT_FAILED';

/**
 * Audit log entry
 */
export interface AuditLog {
  auditLogId: string;
  tenantId: string;
  workspaceId?:  string;
  userId?:  string;
  
  // What happened
  action: AuditAction;
  resourceType: string;    // e.g., "workspace", "user"
  resourceId: string;
  
  // How it changed
  changes?:  Record<string, {
    before: any;
    after: any;
  }>;
  
  // Context
  ipAddress?: string;
  userAgent?: string;
  
  createdAt: Timestamp;
}