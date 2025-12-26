export interface RequestContext {
  requestId: string;
  userId:  string;
  tenantId: string;
  workspaceId: string;
  userRole: string;
  timestamp: Date;
}

export interface ContextData {
  req: any;
  res: any;
  next: any;
}