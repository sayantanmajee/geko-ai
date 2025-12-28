/**
 * User Service
 * 
 * Business logic for user management.
 */

import { createLogger, isValidEmail } from '@package/shared-utils'
import { UserQueries } from '../database/queries/users'
import type { User } from '@package/shared-types'
import { hashPassword, PasswordHash, verifyPassword } from '../utils/password.utils'
import { validatePassword } from '../utils/password.policy'
import { DEFAULT_PASSWORD_POLICY } from '../config/password-policy'

const logger = createLogger('user-service')

export class UserService {
  /**
   * Register new user (local auth)
   */
  static async register(
    tenantId: string,
    email: string,
    password: string,
    name?: string
  ): Promise<User> {
    logger.info('User registration started', { email, tenantId })

    // Validate email
    if (!this.isValidEmail(email)) {
      throw new this.isValidEmail(email)
    }

    // Validate password
    const passwordValidation = validatePassword(password, DEFAULT_PASSWORD_POLICY)
    if (!passwordValidation.ok) {
      throw new ValidationError(passwordValidation.reason)
    }
    // if (!this.validatePassword(password)) {
    //   throw new ValidationError('Password must be at least 8 characters')
    // }

    // Check if user exists
    const existing = await UserQueries.findByEmail(tenantId, email)
    if (existing) {
      throw new UserAlreadyExistsError(email)
    }

    // Hash password
    const passwordHash = await hashPassword(password)

    // Create user
    const user = await UserQueries.create({
      tenantId,
      email,
      passwordHash,
      name,
      role: 'member',
    })

    logger.info('User registered successfully', { userId: user.userId, email })

    return user
  }

  /**
   * Verify password
   */
  static async verifyPassword(password: string, hash: PasswordHash): Promise<boolean> {
    return await verifyPassword(password, hash)
  }

  /**
   * Get user profile
   */
  static async getProfile(userId: string): Promise<User> {
    const user = await UserQueries.findById(userId)

    if (!user) {
      throw new UserNotFoundError(userId)
    }

    return user
  }

  /**
   * Update user profile
   */
  static async updateProfile(
    userId: string,
    data: { name?: string }
  ): Promise<User> {
    const user = await UserQueries.findById(userId)

    if (!user) {
      throw new UserNotFoundError(userId)
    }

    return await UserQueries.update(userId, {
      name: data.name || user.name,
    })
  }

  /**
   * Change password
   */
  static async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    const user = await UserQueries.findById(userId)

    if (!user) {
      throw new UserNotFoundError(userId)
    }

    // Get current hash
    const currentHash = await UserQueries.getPasswordHash(userId)

    if (!currentHash) {
      throw new ValidationError('User does not have a password set')
    }

    // Verify current password
    const isValid = await this.verifyPassword(currentPassword, currentHash)

    if (!isValid) {
      throw new ValidationError('Current password is incorrect')
    }

    // Validate new password
    const passwordValidation = validatePassword(newPassword, DEFAULT_PASSWORD_POLICY)
    if (!passwordValidation.ok) {
      throw new ValidationError(passwordValidation.reason)
    }

    // Hash new password
    const newHash = await hashPassword(newPassword)

    // Update
    await UserQueries.update(userId, { passwordHash: newHash })

    logger.info('User password changed', { userId })
  }

  /**
   * Validate email format
   */
  // private static isValidEmail(email: string): boolean {
  //   const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  //   return emailRegex.test(email)
  // }

  /**
   * Validate password strength
   */
  // private static validatePassword(password: string): string | true {
  //   const passwordValidaion = validatePassword(password, DEFAULT_PASSWORD_POLICY)
  //   if(!passwordValidaion.ok) {
  //     return passwordValidaion.reason
  //   }
  //   return true
  // }
}