/**
 * Structured Logging
 * 
 * Uses Pino for production-grade logging: 
 * - Structured JSON output
 * - Fast performance
 * - Child loggers for context
 * - Log levels:  trace, debug, info, warn, error, fatal
 * 
 * Usage:
 * logger.info({ userId: '123' }, 'User logged in')
 * Creates: { level: 30, userId: '123', msg: 'User logged in' }
 */

import pino from 'pino';

const isDevelopment = process.env.NODE_ENV === 'development';

/**
 * Create base logger with environment-specific configuration
 */
export const logger = pino({
  level: process.env.LOG_LEVEL || (isDevelopment ? 'debug' : 'info'),
  
  // Pretty-print in development, JSON in production
  transport: isDevelopment
    ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime:  'SYS:standard',
          ignore: 'pid,hostname',
        },
      }
    :  undefined,
});

/**
 * Create child logger with additional context
 * 
 * Example:
 * const authLogger = createLogger('auth-service', { service: 'auth' })
 * authLogger.info('User registered')
 * Creates: { level: 30, service: 'auth', module: 'auth-service', msg: '.. .' }
 */
export function createLogger(module: string, context?: Record<string, any>) {
  return logger.child({
    module,
    ...context,
  });
}

export default logger;