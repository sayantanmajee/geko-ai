/**
 * Centralized Logger Configuration
 * 
 * All services import createLogger() from here. 
 * This ensures consistent logging across the platform.
 * 
 * Pino configuration:
 * - Pretty-prints in development
 * - JSON logs in production (for log aggregation)
 * - Structured fields (service, requestId, tenantId, etc.)
 */

import pino, { Logger as PinoLogger } from 'pino'

export type Logger = PinoLogger

const isDevelopment = process.env.NODE_ENV === 'development'
const logLevel = process.env.LOG_LEVEL || (isDevelopment ? 'debug' : 'info')

/**
 * Base configuration (shared across all services)
 */
const baseConfig = {
  level: logLevel,
  base: {
    env: process.env.NODE_ENV || 'development',
    version:  '0.0.1',
  },
}

/**
 * Development transport (pretty-print)
 */
const devTransport = {
  target: 'pino-pretty',
  options: {
    colorize: true,
    translateTime: 'SYS:standard',
    ignore: 'pid,hostname',
    singleLine: false,
  },
}

/**
 * Production transport (JSON for log aggregation)
 */
const prodTransport = undefined

/**
 * Create a logger instance for a service
 * 
 * @param serviceName - Name of the service (e.g., 'auth-service')
 * @returns Pino logger instance
 * 
 * @example
 * ```ts
 * const logger = createLogger('auth-service')
 * logger.info('Service started', { port: 3001 })
 * ```
 */
export function createLogger(serviceName: string): Logger {
  const config = {
    ...baseConfig,
    base: {
      ... baseConfig.base,
      service: serviceName,
    },
    transport: isDevelopment ? devTransport : prodTransport,
  }

  return pino(config as any) // pino types are strict
}

/**
 * Child logger (adds context to parent)
 * 
 * @param parentLogger - Parent Pino logger
 * @param context - Context object (tenantId, userId, requestId, etc.)
 * @returns Child logger with context
 * 
 * @example
 * ```ts
 * const childLogger = createChildLogger(logger, { tenantId: 't1', requestId: 'req123' })
 * childLogger.info('Processing request') // logs include tenantId, requestId
 * ```
 */
export function createChildLogger(
  parentLogger: Logger,
  context: Record<string, unknown>
): Logger {
  return parentLogger.child(context)
}