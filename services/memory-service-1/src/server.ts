/**
 * Memory Service Entry Point
 * 
 * Responsibilities: 
 * - Store/retrieve tenant-scoped memory
 * - Ensure data isolation
 * 
 * TODO: Implement after DAY 2
 */

import 'dotenv/config'
import express from 'express'
import { createLogger } from '@packages/shared-utils'

const logger = createLogger('memory-service')

const app: express.Application = express()
const PORT = parseInt(process.env. MEMORY_SERVICE_PORT || '3003', 10)

app.use(express.json())

// Health check
app.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'memory-service' })
})

// TODO: Routes will be added in DAY 2

const server = app. listen(PORT, () => {
  logger.info('Memory service started', { port: PORT })
})

// Graceful shutdown
process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down...')
  server.close(() => {
    logger.info('Memory service closed')
    process.exit(0)
  })
})

export default app