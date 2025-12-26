import { PlanType } from "./billing";

export interface Workspace {
  workspaceId: string;
  tenantId: string;
  name: string;
  description?: string;
  plan: PlanType;
  createdAt: Date;
  updatedAt: Date;
}

export interface WorkspaceMember {
  memberId: string;
  workspaceId: string;
  userId: string;
  role: 'owner' | 'admin' | 'editor' | 'viewer';
  createdAt: Date;
}

export interface CreateWorkspaceInput {
  name: string;
  description?: string;
  plan?:  PlanType;
}

export interface UpdateWorkspaceInput {
  name?: string;
  description?: string;
  plan?: PlanType;
}

export interface InviteMemberInput {
  email:  string;
  role: 'admin' | 'editor' | 'viewer';
}

export interface InviteToken {
  inviteId: string;
  workspaceId: string;
  email: string;
  role:  'admin' | 'editor' | 'viewer';
  token: string;
  expiresAt: Date;
  createdAt: Date;
  acceptedAt?: Date;
}