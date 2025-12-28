/**
 * Database Row Types (snake_case - as they come from DB)
 * 
 * These represent the actual database columns.
 * Mapped to camelCase at the application layer.
 */

export interface TenantDbRow {
  tenant_id:  string
  name: string
  plan: string
  status: string
  stripe_customer_id: string | null
  metadata: Record<string, unknown>
  created_at: string
  updated_at: string
  deleted_at: string | null
}

export interface UserDbRow {
  user_id: string
  tenant_id: string
  email:  string
  password_hash: string | null
  name: string | null
  role: string
  status: string
  last_login_at: string | null
  created_at: string
  updated_at: string
  deleted_at: string | null
}

export interface WorkspaceDbRow {
  workspace_id: string
  tenant_id: string
  name:  string
  description: string | null
  icon_url: string | null
  created_by: string
  status: string
  created_at:  string
  updated_at: string
  deleted_at: string | null
}

export interface WorkspaceConfigDbRow {
  config_id: string
  workspace_id: string
  enabled_models: any
  enabled_mcps: any
  custom_settings: any
  created_at: string
  updated_at:  string
}

export interface WorkspaceQuotaDbRow {
  quota_id: string
  workspace_id: string
  tokens_limit: number
  tokens_used:  number
  requests_limit: number
  requests_used: number
  files_limit: number
  files_used: number
  reset_at: string | null
  created_at: string
  updated_at: string
}

export interface AuditLogDbRow {
  log_id: string
  tenant_id: string
  workspace_id: string | null
  user_id: string | null
  action: string
  resource: string | null
  resource_id: string | null
  details: Record<string, unknown> | null
  ip_address:  string | null
  user_agent: string | null
  status: string
  error_message: string | null
  created_at: string
}

export interface OAuthTokenDbRow {
  token_id: string
  user_id: string
  provider: string
  provider_user_id: string
  access_token: string
  refresh_token: string | null
  expires_at: string | null
  created_at:  string
  updated_at: string
}

export interface SessionDbRow {
  session_id: string
  user_id:  string
  tenant_id: string
  workspace_id: string | null
  access_token_id: string | null
  ip_address: string | null
  user_agent: string | null
  last_activity_at: string
  expires_at: string | null
  created_at: string
}