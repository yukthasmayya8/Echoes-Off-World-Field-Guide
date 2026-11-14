/**
 * Offline demo dataset.
 *
 * This is a real fallback, not a mock: it loads the same verified JSON files
 * that the backend serves. needs_review records are filtered out at every
 * entry point, and the caller is told that the data came from DEMO MODE.
 */
import {
  availableBodies,
  evaluateQuizOption,
  filterArtifacts,
  searchArtifacts,
  toArtifactSummary,
  toPublicQuiz,
  artifactSchema,
  guidedRouteSchema,
  quizDefinitionSchema,
  type Artifact,
  type ArtifactFilters,
  type ArtifactListResult,
  type Body,
  type CatalogSearchResult,
  type GuidedRoute,
  type Quiz,
  type QuizAnswerResult,
  type Source,
} from '@echoes/shared';
import artifactsJson from '../../../data/artifacts.json';
import routesJson from '../../../data/guided-routes.json';
import quizzesJson from '../../../data/quizzes.json';

export class LocalDataError extends Error {
  readonly issues: string[];

  constructor(message: string, issues: string[] = []) {
    super(message);
    this.name = 'LocalDataError';
    this.issues = issues;
  }
}

export class LocalQuizError extends Error {
  readonly code: 'NOT_FOUND' | 'INVALID_ANSWER';

  constructor(code: 'NOT_FOUND' | 'INVALID_ANSWER', message: string) {
    super(message);
    this.name = 'LocalQuizError';
    this.code = code;
  }
}

interface LocalData {
  artifacts: Artifact[];
  routes: GuidedRoute[];
  quizzes: ReturnType<typeof quizDefinitionSchema.parse>[];
  verifiedSlugs: Set<string>;
}

let cached: LocalData | null = null;
let loadFailure: Error | null = null;

function parseLocalData(): LocalData {
  const artifacts = artifactSchema.array().safeParse(artifactsJson);
  const routes = guidedRouteSchema.array().safeParse(routesJson);
  const quizzes = quizDefinitionSchema.array().safeParse(quizzesJson);

  const issues: string[] = [];
  if (!artifacts.success) {
    issues.push(
      ...artifacts.error.issues.map(
        (issue) => `artifacts.${issue.path.join('.')}: ${issue.message}`,
      ),
    );
  }
  if (!routes.success) {
    issues.push(
      ...routes.error.issues.map((issue) => `routes.${issue.path.join('.')}: ${issue.message}`),
    );
  }
  if (!quizzes.success) {
    issues.push(
      ...quizzes.error.issues.map(
        (issue) => `quizzes.${issue.path.join('.')}: ${issue.message}`,
      ),
    );
  }

  if (!artifacts.success || !routes.success || !quizzes.success) {
    throw new LocalDataError(
      'The local demo dataset did not match the shared schemas.',
      issues,
    );
  }

  const verifiedSlugs = new Set(
    artifacts.data
      .filter((artifact) => artifact.verificationStatus === 'verified')
      .map((artifact) => artifact.slug),
  );

  return {
    artifacts: artifacts.data,
    routes: routes.data,
    quizzes: quizzes.data,
    verifiedSlugs,
  };
}

function getData(): LocalData {
  if (cached) return cached;
  if (loadFailure) throw loadFailure;

  try {
    cached = parseLocalData();
    return cached;
  } catch (error) {
    loadFailure = error instanceof Error ? error : new LocalDataError(String(error));
    throw loadFailure;
  }
}

export function isLocalFallbackAvailable(): boolean {
  try {
    getData();
    return true;
  } catch {
    return false;
  }
}

export function localFallbackInfo(): {
  demo: true;
  artifacts: number;
  routes: number;
  quizzes: number;
} {
  const data = getData();
  return {
    demo: true,
    artifacts: data.verifiedSlugs.size,
    routes: data.routes.length,
    quizzes: data.quizzes.length,
  };
}

export function searchLocalCatalog(query = '', body?: Body): CatalogSearchResult {
  const data = getData();
  const results = searchArtifacts(data.artifacts, query, body);

  return {
    query,
    ...(body ? { body } : {}),
    count: results.length,
    results,
    availableBodies: availableBodies(),
  };
}

export function listLocalArtifacts(filters: ArtifactFilters = {}): ArtifactListResult {
  const data = getData();
  const effective: ArtifactFilters = { ...filters, status: 'verified' };
  const matches = filterArtifacts(data.artifacts, effective);

  return {
    count: matches.length,
    filters: {
      ...(effective.body ? { body: effective.body } : {}),
      ...(effective.type ? { type: effective.type } : {}),
      status: 'verified',
      q: effective.q ?? '',
    },
    artifacts: matches.map(toArtifactSummary),
  };
}

export function getLocalArtifactBySlug(slug: string): Artifact | undefined {
  const data = getData();
  if (!data.verifiedSlugs.has(slug)) return undefined;
  return data.artifacts.find((artifact) => artifact.slug === slug);
}

export function getLocalRoutes(): GuidedRoute[] {
  const data = getData();
  return data.routes.filter((route) =>
    route.steps.every((step) => data.verifiedSlugs.has(step.artifactSlug)),
  );
}

export function getLocalRouteBySlug(slug: string): GuidedRoute | undefined {
  return getLocalRoutes().find((route) => route.slug === slug);
}

export function getLocalQuiz(artifactSlug: string): Quiz | undefined {
  const data = getData();
  if (!data.verifiedSlugs.has(artifactSlug)) return undefined;

  const definition = data.quizzes.find((quiz) => quiz.artifactSlug === artifactSlug);
  return definition ? toPublicQuiz(definition) : undefined;
}

/**
 * Local evaluation is explicitly marked with evaluatedBy: 'local'. It mirrors
 * the server rule exactly but never writes quiz history anywhere.
 */
export function evaluateLocalQuizAnswer(
  artifactSlug: string,
  optionId: string,
  questionId?: string,
): QuizAnswerResult {
  const data = getData();
  const artifact = getLocalArtifactBySlug(artifactSlug);
  if (!artifact) {
    throw new LocalQuizError(
      'NOT_FOUND',
      `No verified artifact named "${artifactSlug}" is available in the demo dataset.`,
    );
  }

  const definition = data.quizzes.find((quiz) => quiz.artifactSlug === artifactSlug);
  if (!definition) {
    throw new LocalQuizError(
      'NOT_FOUND',
      `No mission debrief is available for "${artifactSlug}".`,
    );
  }

  const outcome = evaluateQuizOption(definition, optionId, questionId);
  if (!outcome.ok) {
    throw new LocalQuizError(
      outcome.reason === 'QUESTION_NOT_FOUND' ? 'NOT_FOUND' : 'INVALID_ANSWER',
      outcome.message,
    );
  }

  const sourcesById = new Map<string, Source>(
    artifact.sources.map((source) => [source.id, source]),
  );

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
      .filter((source): source is Source => Boolean(source)),
    evaluatedBy: 'local',
  };
}
