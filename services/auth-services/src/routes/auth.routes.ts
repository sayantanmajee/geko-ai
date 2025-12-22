/**
 * Auth Routes
 * 
 * Handles: 
 * - POST /v1/auth/register
 * - POST /v1/auth/login
 * - POST /v1/auth/refresh
 * - GET /v1/auth/me
 * - POST /v1/auth/logout
 */

import { Router, Request, Response, NextFunction } from 'express'
import { createLogger, ValidationError, isAppError } from '@packages/shared-utils'
import { AuthService } from '../services/auth.service'
import { UserService } from '../services/user.service'
import { TenantQueries } from '../database/queries/tenants'
import { TokenService } from '../services/token.service'

const logger = createLogger('auth-routes')
const router: Router = Router()

/**
 * POST /v1/auth/register
 * Register new user + create tenant
 */
router. post('/register', async (req:  Request, res: Response, next:  NextFunction) => {
  try {
    const { email, password, tenantName } = req.body

    // Validate input
    if (!email || !password || !tenantName) {
      throw new ValidationError('email, password, and tenantName are required')
    }

    logger.info('Registration request', { email, tenantName })

    // Create tenant
    const tenant = await TenantQueries.create({
      name: tenantName,
      plan: 'free',
    })

    // Register user (becomes owner of tenant)
    const user = await UserService.register(tenant.tenantId, email, password)

    // Update user role to owner
    await UserService. updateProfile(user.userId, {})

    // Issue tokens
    const accessToken = TokenService.issueAccessToken({
      userId: user.userId,
      tenantId: tenant.tenantId,
      role: 'owner',
    })

    const refreshToken = TokenService.issueRefreshToken({
      userId: user.userId,
      tenantId: tenant.tenantId,
    })

    res.status(201).json({
      ok: true,
      accessToken,
      refreshToken,
      expiresIn: 900,
      user: {
        userId:  user.userId,
        email: user.email,
        name: user.name,
      },
      tenant: {
        tenantId: tenant.tenantId,
        name: tenant. name,
      },
    })
  } catch (error) {
    logger.error('Registration failed', { error })
    next(error)
  }
})

/**
 * POST /v1/auth/login
 * Local authentication (email + password)
 */
router.post('/login', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password, tenantId } = req.body

    if (!email || !password) {
      throw new ValidationError('email and password are required')
    }

    logger.info('Login request', { email })

    const result = await AuthService.login({
      email,
      password,
      tenantId,
    })

    res.json(result)
  } catch (error) {
    logger.error('Login failed', { error })
    next(error)
  }
})

/**
 * POST /v1/auth/refresh
 * Refresh access token
 */
router.post('/refresh', async (req: Request, res:  Response, next: NextFunction) => {
  try {
    const { refreshToken } = req.body

    if (!refreshToken) {
      throw new ValidationError('refreshToken is required')
    }

    const result = await AuthService.refreshToken(refreshToken)

    res.json(result)
  } catch (error) {
    logger.error('Token refresh failed', { error })
    next(error)
  }
})

/**
 * GET /v1/auth/me
 * Get current user profile (requires auth token)
 */
router.get('/me', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers. authorization

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new ValidationError('Authorization header required')
    }

    const token = authHeader.slice(7)
    const decoded = TokenService.verifyToken(token)

    const user = await UserService.getProfile(decoded.sub)

    res.json({
      ok: true,
      user,
    })
  } catch (error) {
    logger.error('Get profile failed', { error })
    next(error)
  }
})

/**
 * POST /v1/auth/logout
 * Logout (client-side token deletion, server just acknowledges)
 */
router.post('/logout', async (req:  Request, res: Response) => {
  logger.info('User logged out')

  res.json({
    ok: true,
    message: 'Logged out successfully',
  })
})

export default router