import {
  evaluateQuizOption,
  toPublicQuiz,
  type Quiz,
  type QuizAnswerResult,
  type QuizAnswerRequest,
} from '@echoes/shared';
import type { Dataset } from '../data';
import { invalidAnswerError, notFoundError } from '../utils/errors';

export class QuizService {
  constructor(private readonly dataset: Dataset) {}

  getPublicQuiz(artifactSlug: string): Quiz | undefined {
    const artifact = this.dataset.artifactsBySlug.get(artifactSlug);
    if (!artifact || artifact.verificationStatus !== 'verified') return undefined;

    const definition = this.dataset.quizzesBySlug.get(artifactSlug);
    return definition ? toPublicQuiz(definition) : undefined;
  }

  answer(artifactSlug: string, request: QuizAnswerRequest): QuizAnswerResult {
    const artifact = this.dataset.artifactsBySlug.get(artifactSlug);
    if (!artifact || artifact.verificationStatus !== 'verified') {
      throw notFoundError(`No verified artifact named "${artifactSlug}" was found.`);
    }

    const definition = this.dataset.quizzesBySlug.get(artifactSlug);
    if (!definition) {
      throw notFoundError(`No mission debrief is available for "${artifactSlug}".`);
    }

    const outcome = evaluateQuizOption(definition, request.optionId, request.questionId);

    if (!outcome.ok) {
      if (outcome.reason === 'QUESTION_NOT_FOUND') {
        throw notFoundError(outcome.message);
      }
      throw invalidAnswerError(outcome.message);
    }

    const sourcesById = new Map(artifact.sources.map((source) => [source.id, source]));

    return {
      artifactSlug,
      questionId: outcome.question.id,
      optionId: outcome.selectedOption.id,
      correct: outcome.correct,
      correctOptionId: outcome.correctOptionId,
      explanation: outcome.explanation,
      sourceIds: outcome.sourceIds,
      sources: outcome.sourceIds
        .map((sourceId) => sourcesById.get(sourceId))
        .filter((source): source is NonNullable<typeof source> => Boolean(source)),
      evaluatedBy: 'server',
    };
  }
}
