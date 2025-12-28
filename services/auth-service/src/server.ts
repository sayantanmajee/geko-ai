/**
 * Auth Service - Main Entry Point
 * 
 * Startup sequence: 
 * 1. Load configuration
 * 2. Initialize database pool
 * 3. Run migrations (if enabled)
 * 4. Seed test data (if development)
 * 5. Start Express server
 * 6. Graceful shutdown handlers
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import {
  createLogger,
  initializePool,
  closePool,
  runMigrations,
  runSeeds
} from '@package/shared-utils';
import { config } from './config/index.js';
import { authRouter } from './routes/auth.js';
import { healthRouter } from './routes/health.js';
import { errorHandlerMiddleware } from './middleware/error-handler.js';
import { fileURLToPath } from 'url';
import path from 'path';

// Get directory path for migrations
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Navigate:  src/server.ts -> src -> services/auth-service -> services -> .  (root)
const projectRoot = path.join(__dirname, '../../../');
const MIGRATIONS_DIR = path.join(projectRoot, 'infra/postgres/migrations');
const SEEDS_DIR = path.join(projectRoot, 'infra/postgres/seeds');


const logger = createLogger('server');

const app: express.Application = express();

// ============================================================================
// MIDDLEWARE
// ============================================================================

app.use(helmet());
app.use(
  cors({
    origin: config.security.corsOrigin,
    credentials: true,
  })
);
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

/**
 * Request logging
 */
app.use((req, res, next) => {
  logger.debug(`${req.method} ${req.path}`);
  next();
});

// ========================================================================
// ROUTES
// ========================================================================

app.use('/health', healthRouter);
app.use('/v1/auth', authRouter);

/**
 * 404 handler
 */
app.use((req, res) => {
  res.status(404).json({
    ok: false,
    error: {
      code: 'NOT_FOUND',
      message: 'Route not found',
    },
  });
});

/**
 * Error handler (must be last)
 */
app.use(errorHandlerMiddleware);

// ============================================================================
// STARTUP
// ============================================================================

async function startServer() {
  try {
    logger.info(`Starting ${config.service.name} (v${config.service.version})`);

    // Initialize database
    logger.info('Initializing database connection...');
    initializePool();
    logger.info('✓ Database connected');

    // Run migrations
    if (process.env.RUN_MIGRATIONS === 'true') {
      logger.info('Running migrations...');
      try {
        await runMigrations(MIGRATIONS_DIR);
        logger.info('✓ Migrations completed');

      } catch (migrationError) {
        logger.error({
          err: migrationError,
          message: (migrationError as Error).message,
          stack: (migrationError as Error).stack
        }, '✗ Migration failed')
        throw migrationError;
      }
      logger.info('✓ Migrations completed');
    }

    // Seed test data
    if (config.service.nodeEnv === 'development') {
      logger.info('Seeding test data...');
      try {
        await runSeeds(SEEDS_DIR);
        logger.info('✓ Seeds completed');
      } catch (seedError) {
        logger.warn({ 
          err: seedError,
          message: (seedError as Error).message 
        }, '⚠ Seed failed (continuing)');
        // Don't throw on seed failure
      }
    }

    // Start server
    const server = app.listen(config.service.port, () => {
      logger.info(`✓ Server listening on port ${config.service.port}`);
      logger.info(`✓ Environment: ${config.service.nodeEnv}`);
    });

    /**
     * Graceful shutdown
     */
    const shutdown = async () => {
      logger.info('Shutting down gracefully...');

      server.close(async () => {
        logger.info('Server closed');
        await closePool();
        logger.info('✓ Graceful shutdown complete');
        process.exit(0);
      });

      // Force shutdown after 30s
      setTimeout(() => {
        logger.error('Forcing shutdown after 30s');
        process.exit(1);
      }, 30000);
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
  } catch (error) {
    logger.error('Failed to start server', error);
    await closePool();
    process.exit(1);
  }
}

startServer();

export default app;