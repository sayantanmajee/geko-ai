/**
 * Configuration Manager
 * 
 * Loads environment variables and validates them. 
 * Throws error if required vars are missing.
 */

import { createLogger } from '@packages/shared-utils'

const logger = createLogger('auth-config')

export interface AppConfig {
  nodeEnv: 'development' | 'production' | 'test'
  port: number
  logLevel: string

  // Database
  dbHost: string
  dbPort:  number
  dbName: string
  dbUser: string
  dbPassword: string
  dbSsl: boolean

  // JWT
  jwtSecret: string
  jwtAccessExpiry: string
  jwtRefreshExpiry: string

  // Passport OAuth
  googleClientId: string
  googleClientSecret: string
  googleCallbackUrl: string

  githubClientId: string
  githubClientSecret: string
  githubCallbackUrl: string

  // Session
  sessionSecret: string

  // URLs
  clientUrl: string
  apiGatewayUrl: string
}

function getEnv(key: string, defaultValue?: string): string {
  const value = process.env[key] || defaultValue

  if (! value) {
    throw new Error(`Missing required environment variable: ${key}`)
  }

  return value
}

export function getConfig(): AppConfig {
  const nodeEnv = (process.env.NODE_ENV || 'development') as 'development' | 'production' | 'test'

  try {
    const config: AppConfig = {
      nodeEnv,
      port: parseInt(getEnv('AUTH_SERVICE_PORT', '3001'), 10),
      logLevel: getEnv('LOG_LEVEL', 'debug'),

      // Database
      dbHost: getEnv('DB_HOST', 'localhost'),
      dbPort: parseInt(getEnv('DB_PORT', '5432'), 10),
      dbName: getEnv('DB_NAME', 'saas_platform'),
      dbUser: getEnv('DB_USER', 'postgres'),
      dbPassword: getEnv('DB_PASSWORD', 'postgres'),
      dbSsl: getEnv('DB_SSL', 'false').toLowerCase() === 'true',

      // JWT
      jwtSecret: getEnv('JWT_SECRET'),
      jwtAccessExpiry:  getEnv('JWT_ACCESS_EXPIRY', '15m'),
      jwtRefreshExpiry: getEnv('JWT_REFRESH_EXPIRY', '7d'),

      // Passport OAuth
      googleClientId:  getEnv('PASSPORT_GOOGLE_CLIENT_ID', ''),
      googleClientSecret:  getEnv('PASSPORT_GOOGLE_CLIENT_SECRET', ''),
      googleCallbackUrl: getEnv(
        'PASSPORT_GOOGLE_CALLBACK_URL',
        'http://localhost:3001/auth/google/callback'
      ),

      githubClientId: getEnv('PASSPORT_GITHUB_CLIENT_ID', ''),
      githubClientSecret:  getEnv('PASSPORT_GITHUB_CLIENT_SECRET', ''),
      githubCallbackUrl:  getEnv(
        'PASSPORT_GITHUB_CALLBACK_URL',
        'http://localhost:3001/auth/github/callback'
      ),

      // Session
      sessionSecret: getEnv('SESSION_SECRET', 'dev-secret-change-in-prod'),

      // URLs
      clientUrl: getEnv('CLIENT_URL', 'http://localhost:5173'),
      apiGatewayUrl: getEnv('API_GATEWAY_URL', 'http://localhost:3002'),
    }

    logger. info('Configuration loaded successfully', {
      nodeEnv:  config.nodeEnv,
      port: config.port,
    })

    return config
  } catch (error) {
    logger.error('Failed to load configuration', { error })
    throw error
  }
}


export {initDb, closeDb} from './database'