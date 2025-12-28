/**
 * Shared Utilities
 * 
 * Production-grade utilities used across all services: 
 * - Logging (Pino)
 * - Cryptography (Node.js crypto)
 * - JWT management
 * - Input validation
 * - Database connectivity
 */

export { logger, createLogger } from './logger/index.js';
export {
  hashPassword,
  verifyPassword,
  generateToken,
  signData,
  verifySignature,
  hashString,
} from './crypto/index.js';
export * from './jwt/index.js';
export {
  isValidEmail,
  isStrongPassword,
  isValidUUID,
  isValidSlug,
  validateEmail,
  validatePassword,
} from './validators/index.js';
export {
  initializePool,
  getPool,
  query,
  queryOne,
  execute,
  getConnection,
  transaction,
  closePool,
} from './db/index.js';
export { runMigrations, runSeeds } from './db/migrations.js';