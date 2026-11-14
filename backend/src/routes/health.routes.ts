import { Router } from 'express';
import { API_VERSION, type HealthPayload } from '@echoes/shared';
import type { Dataset } from '../data';
import { sendSuccess } from '../utils/response';

export function createHealthRouter(dataset: Dataset): Router {
  const router = Router();

  router.get('/health', (_req, res) => {
    const payload: HealthPayload = {
      status: dataset.counts.verified > 0 ? 'ok' : 'degraded',
      apiVersion: API_VERSION,
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.round(process.uptime()),
      dataset: dataset.counts,
    };

    sendSuccess(res, payload);
  });

  return router;
}
