import express, { type Express } from 'express';
import { API_PREFIX } from '@echoes/shared';
import { getDataset, type Dataset } from './data';
import { errorHandler } from './middleware/errorHandler';
import { notFound } from './middleware/notFound';
import { createArtifactsRouter } from './routes/artifacts.routes';
import { createCatalogRouter } from './routes/catalog.routes';
import { createHealthRouter } from './routes/health.routes';
import { createQuizzesRouter } from './routes/quizzes.routes';
import { createRoutesRouter } from './routes/routes.routes';

export interface CreateAppOptions {
  /**
   * Inject a validated dataset (used by tests and by the server bootstrap).
   * When omitted, the singleton JSON dataset is loaded.
   */
  dataset?: Dataset;
}

export function createApp(options: CreateAppOptions = {}): Express {
  const dataset = options.dataset ?? getDataset();
  const app = express();

  app.disable('x-powered-by');

  app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', process.env.CORS_ORIGIN ?? '*');
    res.setHeader('Vary', 'Origin');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Cache-Control', 'no-store');

    if (req.method === 'OPTIONS') {
      res.status(204).end();
      return;
    }
    next();
  });

  app.use(express.json({ limit: '100kb' }));

  app.use(API_PREFIX, createHealthRouter(dataset));
  app.use(`${API_PREFIX}/catalog`, createCatalogRouter(dataset));
  app.use(`${API_PREFIX}/artifacts`, createArtifactsRouter(dataset));
  app.use(`${API_PREFIX}/routes`, createRoutesRouter(dataset));
  app.use(`${API_PREFIX}/quizzes`, createQuizzesRouter(dataset));

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
