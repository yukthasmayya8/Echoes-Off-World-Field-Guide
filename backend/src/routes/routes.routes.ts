import { Router } from 'express';
import { slugSchema } from '@echoes/shared';
import type { Dataset } from '../data';
import { RouteService } from '../services/route.service';
import { notFoundError, parseOrThrow } from '../utils/errors';
import { sendSuccess } from '../utils/response';

export function createRoutesRouter(dataset: Dataset): Router {
  const router = Router();
  const service = new RouteService(dataset);

  router.get('/', (_req, res) => {
    sendSuccess(res, service.list());
  });

  router.get('/:slug', (req, res) => {
    const slug = parseOrThrow(slugSchema, req.params.slug, 'route slug');
    const route = service.getBySlug(slug);
    if (!route) {
      throw notFoundError(`No guided route named "${slug}" was found.`);
    }
    sendSuccess(res, route);
  });

  return router;
}
