/**
 * Workspace Service Configuration
 * 
 * Centralized configuration management with validation
 * Ensures all required environment variables are present
 * 
 * @module config
 */

import { createLogger } from '@package/shared-utils';

const logger = createLogger('config');

/**
 * Service configuration interface
 * Defines all configuration options with types
 */
export interface ServiceConfig {
  /** Service identification and versioning */
  service: {
    name: string;
    port: number;
    nodeEnv: 'development' | 'production' | 'test';
    version: string;
  };

  /** Database connection settings */
  database: {
    host: string;
    port:  number;
    name: string;
    user: string;
    password: string;
  };

  /** Security and CORS settings */
  security: {
    corsOrigin: string[];
    trustProxy: boolean;
  };

  /** Feature flags */
  features: {
    enableInvitations: boolean;
    maxWorkspacesPerTenant: number;
  };
}

/**
 * Load and validate configuration from environment variables
 * 
 * @throws {Error} If required environment variables are missing
 * @returns {ServiceConfig} Validated configuration object
 */
function loadConfig(): ServiceConfig {
  // List of required environment variables
  const requiredVars = [
    'DB_HOST',
    'DB_PORT',
    'DB_NAME',
    'DB_USER',
    'DB_PASSWORD',
  ];

  // Check for missing variables
  const missing = requiredVars.filter(v => !process.env[v]);
  if (missing.length > 0) {
    logger.error(`Missing required environment variables: ${missing. join(', ')}`);
    throw new Error(`Missing environment variables: ${missing.join(', ')}`);
  }

  const config: ServiceConfig = {
    service: {
      name: 'workspace-service',
      port: parseInt(process.env.PORT || '3003', 10),
      nodeEnv: (process.env.NODE_ENV as any) || 'development',
      version: '0.1.0',
    },

    database: {
      host:  process.env.DB_HOST! ,
      port: parseInt(process.env.DB_PORT || '5432', 10),
      name: process.env.DB_NAME!,
      user:  process.env.DB_USER! ,
      password: process.env.DB_PASSWORD!,
    },

    security: {
      corsOrigin: (process.env.CORS_ORIGIN || 'http://localhost:3000')
        .split(',')
        .map(s => s.trim()),
      trustProxy: process.env.TRUST_PROXY === 'true',
    },

    features: {
      enableInvitations: process.env. ENABLE_INVITATIONS !== 'false',
      maxWorkspacesPerTenant: parseInt(
        process.env.MAX_WORKSPACES_PER_TENANT || '50',
        10
      ),
    },
  };

  logger.info('✓ Configuration loaded successfully');
  logger.debug(
    {
      service: config.service,
      corsOrigin: config.security.corsOrigin,
      trustProxy: config.security.trustProxy,
      features: config.features,
    },
    'Configuration details'
  );

  return config;
}

// Load configuration once at startup
export const config = loadConfig();