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

export { logger, createLogger } from './logger/index';
export {
  hashPassword,
  verifyPassword,
  generateToken,
  signData,
  verifySignature,
  hashString,
} from './crypto/index';
export {
  createAccessToken,
  createRefreshToken,
  verifyToken,
  decodeToken,
  extractToken,
} from './jwt/index';
export {
  isValidEmail,
  isStrongPassword,
  isValidUUID,
  isValidSlug,
  validateEmail,
  validatePassword,
} from './validators/index';
export {
  initializePool,
  getPool,
  query,
  queryOne,
  execute,
  getConnection,
  transaction,
  closePool,
} from './db/index';