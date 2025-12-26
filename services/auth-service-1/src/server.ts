/**
 * Auth Service Entry Point
 * 
 * Initializes Express server and starts listening. 
 */

import 'dotenv/config'
import express from 'express'
import { createLogger } from '@packages/shared-utils'
import { getConfig, initDb, closeDb } from './config/index'
import authRoutes from './routes/auth.routes'
import { errorHandler } from './middleware/error.handler'

const logger = createLogger('auth-server')

async function start() {
  try {
    // Load config
    const config = getConfig()

    // Initialize database
    await initDb(config)

    // Create Express app
    const app = express()

    // Middleware
    app.use(express.json())
    app.use(express.urlencoded({ extended: true }))

    // Request logging
    app.use((req, res, next) => {
      logger.debug('Incoming request', {
        method:  req.method,
        path: req.path,
      })
      next()
    })

    // Health check
    app.get('/health', (_req, res) => {
      res.json({ ok: true, service: 'auth-service' })
    })

    // Routes
    app.use('/v1/auth', authRoutes)

    // 404 handler
    app.use((req, res) => {
      res.status(404).json({
        ok: false,
        error: 'NOT_FOUND',
        message: `Route not found: ${req.method} ${req.path}`,
      })
    })

    // Error handler (must be last)
    app.use(errorHandler)

    // Start server
    const server = app.listen(config.port, () => {
      logger.info('Auth service started', {
        port: config.port,
        environment: config.nodeEnv,
      })
    })

    // Graceful shutdown
    process.on('SIGINT', async () => {
      logger.info('SIGINT received, shutting down.. .')
      server.close(() => {
        logger.info('Server closed')
      })
      await closeDb()
      process.exit(0)
    })
  } catch (error) {
    logger.error('Failed to start auth service', { error })
    process.exit(1)
  }
}

start()