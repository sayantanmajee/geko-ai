/**
 * Authentication Service
 * 
 * Core business logic for auth operations
 * - Register new tenant + user
 * - Login user
 * - Refresh tokens
 * - Logout
 * 
 * Dependencies injected (testability)
 */

import { randomUUID } from 'crypto';
import { createLogger } from '@package/shared-utils';
import {
  hashPassword,
  verifyPassword,
  createAccessToken,
  createRefreshToken,
  hashString,
} from '@package/shared-utils';
import {
  AuthenticationError,
  AuthorizationError,
  ValidationError,
} from '@package/shared-types';
import type { JWTPayload, AuthResponse, AuthUser } from '@package/shared-types';
import * as db from '../db/queries.js';
import type { UserRecord } from '../types/index.js';

const logger = createLogger('auth-service');

/**
 * Register new user + tenant
 */
export async function register(input: {
  tenantName: string;
  tenantSlug: string;
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
}): Promise<AuthResponse> {
  logger.info(`Registration attempt:  ${input.email}`);
  
  // Validate inputs
  if (!input.email || !input.password || ! input.tenantName || !input.tenantSlug) {
    throw new ValidationError('Missing required fields');
  }
  
  if (input.password.length < 8) {
    throw new ValidationError('Password must be at least 8 characters');
  }
  
  // Check if tenant already exists
  const existingTenant = await db.getTenantBySlug(input.tenantSlug);
  if (existingTenant) {
    logger.warn(`Tenant slug already exists: ${input.tenantSlug}`);
    throw new ValidationError('Tenant slug already exists');
  }
  
  // Generate IDs
  const tenantId = randomUUID();
  const userId = randomUUID();
  
  // Hash password
  const passwordHash = hashPassword(input.password);
  
  // Create tenant + user in transaction
  const { user, tenant } = await db.registerUserWithTenant(
    userId,
    tenantId,
    input.tenantName,
    input.tenantSlug,
    input.email,
    passwordHash,
    input.firstName,
    input.lastName
  );
  
  // Generate tokens
  const tokens = generateTokens({
    userId:  user.userId,
    tenantId: tenant.tenantId,
    email: user.email,
    role: 'owner',
  });
  
  // Create session
  const sessionId = randomUUID();
  await db.createSession(
    sessionId,
    user.userId,
    tenant.tenantId,
    hashString(tokens.accessToken),
    hashString(tokens.refreshToken)
  );
  
  // Log event
  await db.logAuditEvent(
    tenant.tenantId,
    user.userId,
    'USER_REGISTERED',
    'user',
    user.userId
  );
  
  logger.info(`✓ User registered: ${input.email}`);
  
  return {
    ok: true,
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
    user: userToResponse(user),
    expiresIn: 900, // 15 minutes
  };
}

/**
 * Login user by email + password
 */
export async function login(input: {
  tenantId: string;
  email: string;
  password: string;
  ipAddress?: string;
  userAgent?: string;
}): Promise<AuthResponse> {
  logger.info(`Login attempt: ${input.email} (tenant: ${input.tenantId})`);
  
  // Validate inputs
  if (!input.email || !input.password || !input.tenantId) {
    throw new ValidationError('Missing required fields');
  }
  
  // Find user
  const user = await db.getUserByEmail(input.email, input.tenantId);
  if (!user) {
    logger.warn(`User not found: ${input.email}`);
    throw new AuthenticationError('Invalid email or password');
  }
  
  // Verify password
  if (!verifyPassword(input.password, user.passwordHash)) {
    logger.warn(`Invalid password for user: ${input.email}`);
    throw new AuthenticationError('Invalid email or password');
  }
  
  // Check user status
  if (user.status !== 'active') {
    logger.warn(`User account inactive: ${input.email}`);
    throw new AuthorizationError('User account is not active');
  }
  
  // Generate tokens
  const tokens = generateTokens({
    userId: user.userId,
    tenantId: input.tenantId,
    email: user.email,
    role: 'member', // Default role, overridden by workspace role later
  });
  
  // Create session
  const sessionId = randomUUID();
  await db.createSession(
    sessionId,
    user.userId,
    input.tenantId,
    hashString(tokens.accessToken),
    hashString(tokens.refreshToken),
    input.ipAddress,
    input.userAgent
  );
  
  // Update last login
  await db.updateLastLogin(user.userId);
  
  // Log event
  await db.logAuditEvent(
    input.tenantId,
    user.userId,
    'USER_LOGIN',
    'user',
    user.userId,
    { ipAddress:  input.ipAddress }
  );
  
  logger.info(`✓ Login successful: ${input.email}`);
  
  return {
    ok: true,
    accessToken:  tokens.accessToken,
    refreshToken: tokens.refreshToken,
    user: userToResponse(user),
    expiresIn: 900, // 15 minutes
  };
}

/**
 * Refresh access token using refresh token
 */
export async function refreshToken(input: {
  refreshToken: string;
}): Promise<{ accessToken: string; expiresIn: number }> {
  logger.info('Token refresh attempt');
  
  if (!input.refreshToken) {
    throw new ValidationError('Refresh token required');
  }
  
  // Verify refresh token
  let payload: JWTPayload;
  try {
    const { verifyToken } = await import('@package/shared-utils');
    payload = verifyToken(input.refreshToken);
  } catch (error) {
    logger.warn('Invalid refresh token');
    throw new AuthenticationError('Invalid or expired refresh token');
  }
  
  // Check token type
  if (payload.type !== 'refresh') {
    throw new AuthenticationError('Invalid token type');
  }
  
  // Get user to ensure still exists and is active
  const user = await db.getUserById(payload.sub, payload.tenantId);
  if (!user) {
    throw new AuthenticationError('User not found');
  }
  
  if (user.status !== 'active') {
    throw new AuthorizationError('User account is not active');
  }
  
  // Generate new access token
  const { createAccessToken } = await import('@package/shared-utils');
  const accessToken = createAccessToken({
    sub: user.userId,
    tenantId: user.tenantId,
    role: 'member'
  });
  
  logger.info(`✓ Token refreshed for user: ${user.userId}`);
  
  return {
    accessToken,
    expiresIn: 900,
  };
}

/**
 * Logout user
 */
export async function logout(input: {
  sessionId: string;
  tenantId: string;
  userId: string;
}): Promise<void> {
  logger.info(`Logout:  user=${input.userId}`);
  
  await db.revokeSession(input.sessionId);
  
  await db.logAuditEvent(
    input.tenantId,
    input.userId,
    'USER_LOGOUT',
    'user',
    input.userId
  );
  
  logger.info(`✓ Logout successful`);
}

/**
 * Helper:  Generate access + refresh tokens
 */
function generateTokens(payload: {
  userId: string;
  tenantId: string;
  email: string;
  role:  string;
}): { accessToken: string; refreshToken: string } {
  // const now = Math.floor(Date.now() / 1000);
  
  const accessPayload: JWTPayload = {
    sub: payload.userId,
    tenantId: payload.tenantId,
    role: payload.role,
    type: 'access'
  };
  
  const refreshPayload: JWTPayload = {
    sub: payload.userId,
    tenantId: payload.tenantId,
    role:  payload.role,
    type: 'refresh'
  };
  
  return {
    accessToken: createAccessToken(accessPayload),
    refreshToken: createRefreshToken(refreshPayload),
  };
}

/**
 * Helper: Convert user record to API response
 */
function userToResponse(user: UserRecord): AuthUser {
  return {
    userId: user.userId,
    email: user.email,
    tenantId: user.tenantId,
    firstName: user.firstName,
    lastName: user.lastName,
    createdAt: user.createdAt,
  };
}