/**
 * AI Gateway Entry Point
 * 
 * Responsibilities:
 * - Route requests to appropriate services
 * - Enforce tenant isolation
 * - Request/response logging
 * 
 * TODO: Implement after DAY 2
 */

import 'dotenv/config'
import express from 'express'
import { createLogger } from '@package/shared-utils'

const logger = createLogger('ai-gateway')

const app: express.Application = express()
const PORT = parseInt(process.env.AI_GATEWAY_PORT || '3002', 10)

app.use(express.json())

// Health check
app.get('/health', (_req, res) => {
    res.json({ ok: true, service: 'ai-gateway' })
})

// TODO: Routes will be added in DAY 2

const server = app.listen(PORT, () => {
    logger.info('AI Gateway started', { port: PORT })
})

// Graceful shutdown
process.on('SIGINT', () => {
    logger.info('SIGINT received, shutting down.. .')
    server.close(() => {
        logger.info('AI Gateway closed')
        process.exit(0)
    })
})

export default app