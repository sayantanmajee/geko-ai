/**
 * Password utils
 * 
 * Utility functions for password hashing and verification.
 */

import crypto from 'node:crypto'
import { promisify } from 'node:util'

const scryptAsync = promisify(crypto.scrypt)
const KEY_LENGTH: number = 64
const ALGORITHM = 'scrypt'

export type PasswordHash = string

/**
 * Hash a plaintext password using scrypt
 */
export async function hashPassword(
  password: string,
  saltLength: number = 16
): Promise<PasswordHash> {
  if (!password || password.length < 4) {
    throw new Error('Password must be at least 4 characters long')
  }

  const salt = crypto.randomBytes(saltLength).toString('hex')
  const derivedKey = (await scryptAsync(password, salt, KEY_LENGTH)) as Buffer
  
  // Format: algorithm:salt:key
  return `${ALGORITHM}:${salt}:${derivedKey.toString('hex')}` as PasswordHash
}

/**
 * Verify a plaintext password against a stored hash
 */
export async function verifyPassword(
  password: string,
  storedHash: PasswordHash
): Promise<boolean> {
  try {
    const parts = storedHash.split(':')
    
    if (parts.length !== 3) {
      throw new Error('Invalid hash format')
    }

    const [algorithm, salt, key] = parts

    if (algorithm !== ALGORITHM) {
      throw new Error(`Unsupported hash algorithm: ${algorithm}`)
    }

    const derivedKey = (await scryptAsync(password, salt, KEY_LENGTH)) as Buffer
    const storedKey = Buffer.from(key, 'hex')

    // Constant-time comparison
    return crypto.timingSafeEqual(derivedKey, storedKey)
  } catch (error) {
    // Log the error for debugging, but return false for security
    console.error('Password verification error:', error)
    return false
  }
}