/**
 * Auth Service Entry Point
 * 
 * Responsibilities:
 * - Issue JWT tokens (Local + OAuth)
 * - Validate credentials
 * - Manage user identity
 * 
 * TODO:  Implement after DAY 2
 */

import 'dotenv/config'
import express from 'express'
import { createLogger } from '@packages/shared-utils'

const logger = createLogger('auth-service')

const app: express.Application = express()
const PORT = parseInt(process.env.AUTH_SERVICE_PORT || '3001', 10)

app.use(express.json())

// Health check
app.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'auth-service' })
})

// TODO: Routes will be added in DAY 2

const server = app.listen(PORT, () => {
  logger.info('Auth service started', { port: PORT })
})

// Graceful shutdown
process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down...')
  server.close(() => {
    logger.info('Auth service closed')
    process.exit(0)
  })
})

export default app