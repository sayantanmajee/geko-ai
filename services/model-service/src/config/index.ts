/**
 * Model Service Configuration
 * 
 * Centralized configuration management with comprehensive validation
 * Ensures all required environment variables are present and valid
 * Supports development, testing, and production environments
 * 
 * @module config
 */

import { createLogger } from '@package/shared-utils';

const logger = createLogger('config');

/**
 * Service configuration interface
 * Defines all configuration options with strict typing
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
    port: number;
    name: string;
    user: string;
    password: string;
  };

  /** Security and CORS settings */
  security: {
    corsOrigin: string[];
    trustProxy: boolean;
  };

  /** Local model support configuration */
  models: {
    enableLocalModels: boolean;
    ollama: {
      enabled: boolean;
      baseUrl: string;
      timeout: number; // milliseconds
    };
    llamaCpp: {
      enabled: boolean;
      basePath: string;
      timeout:  number; // milliseconds
    };
  };

  /** Feature flags and optimization settings */
  features: {
    cacheModels: boolean;
    cacheTTL: number; // milliseconds
    enableEligibilityCache: boolean;
    eligibilityCacheTTL: number; // milliseconds
  };

  /** Logging configuration */
  logging: {
    level: 'debug' | 'info' | 'warn' | 'error';
  };
}

/**
 * Load and validate configuration from environment variables
 * 
 * Validates that all required environment variables are present
 * Applies sensible defaults for optional variables
 * Logs all loaded configuration (except sensitive values)
 * 
 * @throws {Error} If required environment variables are missing
 * @returns {ServiceConfig} Fully validated configuration object
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
    logger.error(
      { missing },
      `Missing required environment variables: ${missing. join(', ')}`
    );
    throw new Error(`Missing environment variables: ${missing.join(', ')}`);
  }

  // Parse and validate port number
  const port = parseInt(process.env.PORT || '3004', 10);
  if (isNaN(port) || port < 1 || port > 65535) {
    logger.error({ port: process.env.PORT }, 'Invalid PORT value');
    throw new Error('PORT must be a valid number between 1 and 65535');
  }

  // Parse database port
  const dbPort = parseInt(process.env.DB_PORT || '5432', 10);
  if (isNaN(dbPort) || dbPort < 1 || dbPort > 65535) {
    logger.error({ dbPort: process.env.DB_PORT }, 'Invalid DB_PORT value');
    throw new Error('DB_PORT must be a valid number between 1 and 65535');
  }

  // Parse cache TTL
  const cacheTTL = parseInt(process. env.CACHE_TTL || '3600000', 10);
  if (isNaN(cacheTTL) || cacheTTL < 0) {
    logger.error({ cacheTTL: process. env.CACHE_TTL }, 'Invalid CACHE_TTL');
    throw new Error('CACHE_TTL must be a non-negative number');
  }

  // Build configuration object
  const config: ServiceConfig = {
    service: {
      name: 'model-service',
      port,
      nodeEnv: (process.env.NODE_ENV as any) || 'development',
      version: '0.1.0',
    },

    database: {
      host:  process.env.DB_HOST! ,
      port: dbPort,
      name: process. env.DB_NAME!,
      user: process.env.DB_USER!,
      password:  process.env.DB_PASSWORD! ,
    },

    security:  {
      corsOrigin: (process.env.CORS_ORIGIN || 'http://localhost:3000')
        .split(',')
        .map(s => s.trim())
        .filter(s => s.length > 0),
      trustProxy: process.env.TRUST_PROXY === 'true',
    },

    models: {
      enableLocalModels: process.env.ENABLE_LOCAL_MODELS !== 'false',
      ollama: {
        enabled: process.env.OLLAMA_ENABLED === 'true',
        baseUrl: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
        timeout: parseInt(process.env.OLLAMA_TIMEOUT || '30000', 10),
      },
      llamaCpp: {
        enabled: process.env.LLAMACPP_ENABLED === 'true',
        basePath: process.env.LLAMACPP_PATH || '/usr/local/bin',
        timeout: parseInt(process.env.LLAMACPP_TIMEOUT || '30000', 10),
      },
    },

    features: {
      cacheModels: process.env. CACHE_MODELS !== 'false',
      cacheTTL,
      enableEligibilityCache: process.env. ENABLE_ELIGIBILITY_CACHE !== 'false',
      eligibilityCacheTTL: parseInt(
        process.env.ELIGIBILITY_CACHE_TTL || '1800000',
        10
      ), // 30 minutes default
    },

    logging: {
      level: (process.env.LOG_LEVEL as any) || 'info',
    },
  };

  // Log loaded configuration (without sensitive values)
  logger.info(
    {
      service: config.service,
      database: {
        host: config.database. host,
        port: config. database.port,
        name: config.database.name,
      },
      security: {
        corsOrigin: config. security.corsOrigin,
        trustProxy: config.security.trustProxy,
      },
      models: config.models,
      features: config.features,
    },
    '✓ Configuration loaded successfully'
  );

  return config;
}

// Load and export configuration
export const config = loadConfig();