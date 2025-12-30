/**
 * Workspace Service - Main Entry Point
 * 
 * Startup sequence:  
 * 1. Load configuration
 * 2. Initialize database
 * 3. Run migrations (if enabled)
 * 4. Start Express server
 * 5. Setup graceful shutdown
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
import { healthRouter } from './routes/health.js';
import { workspaceRouter } from './routes/workspaces.js';
import { errorHandler } from './middleware/error-handler.js';

const logger = createLogger('server');

// Get project root for migrations path
const __filename = fileURLToPath(import. meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, '../../../. .');
const MIGRATIONS_DIR = path.join(projectRoot, 'infra/postgres/migrations');

// Initialize Express app
const app: express.Application = express();

// ============================================================================
// MIDDLEWARE
// ============================================================================

// Security headers
app.use(helmet());

// CORS
app.use(
  cors({
    origin: config.security.corsOrigin,
    credentials: true,
    optionsSuccessStatus: 200,
  })
);

// Trust proxy (for accurate IP address)
if (config.security.trustProxy) {
  app.set('trust proxy', 1);
}

// Body parsers
app.use(express. json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware
app.use((req: Request, res: Response, next: NextFunction) => {
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
// ROUTES
// ============================================================================

app.use('/health', healthRouter);
app.use('/v1/workspaces', workspaceRouter);

// 404 handler
app.use((req: Request, res: Response) => {
  logger.warn({ path: req.path, method: req.method }, 'Route not found');

  res.status(404).json({
    ok: false,
    error: {
      code: 'NOT_FOUND',
      message:  `Route ${req.method} ${req.path} not found`,
    },
  });
});

// Error handler (MUST BE LAST)
app.use(errorHandler);

// ============================================================================
// STARTUP
// ============================================================================

async function startup(): Promise<void> {
  try {
    logger.info(`Starting ${config.service.name} (v${config.service.version})`);
    logger.info(`Environment: ${config.service.nodeEnv}`);

    // Initialize database connection pool
    logger.info('Initializing database connection.. .');
    initializePool();
    logger.info('✓ Database connected');

    // Run migrations (if enabled)
    if (process.env.RUN_MIGRATIONS === 'true') {
      logger.info(`Running migrations from ${MIGRATIONS_DIR}...`);
      try {
        await runMigrations(MIGRATIONS_DIR);
        logger.info('✓ Migrations completed');
      } catch (migrationError) {
        logger.error({ error: migrationError }, 'Migration failed');
        throw migrationError;
      }
    }

    // Start server
    const server = app.listen(config.service.port, () => {
      logger.info(`✓ ${config.service.name} listening on port ${config.service.port}`);
      logger.info(`✓ Ready to accept connections`);
    });

    // ========================================================================
    // GRACEFUL SHUTDOWN
    // ========================================================================

    const shutdown = async (signal: string): Promise<void> => {
      logger.info(`${signal} received - initiating graceful shutdown...`);

      // Stop accepting new requests
      server.close(async () => {
        logger.info('Server closed, closing database connection...');

        try {
          await closePool();
          logger.info('✓ Database connection closed');
          logger.info('✓ Graceful shutdown complete');
          process.exit(0);
        } catch (error) {
          logger.error({ error }, 'Error during shutdown');
          process.exit(1);
        }
      });

      // Force shutdown after 30 seconds
      setTimeout(() => {
        logger.error('Forced shutdown after 30 second timeout');
        process.exit(1);
      }, 30000);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

    // Unhandled rejection handler
    process.on('unhandledRejection', (reason, promise) => {
      logger.error(
        { reason, promise },
        'Unhandled Promise Rejection'
      );
    });

    // Uncaught exception handler
    process.on('uncaughtException', (error) => {
      logger.error({ error }, 'Uncaught Exception');
      process.exit(1);
    });
  } catch (error) {
    logger.error({ error }, '✗ Failed to start server');
    await closePool();
    process.exit(1);
  }
}

// Start the service
startup();

export default app;