import { Router } from 'express';
import { quizAnswerBodySchema, slugSchema } from '@echoes/shared';
import type { Dataset } from '../data';
import { QuizService } from '../services/quiz.service';
import { notFoundError, parseOrThrow } from '../utils/errors';
import { sendSuccess } from '../utils/response';

export function createQuizzesRouter(dataset: Dataset): Router {
  const router = Router();
  const service = new QuizService(dataset);

  router.get('/:artifactSlug', (req, res) => {
    const artifactSlug = parseOrThrow(
      slugSchema,
      req.params.artifactSlug,
      'artifact slug',
    );
    const quiz = service.getPublicQuiz(artifactSlug);
    if (!quiz) {
      throw notFoundError(`No mission debrief is available for "${artifactSlug}".`);
    }
    sendSuccess(res, quiz);
  });

  router.post('/:artifactSlug/answer', (req, res) => {
    const artifactSlug = parseOrThrow(
      slugSchema,
      req.params.artifactSlug,
      'artifact slug',
    );
    const body = parseOrThrow(quizAnswerBodySchema, req.body, 'quiz answer body');
    sendSuccess(res, service.answer(artifactSlug, body));
  });

  return router;
}
