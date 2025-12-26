/**
 * memory service Service
 * 
 * Port: 3004
 * TODO: Add service-specific documentation
 */

import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { createLogger } from '@packages/shared-utils/logger';
import { initializePool, closePool } from '@packages/shared-utils/db';
import { asyncHandler } from '@packages/shared-utils/errors';
import { healthRouter } from './routes/health.js';
import { errorHandler } from './middleware/error-handler.js';

const PORT = parseInt(process.env.PORT || '3004');
const NODE_ENV = process.env.NODE_ENV || 'development';
const logger = createLogger('memory-service');

const app: Express = express();

// Security
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN?. split(',') || '*',
  credentials: true,
}));

// Body parsing
app.use(express. json({ limit: '3mb' }));
app.use(express.urlencoded({ extended: true, limit: '3mb' }));

// Request logging
app.use((req: Request, res: Response, next:  NextFunction) => {
  logger.debug(`${req.method} ${req.path}`);
  next();
});

// Initialize database (if needed)
initializePool();

// Routes
app.use('/health', healthRouter);

// TODO: Add service-specific routes here

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    ok: false,
    error: {
      code: 'NOT_FOUND',
      message:  'Route not found',
    },
  });
});

// Error handler (must be last)
app.use(errorHandler);

// Start server
const server = app.listen(PORT, () => {
  logger.info(
    { port: PORT, env: NODE_ENV },
    'memory service Service started'
  );
});

// Graceful shutdown
async function gracefulShutdown(signal: string) {
  logger.info({ signal }, 'Graceful shutdown initiated');
  
  server.close(async () => {
    await closePool();
    logger.info('Service stopped');
    process.exit(0);
  });

  setTimeout(() => {
    logger.error('Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

export default app;
