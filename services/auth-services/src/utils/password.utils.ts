/**
 * Password utils
 * 
 * Utility functions for password hashing and verification.
 */

import crypto from 'node:crypto'
import { promisify } from 'node:util'

const scryptAsync = promisify(crypto.scrypt)
const KEY_LENGTH: number = 64

export type PasswordHash = string

/**
 * Hash a plaintext password using scrypt
 */
export async function hashPassword( password: string, saltLength: number  = 16): Promise<PasswordHash> {
    if( !password || password.length < 4 ) {
        throw new Error('Password must be at least 4 characters long')
    }

    const salt = crypto.randomBytes(saltLength).toString('hex')
    const derivedKey = (await scryptAsync(password, salt, KEY_LENGTH)) as Buffer
    return `${salt}:${derivedKey.toString('hex')}` as PasswordHash
}

/**
 * Verify a plaintext password against a stored hash
 */
export async function verifyPassword( password: string, storedHash: PasswordHash ): Promise<boolean> {
    try {
        const [algorithm, salt, key] = storedHash.split(':')
        if( algorithm !== 'scrypt' ) {
            throw new Error('Unsupported hash algorithm')
        }

        const derivedKey = (await scryptAsync(password, salt, KEY_LENGTH)) as Buffer
        const storedkey = Buffer.from(key, 'hex')

        // constant-time comparison
        return crypto.timingSafeEqual(derivedKey, storedkey)
    } catch {
        return false
    }
}

