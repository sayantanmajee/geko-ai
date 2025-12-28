/**
 * Token Service
 * 
 * Handles JWT issuance and validation.
 */

import jwt from 'jsonwebtoken'
import { createLogger, AppError } from '@package/shared-utils'
import { getConfig } from '../config/index'
import type { JWTPayload } from '@package/shared-types'

const logger = createLogger('token-service')

export class TokenService {
  /**
   * Issue access token
   */
  static issueAccessToken(payload: {
    userId: string
    tenantId: string
    workspaceId?: string
    role:  string
  }): string {
    const config = getConfig()

    const jwtPayload: JWTPayload = {
      sub: payload.userId,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + this.getExpiryInSeconds(config.jwtAccessExpiry),
      tenantId: payload.tenantId,
      role: payload.role,
      type: 'access',
    }

    if (payload.workspaceId) {
      ;(jwtPayload as any).workspaceId = payload.workspaceId
    }

    return jwt.sign(jwtPayload, config.jwtSecret, { algorithm: 'HS256' })
  }

  /**
   * Issue refresh token
   */
  static issueRefreshToken(payload:  { userId: string; tenantId:  string }): string {
    const config = getConfig()

    const jwtPayload: JWTPayload = {
      sub:  payload.userId,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + this.getExpiryInSeconds(config.jwtRefreshExpiry),
      tenantId: payload.tenantId,
      role: '', // Refresh tokens don't need role
      type: 'refresh',
    }

    return jwt.sign(jwtPayload, config.jwtSecret, { algorithm: 'HS256' })
  }

  /**
   * Verify and decode token
   */
  static verifyToken(token: string): JWTPayload {
    const config = getConfig()

    try {
      const decoded = jwt.verify(token, config.jwtSecret, { algorithms: ['HS256'] })
      return decoded as JWTPayload
    } catch (error) {
      logger.warn('Token verification failed', { error:  (error as Error).message })
      throw new AppError('INVALID_TOKEN', 401, 'Invalid or expired token')
    }
  }

  /**
   * Convert expiry string (e.g., "15m", "7d") to seconds
   */
  private static getExpiryInSeconds(expiry: string): number {
    const match = expiry.match(/^(\d+)([mhd])$/)

    if (!match) {
      throw new Error(`Invalid expiry format: ${expiry}`)
    }

    const value = parseInt(match[1], 10)
    const unit = match[2]

    switch (unit) {
      case 'm':
        return value * 60
      case 'h':
        return value * 3600
      case 'd': 
        return value * 86400
      default:
        throw new Error(`Unknown unit: ${unit}`)
    }
  }
}