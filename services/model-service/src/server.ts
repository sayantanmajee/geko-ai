/**
 * Model Service - Main Entry Point
 * 
 * Service startup orchestration: 
 * 1. Load and validate configuration
 * 2. Initialize database connection pool
 * 3. Run database migrations (if enabled)
 * 4. Initialize service caches
 * 5. Start Express HTTP server
 * 6. Setup graceful shutdown handlers
 * 
 * @module server
 */

import { fileURLToPath } from 'url';
import path from 'path';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { createLogger, initializePool, closePool } from '@package/shared-utils';
import { runMigrations } from '@package/shared-utils';
import { config } from './config/index.js';
import * as modelService from './services/model.service.js';
import { healthRouter } from './routes/health.js';
import { modelRouter } from './routes/models.js';
import { errorHandler } from './middleware/error-handler.js';

const logger = createLogger('server');

// Get project root for migrations
const __filename = fileURLToPath(import.  meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, '../../. .');
const MIGRATIONS_DIR = path.join(projectRoot, 'infra/postgres/migrations');

// Initialize Express app
const app: express.Application = express();

// ============================================================================
// MIDDLEWARE CONFIGURATION
// ============================================================================

// Security headers
app.use(helmet());

// CORS configuration
app.use(
  cors({
    origin: config.security.corsOrigin,
    credentials: true,
    optionsSuccessStatus: 200,
  })
);

// Trust proxy (for accurate client IP in logs)
if (config.security.trustProxy) {
  app.set('trust proxy', 1);
}

// Body parsing
app.use(express.  json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging
app.use((req: Request, res: Response, next:  NextFunction) => {
  logger.debug(
    {
      method: req.method,
      path: req.path,
      ip: req.ip,
    },
    'Incoming request'
  );
  next();
});

// ============================================================================
// ROUTE REGISTRATION
// ============================================================================

app.use('/health', healthRouter);
app.use('/v1/models', modelRouter);

// 404 handler
app.use((req: Request, res: Response) => {
  logger.warn(
    { path: req.path, method: req.method },
    'Route not found'
  );

  res.status(404).json({
    ok: false,
    error: {
      code: 'NOT_FOUND',
      message:  `Route ${req.method} ${req.path} not found`,
    },
  });
});

// Global error handler (MUST BE LAST)
app.use(errorHandler);

// ============================================================================
// STARTUP SEQUENCE
// ============================================================================

/**
 * Main startup function
 * Orchestrates service initialization
 */
async function startup(): Promise<void> {
  try {
    // Log startup
    logger.info(
      `Starting ${config.service.name} (v${config.service.version})`
    );
    logger.info(`Environment: ${config.service.nodeEnv}`);
    logger.info(`Port: ${config.service.port}`);

    // Step 1: Initialize database connection
    logger.info('Initializing database connection...');
    initializePool();
    logger.info('✓ Database connection pool initialized');

    // Step 2: Run migrations (if enabled)
    if (process.env.RUN_MIGRATIONS === 'true') {
      logger.info(`Running migrations from ${MIGRATIONS_DIR}...`);
      try {
        await runMigrations(MIGRATIONS_DIR);
        logger.info('✓ Migrations completed successfully');
      } catch (migrationError) {
        logger.error(
          { error: migrationError },
          '✗ Migration failed - aborting startup'
        );
        throw migrationError;
      }
    } else {
      logger.debug('Migrations skipped (RUN_MIGRATIONS != true)');
    }

    // Step 3: Initialize service caches
    logger.info('Initializing service caches...');
    modelService.initializeCacheTTL(
      config.features.cacheTTL,
      config. features.eligibilityCacheTTL
    );
    logger.info('✓ Service caches initialized');

    // Step 4: Start HTTP server
    const server = app.listen(config. service.port, () => {
      logger.info(
        `✓ ${config.service.name} listening on port ${config.service.port}`
      );
      logger.info('✓ Ready to accept connections');
    });

    // ========================================================================
    // GRACEFUL SHUTDOWN
    // ========================================================================

    /**
     * Graceful shutdown handler
     * Closes server and database connections cleanly
     */
    const gracefulShutdown = async (signal: string): Promise<void> => {
      logger.info(
        `${signal} received - initiating graceful shutdown...`
      );

      // Stop accepting new requests
      server.close(async () => {
        logger.info('Server closed, cleaning up resources...');

        try {
          // Close database connection
          await closePool();
          logger.info('✓ Database connection closed');

          // Clear caches
          modelService.clearAllCaches();
          logger.info('✓ Caches cleared');

          logger.info('✓ Graceful shutdown complete');
          process.exit(0);
        } catch (shutdownError) {
          logger. error(
            { error: shutdownError },
            '✗ Error during shutdown'
          );
          process.exit(1);
        }
      });

      // Force shutdown after 30 seconds
      setTimeout(() => {
        logger.error(
          'Forced shutdown after 30 second timeout'
        );
        process.exit(1);
      }, 30000);
    };

    // Register shutdown handlers
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
      logger.error(
        { reason, promise },
        'Unhandled Promise Rejection'
      );
    });

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      logger.error({ error }, 'Uncaught Exception - shutting down');
      process.exit(1);
    });
  } catch (error) {
    logger.error(
      { error },
      '✗ Failed to start service - aborting'
    );
    await closePool();
    process.exit(1);
  }
}

// Start service
startup();

export default app;