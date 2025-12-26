/**
 * Cryptographic Functions
 * 
 * Uses Node.js built-in crypto module (zero dependencies)
 * - Password hashing with PBKDF2
 * - Random token generation
 * - HMAC for data integrity
 * 
 * NEVER use 3rd party crypto libraries
 */

import { createHash, pbkdf2Sync, randomBytes } from 'crypto';

const ITERATIONS = 100000;      // PBKDF2 iterations
const KEY_LENGTH = 64;           // Hash output length (bytes)
const DIGEST = 'sha256';         // Hash algorithm
const TOKEN_LENGTH = 32;         // Random token length (bytes)

/**
 * Hash password using PBKDF2
 * 
 * Returns:  salt$hash (salt and hash separated by $)
 * Format allows verification without storing salt separately
 */
export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex');
  const hash = pbkdf2Sync(password, salt, ITERATIONS, KEY_LENGTH, DIGEST).toString('hex');
  return `${salt}$${hash}`;
}

/**
 * Verify password against stored hash
 */
export function verifyPassword(password: string, storedHash: string): boolean {
  const [salt, hash] = storedHash.split('$');
  if (! salt || !hash) return false;
  
  const derived = pbkdf2Sync(password, salt, ITERATIONS, KEY_LENGTH, DIGEST).toString('hex');
  return derived === hash;
}

/**
 * Generate random token for invitations, password resets, etc.
 * 
 * Returns: 64-character hex string (32 bytes)
 * URL-safe and suitable for tokens
 */
export function generateToken(length: number = TOKEN_LENGTH): string {
  return randomBytes(length).toString('hex');
}

/**
 * Generate HMAC signature for data integrity
 * 
 * Used to sign webhook payloads, API requests, etc.
 */
export function signData(data: string, secret:  string): string {
  return createHash('sha256')
    .update(data + secret)
    .digest('hex');
}

/**
 * Verify HMAC signature
 */
export function verifySignature(data: string, signature:  string, secret: string): boolean {
  const computed = signData(data, secret);
  // Constant-time comparison to prevent timing attacks
  return computed === signature;
}

/**
 * Hash a string (for non-password use cases)
 * 
 * Example:  Hash JWT token for storage
 */
export function hashString(input: string): string {
  return createHash('sha256').update(input).digest('hex');
}