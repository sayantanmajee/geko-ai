/**
 * Auth Service
 * 
 * Core authentication logic.
 */

import { createLogger, InvalidCredentialsError, UserNotFoundError } from '@packages/shared-utils'
import { UserService } from './user.service'
import { UserQueries } from '../database/queries/users'
import { TenantQueries } from '../database/queries/tenants'
import { TokenService } from './token.service'
import type { User, Tenant } from '@packages/shared-types'

const logger = createLogger('auth-service')

interface LoginPayload {
  email: string
  password: string
  tenantId?:  string
}

interface TokenResponse {
  ok: true
  accessToken: string
  refreshToken:  string
  expiresIn: number
  user: User
  tenant: Tenant
}

export class AuthService {
  /**
   * Local authentication (email + password)
   */
  static async login(payload: LoginPayload): Promise<TokenResponse> {
    logger.info('Login attempt', { email: payload.email })

    let user: User | null = null
    let tenant: Tenant | null = null

    // If tenantId provided, find user in that tenant
    if (payload.tenantId) {
      user = await UserQueries.findByEmail(payload.tenantId, payload.email)
      tenant = await TenantQueries. findById(payload.tenantId)
    } else {
      // Find user globally (could be in any tenant)
      user = await UserQueries.findByEmailGlobal(payload.email)
      if (user) {
        tenant = await TenantQueries.findById(user.tenantId)
      }
    }

    if (!user || !tenant) {
      logger.warn('Login failed:  user not found', { email: payload. email })
      throw new InvalidCredentialsError()
    }

    // Verify password
    const passwordHash = await UserQueries.getPasswordHash(user. userId)
    if (!passwordHash) {
      throw new InvalidCredentialsError()
    }

    const isPasswordValid = await UserService.verifyPassword(payload.password, passwordHash)
    if (!isPasswordValid) {
      logger.warn('Login failed: invalid password', { email: payload.email })
      throw new InvalidCredentialsError()
    }

    // Update last login
    await UserQueries.update(user.userId, {
      lastLoginAt: Date.now(),
    })

    // Issue tokens
    const accessToken = TokenService.issueAccessToken({
      userId: user.userId,
      tenantId: user. tenantId,
      role: user.role,
    })

    const refreshToken = TokenService.issueRefreshToken({
      userId: user.userId,
      tenantId: user.tenantId,
    })

    logger.info('User logged in successfully', { userId: user.userId })

    return {
      ok: true,
      accessToken,
      refreshToken,
      expiresIn: 900, // 15 minutes
      user,
      tenant,
    }
  }

  /**
   * Refresh access token
   */
  static async refreshToken(refreshToken: string): Promise<{
    ok: true
    accessToken: string
    expiresIn: number
  }> {
    const decoded = TokenService.verifyToken(refreshToken)

    if (decoded.type !== 'refresh') {
      throw new InvalidCredentialsError('Invalid token type')
    }

    const user = await UserQueries.findById(decoded.sub)
    if (!user) {
      throw new UserNotFoundError(decoded.sub)
    }

    const newAccessToken = TokenService.issueAccessToken({
      userId: user.userId,
      tenantId: user.tenantId,
      role: user.role,
    })

    logger.debug('Access token refreshed', { userId: user.userId })

    return {
      ok: true,
      accessToken: newAccessToken,
      expiresIn: 900,
    }
  }

  /**
   * Validate access token
   */
  static validateAccessToken(token: string): { userId: string; tenantId: string; role: string } {
    const decoded = TokenService. verifyToken(token)

    if (decoded.type !== 'access') {
      throw new InvalidCredentialsError('Invalid token type')
    }

    return {
      userId: decoded.sub,
      tenantId: decoded. tenantId,
      role:  decoded.role,
    }
  }
}