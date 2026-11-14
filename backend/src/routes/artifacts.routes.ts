import { Router } from 'express';
import { artifactQuerySchema, slugSchema } from '@echoes/shared';
import type { Dataset } from '../data';
import { ArtifactService } from '../services/artifact.service';
import { notFoundError, parseOrThrow } from '../utils/errors';
import { sendSuccess } from '../utils/response';

export function createArtifactsRouter(dataset: Dataset): Router {
  const router = Router();
  const service = new ArtifactService(dataset);

  router.get('/', (req, res) => {
    const query = parseOrThrow(artifactQuerySchema, req.query, 'query parameters');
    sendSuccess(res, service.list(query));
  });

  router.get('/:slug', (req, res) => {
    const slug = parseOrThrow(slugSchema, req.params.slug, 'artifact slug');
    const artifact = service.getPublicBySlug(slug);
    if (!artifact) {
      throw notFoundError(`No verified artifact named "${slug}" was found.`);
    }
    sendSuccess(res, artifact);
  });

  return router;
}
