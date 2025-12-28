/**
 * Health Check Endpoint
 * 
 * Used for Docker healthcheck and load balancer readiness
 */

import { Router, Request, Response } from 'express';
import type { HealthResponse } from '@package/shared-types';

export const healthRouter: Router = Router();

healthRouter.get('/', (req: Request, res: Response<HealthResponse>) => {
  res.json({
    ok: true,
    service: process.env.SERVICE_NAME || 'service',
    version: '0.0.1',
    timestamp: new Date().toISOString(),
  });
});
