/**
 * Service Configuration
 * 
 * Centralized configuration management
 * Validates required environment variables at startup
 */

import { createLogger } from '@package/shared-utils';

const logger = createLogger('config');

/**
 * Configuration schema
 */
export interface Config {
  // Service
  service: {
    name: string;
    port: number;
    nodeEnv: 'development' | 'production' | 'test';
    version: string;
  };
  
  // Database
  database: {
    host: string;
    port: number;
    name: string;
    user: string;
    password: string;
  };
  
  // JWT
  jwt: {
    secret: string;
    accessTokenExpiry: string;
    refreshTokenExpiry:  string;
  };
  
  // Security
  security: {
    corsOrigin: string[];
    enableRateLimit: boolean;
    rateLimitWindow: number;
    rateLimitMax: number;
  };
}

/**
 * Load and validate configuration from environment
 */
function loadConfig(): Config {
  const requiredVars = [
    'JWT_SECRET',
    'DB_HOST',
    'DB_PORT',
    'DB_NAME',
    'DB_USER',
    'DB_PASSWORD',
  ];
  
  // Validate required environment variables
  const missing = requiredVars.filter(v => !process.env[v]);
  if (missing.length > 0) {
    logger.error(`Missing required environment variables: ${missing.join(', ')}`);
    throw new Error(`Missing environment variables: ${missing.join(', ')}`);
  }
  
  const config: Config = {
    service: {
      name: 'auth-service',
      port: parseInt(process.env.PORT || '3001'),
      nodeEnv: (process.env.NODE_ENV as any) || 'development',
      version: '0.1.0',
    },
    
    database: {
      host: process.env.DB_HOST! ,
      port: parseInt(process.env.DB_PORT || '5432'),
      name: process.env.DB_NAME! ,
      user: process.env.DB_USER!,
      password: process.env.DB_PASSWORD!,
    },
    
    jwt: {
      secret: process.env.JWT_SECRET!,
      accessTokenExpiry: process.env.JWT_ACCESS_EXPIRY || '15m',
      refreshTokenExpiry: process.env.JWT_REFRESH_EXPIRY || '7d',
    },
    
    security:  {
      corsOrigin: (process.env.CORS_ORIGIN || 'http://localhost:3000')
        .split(',')
        .map(s => s.trim()),
      enableRateLimit: process.env.ENABLE_RATE_LIMIT !== 'false',
      rateLimitWindow: parseInt(process.env.RATE_LIMIT_WINDOW || '900000'), // 15 min
      rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX || '100'),
    },
  };
  
  logger.info('Configuration loaded successfully');
  return config;
}

export const config = loadConfig();