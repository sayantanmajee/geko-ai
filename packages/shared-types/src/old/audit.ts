export type AuditAction =
  | 'USER_CREATED'
  | 'USER_LOGIN'
  | 'USER_LOGOUT'
  | 'USER_PASSWORD_CHANGED'
  | 'WORKSPACE_CREATED'
  | 'WORKSPACE_UPDATED'
  | 'WORKSPACE_DELETED'
  | 'MEMBER_INVITED'
  | 'MEMBER_JOINED'
  | 'MEMBER_REMOVED'
  | 'MEMBER_ROLE_CHANGED'
  | 'MODEL_ENABLED'
  | 'MODEL_DISABLED'
  | 'CHAT_INITIATED'
  | 'CHAT_COMPLETED'
  | 'QUOTA_EXCEEDED'
  | 'PLAN_UPGRADED'
  | 'PLAN_DOWNGRADED'
  | 'PAYMENT_PROCESSED'
  | 'PAYMENT_FAILED';

export interface AuditLog {
  auditLogId: string;
  workspaceId: string;
  userId: string;
  action:  AuditAction;
  resourceType: string;
  resourceId:  string;
  changes?:  Record<string, any>;
  ipAddress?:  string;
  userAgent?: string;
  createdAt: Date;
}