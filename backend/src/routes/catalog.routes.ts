import { Router } from 'express';
import { catalogQuerySchema } from '@echoes/shared';
import type { Dataset } from '../data';
import { CatalogService } from '../services/catalog.service';
import { parseOrThrow } from '../utils/errors';
import { sendSuccess } from '../utils/response';

export function createCatalogRouter(dataset: Dataset): Router {
  const router = Router();
  const service = new CatalogService(dataset);

  router.get('/search', (req, res) => {
    const query = parseOrThrow(catalogQuerySchema, req.query, 'query parameters');
    sendSuccess(res, service.search(query.q, query.body));
  });

  return router;
}
