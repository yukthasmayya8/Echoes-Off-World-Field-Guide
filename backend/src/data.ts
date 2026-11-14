/**
 * JSON data store loader and cross-record integrity validator.
 *
 * The dataset is validated once at process start. Any failure aborts startup
 * with a readable terminal report instead of serving partially-valid data.
 */
import fs from 'node:fs';
import path from 'node:path';
import { ZodError, z } from 'zod';
import {
  DATA_FILES,
  STORY_CHAPTER_COUNT,
  artifactSchema,
  guidedRouteSchema,
  quizDefinitionSchema,
  type Artifact,
  type DatasetCounts,
  type GuidedRoute,
  type QuizDefinition,
} from '@echoes/shared';

export interface DatasetValidationIssue {
  path: string;
  message: string;
}

export class DatasetValidationError extends Error {
  readonly issues: DatasetValidationIssue[];

  constructor(message: string, issues: DatasetValidationIssue[]) {
    super(message);
    this.name = 'DatasetValidationError';
    this.issues = issues;
  }
}

export class DatasetLoadError extends Error {
  readonly issues: DatasetValidationIssue[];

  constructor(message: string, issues: DatasetValidationIssue[] = []) {
    super(message);
    this.name = 'DatasetLoadError';
    this.issues = issues;
  }
}

export interface Dataset {
  artifacts: Artifact[];
  artifactsById: Map<string, Artifact>;
  artifactsBySlug: Map<string, Artifact>;
  verifiedArtifacts: Artifact[];
  routes: GuidedRoute[];
  routesBySlug: Map<string, GuidedRoute>;
  quizzes: QuizDefinition[];
  quizzesBySlug: Map<string, QuizDefinition>;
  counts: DatasetCounts;
  loadedAt: string;
  dataDir: string | null;
}

export interface DatasetInput {
  artifacts: unknown;
  routes: unknown;
  quizzes: unknown;
}

interface BuildOptions {
  dataDir?: string;
}

function formatZodIssues(error: ZodError, prefix: string): DatasetValidationIssue[] {
  return error.issues.map((issue) => ({
    path: [prefix, ...issue.path.map(String)].join('.'),
    message: issue.message,
  }));
}

function addDuplicateIssues(
  issues: DatasetValidationIssue[],
  values: Array<{ value: string; path: string }>,
): void {
  const seen = new Map<string, string>();
  for (const item of values) {
    const previous = seen.get(item.value);
    if (previous) {
      issues.push({
        path: item.path,
        message: `Duplicate value "${item.value}" (already used at ${previous})`,
      });
    } else {
      seen.set(item.value, item.path);
    }
  }
}

function validateArtifact(
  artifact: Artifact,
  index: number,
  byId: Map<string, Artifact>,
  issues: DatasetValidationIssue[],
): void {
  const prefix = `artifacts.${index}`;
  const sourceIds = new Set(artifact.sources.map((source) => source.id));

  addDuplicateIssues(
    issues,
    artifact.sources.map((source, sourceIndex) => ({
      value: source.id,
      path: `${prefix}.sources.${sourceIndex}.id`,
    })),
  );

  addDuplicateIssues(
    issues,
    artifact.aliases.map((alias, aliasIndex) => ({
      value: alias.toLowerCase(),
      path: `${prefix}.aliases.${aliasIndex}`,
    })),
  );

  const chapterNumbers = new Set<number>();
  addDuplicateIssues(
    issues,
    artifact.story.chapters.map((chapter, chapterIndex) => {
      chapterNumbers.add(chapter.number);
      return {
        value: chapter.id,
        path: `${prefix}.story.chapters.${chapterIndex}.id`,
      };
    }),
  );
  for (let number = 1; number <= STORY_CHAPTER_COUNT; number += 1) {
    if (!chapterNumbers.has(number)) {
      issues.push({
        path: `${prefix}.story.chapters`,
        message: `Missing chapter number ${number}; chapters must be numbered 1 through ${STORY_CHAPTER_COUNT}`,
      });
    }
  }

  for (const [chapterIndex, chapter] of artifact.story.chapters.entries()) {
    for (const [sourceIndex, sourceId] of chapter.sourceIds.entries()) {
      if (!sourceIds.has(sourceId)) {
        issues.push({
          path: `${prefix}.story.chapters.${chapterIndex}.sourceIds.${sourceIndex}`,
          message: `Unknown source "${sourceId}" referenced by chapter "${chapter.id}"`,
        });
      }
    }
  }

  addDuplicateIssues(
    issues,
    artifact.timeline.map((event, eventIndex) => ({
      value: event.id,
      path: `${prefix}.timeline.${eventIndex}.id`,
    })),
  );

  let previousDate = '';
  for (const [eventIndex, event] of artifact.timeline.entries()) {
    if (previousDate && event.date < previousDate) {
      issues.push({
        path: `${prefix}.timeline.${eventIndex}.date`,
        message: `Timeline event "${event.id}" is not chronological (${event.date} after ${previousDate})`,
      });
    }
    previousDate = event.date;

    for (const [sourceIndex, sourceId] of event.sourceIds.entries()) {
      if (!sourceIds.has(sourceId)) {
        issues.push({
          path: `${prefix}.timeline.${eventIndex}.sourceIds.${sourceIndex}`,
          message: `Unknown source "${sourceId}" referenced by timeline event "${event.id}"`,
        });
      }
    }
  }

  addDuplicateIssues(
    issues,
    artifact.discoveries.map((discovery, discoveryIndex) => ({
      value: discovery.id,
      path: `${prefix}.discoveries.${discoveryIndex}.id`,
    })),
  );

  for (const [discoveryIndex, discovery] of artifact.discoveries.entries()) {
    for (const [sourceIndex, sourceId] of discovery.sourceIds.entries()) {
      if (!sourceIds.has(sourceId)) {
        issues.push({
          path: `${prefix}.discoveries.${discoveryIndex}.sourceIds.${sourceIndex}`,
          message: `Unknown source "${sourceId}" referenced by discovery "${discovery.id}"`,
        });
      }
    }
  }

  const coordinateSourceId = artifact.location.coordinates?.sourceId;
  if (coordinateSourceId && !sourceIds.has(coordinateSourceId)) {
    issues.push({
      path: `${prefix}.location.coordinates.sourceId`,
      message: `Unknown source "${coordinateSourceId}" referenced by location coordinates`,
    });
  }

  if (artifact.parentArtifactId === artifact.id) {
    issues.push({
      path: `${prefix}.parentArtifactId`,
      message: 'An artifact cannot be its own parent',
    });
  }

  if (artifact.parentArtifactId) {
    const parent = byId.get(artifact.parentArtifactId);
    if (!parent) {
      issues.push({
        path: `${prefix}.parentArtifactId`,
        message: `Unknown parent artifact "${artifact.parentArtifactId}"`,
      });
    } else {
      if (parent.body !== artifact.body) {
        issues.push({
          path: `${prefix}.parentArtifactId`,
          message: `Parent "${parent.id}" is on ${parent.body} but this artifact is on ${artifact.body}`,
        });
      }
      if (!parent.childArtifactIds.includes(artifact.id)) {
        issues.push({
          path: `${prefix}.parentArtifactId`,
          message: `Parent "${parent.id}" does not list "${artifact.id}" in childArtifactIds`,
        });
      }
      if (artifact.verificationStatus === 'verified' && parent.verificationStatus !== 'verified') {
        issues.push({
          path: `${prefix}.parentArtifactId`,
          message: 'A verified artifact cannot have a needs_review parent',
        });
      }
    }
  }

  for (const [childIndex, childId] of artifact.childArtifactIds.entries()) {
    const child = byId.get(childId);
    if (!child) {
      issues.push({
        path: `${prefix}.childArtifactIds.${childIndex}`,
        message: `Unknown child artifact "${childId}"`,
      });
      continue;
    }
    if (child.parentArtifactId !== artifact.id) {
      issues.push({
        path: `${prefix}.childArtifactIds.${childIndex}`,
        message: `Child "${child.id}" does not point back to "${artifact.id}" as its parent`,
      });
    }
    if (child.body !== artifact.body) {
      issues.push({
        path: `${prefix}.childArtifactIds.${childIndex}`,
        message: `Child "${child.id}" is on ${child.body} but this artifact is on ${artifact.body}`,
      });
    }
    if (artifact.verificationStatus === 'verified' && child.verificationStatus !== 'verified') {
      issues.push({
        path: `${prefix}.childArtifactIds.${childIndex}`,
        message: 'A verified artifact cannot expose a needs_review child',
      });
    }
  }

  if (
    (artifact.parentArtifactId !== null || artifact.childArtifactIds.length > 0) &&
    !artifact.relationshipDescription
  ) {
    issues.push({
      path: `${prefix}.relationshipDescription`,
      message: 'A parent/child relationship requires a relationshipDescription',
    });
  }

  if (artifact.verificationStatus === 'needs_review' && !artifact.editorialNote) {
    issues.push({
      path: `${prefix}.editorialNote`,
      message: 'A needs_review artifact must explain what review is outstanding',
    });
  }
}

function validateRoutes(
  routes: GuidedRoute[],
  bySlug: Map<string, Artifact>,
  issues: DatasetValidationIssue[],
): void {
  for (const [routeIndex, route] of routes.entries()) {
    const prefix = `routes.${routeIndex}`;

    addDuplicateIssues(
      issues,
      route.steps.map((step, stepIndex) => ({
        value: step.id,
        path: `${prefix}.steps.${stepIndex}.id`,
      })),
    );

    const bodies = new Set<string>();

    for (const [stepIndex, step] of route.steps.entries()) {
      if (step.order !== stepIndex + 1) {
        issues.push({
          path: `${prefix}.steps.${stepIndex}.order`,
          message: `Expected order ${stepIndex + 1} but found ${step.order}`,
        });
      }

      const artifact = bySlug.get(step.artifactSlug);
      if (!artifact) {
        issues.push({
          path: `${prefix}.steps.${stepIndex}.artifactSlug`,
          message: `Unknown artifact slug "${step.artifactSlug}"`,
        });
        continue;
      }

      bodies.add(artifact.body);

      if (artifact.verificationStatus !== 'verified') {
        issues.push({
          path: `${prefix}.steps.${stepIndex}.artifactSlug`,
          message: `Route "${route.slug}" references needs_review artifact "${artifact.slug}"`,
        });
      }
    }

    if (route.body === 'mixed') {
      if (bodies.size < 2) {
        issues.push({
          path: `${prefix}.body`,
          message: 'A mixed route must include at least one Moon and one Mars artifact',
        });
      }
    } else if ([...bodies].some((body) => body !== route.body)) {
      issues.push({
        path: `${prefix}.body`,
        message: `Route body "${route.body}" does not match an artifact on another body`,
      });
    }
  }
}

function validateQuizzes(
  quizzes: QuizDefinition[],
  bySlug: Map<string, Artifact>,
  issues: DatasetValidationIssue[],
): void {
  for (const [quizIndex, quiz] of quizzes.entries()) {
    const prefix = `quizzes.${quizIndex}`;
    const artifact = bySlug.get(quiz.artifactSlug);

    if (!artifact) {
      issues.push({
        path: `${prefix}.artifactSlug`,
        message: `Unknown artifact slug "${quiz.artifactSlug}"`,
      });
      continue;
    }

    if (artifact.verificationStatus !== 'verified') {
      issues.push({
        path: `${prefix}.artifactSlug`,
        message: `Quiz "${quiz.title}" targets needs_review artifact "${artifact.slug}"`,
      });
    }

    const sourceIds = new Set(artifact.sources.map((source) => source.id));

    addDuplicateIssues(
      issues,
      quiz.questions.map((question, questionIndex) => ({
        value: question.id,
        path: `${prefix}.questions.${questionIndex}.id`,
      })),
    );

    for (const [questionIndex, question] of quiz.questions.entries()) {
      for (const [sourceIndex, sourceId] of question.sourceIds.entries()) {
        if (!sourceIds.has(sourceId)) {
          issues.push({
            path: `${prefix}.questions.${questionIndex}.sourceIds.${sourceIndex}`,
            message: `Unknown source "${sourceId}" referenced by question "${question.id}"`,
          });
        }
      }
    }
  }
}

/**
 * Parse and integrity-check already-decoded JSON values.
 * Exposed so tests can exercise validation without touching the filesystem.
 */
export function buildDataset(input: DatasetInput, options: BuildOptions = {}): Dataset {
  const issues: DatasetValidationIssue[] = [];

  const artifactsResult = z.array(artifactSchema).safeParse(input.artifacts);
  const routesResult = z.array(guidedRouteSchema).safeParse(input.routes);
  const quizzesResult = z.array(quizDefinitionSchema).safeParse(input.quizzes);

  if (!artifactsResult.success) {
    issues.push(...formatZodIssues(artifactsResult.error, 'artifacts'));
  }
  if (!routesResult.success) {
    issues.push(...formatZodIssues(routesResult.error, 'routes'));
  }
  if (!quizzesResult.success) {
    issues.push(...formatZodIssues(quizzesResult.error, 'quizzes'));
  }

  if (!artifactsResult.success || !routesResult.success || !quizzesResult.success) {
    throw new DatasetValidationError('Dataset schema validation failed', issues);
  }

  const artifacts = artifactsResult.data;
  const routes = routesResult.data;
  const quizzes = quizzesResult.data;

  const byId = new Map(artifacts.map((artifact) => [artifact.id, artifact]));
  const bySlug = new Map(artifacts.map((artifact) => [artifact.slug, artifact]));

  addDuplicateIssues(
    issues,
    artifacts.map((artifact, index) => ({ value: artifact.id, path: `artifacts.${index}.id` })),
  );
  addDuplicateIssues(
    issues,
    artifacts.map((artifact, index) => ({
      value: artifact.slug,
      path: `artifacts.${index}.slug`,
    })),
  );
  for (const [index, artifact] of artifacts.entries()) {
    validateArtifact(artifact, index, byId, issues);
  }

  addDuplicateIssues(
    issues,
    routes.map((route, index) => ({ value: route.id, path: `routes.${index}.id` })),
  );
  addDuplicateIssues(
    issues,
    routes.map((route, index) => ({ value: route.slug, path: `routes.${index}.slug` })),
  );
  addDuplicateIssues(
    issues,
    quizzes.map((quiz, index) => ({
      value: quiz.artifactSlug,
      path: `quizzes.${index}.artifactSlug`,
    })),
  );
  validateRoutes(routes, bySlug, issues);
  validateQuizzes(quizzes, bySlug, issues);

  if (issues.length > 0) {
    throw new DatasetValidationError('Dataset integrity validation failed', issues);
  }

  const verifiedArtifacts = artifacts.filter(
    (artifact) => artifact.verificationStatus === 'verified',
  );

  return {
    artifacts,
    artifactsById: byId,
    artifactsBySlug: bySlug,
    verifiedArtifacts,
    routes,
    routesBySlug: new Map(routes.map((route) => [route.slug, route])),
    quizzes,
    quizzesBySlug: new Map(quizzes.map((quiz) => [quiz.artifactSlug, quiz])),
    counts: {
      artifacts: artifacts.length,
      verified: verifiedArtifacts.length,
      needsReview: artifacts.length - verifiedArtifacts.length,
      routes: routes.length,
      quizzes: quizzes.length,
    },
    loadedAt: new Date().toISOString(),
    dataDir: options.dataDir ?? null,
  };
}

function readJsonFile(filePath: string): unknown {
  let raw: string;
  try {
    raw = fs.readFileSync(filePath, 'utf8');
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new DatasetLoadError(`Cannot read ${filePath}: ${message}`, [
      { path: filePath, message },
    ]);
  }

  try {
    return JSON.parse(raw) as unknown;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new DatasetLoadError(`Malformed JSON in ${filePath}: ${message}`, [
      { path: filePath, message },
    ]);
  }
}

const DATA_DIR_CANDIDATES = (): string[] => [
  process.env.ECHOES_DATA_DIR ?? '',
  path.resolve(process.cwd(), 'data'),
  path.resolve(process.cwd(), '../data'),
];

export function resolveDataDir(explicitDir?: string): string {
  if (explicitDir) {
    const resolved = path.resolve(explicitDir);
    if (fs.existsSync(path.join(resolved, DATA_FILES.artifacts))) {
      return resolved;
    }
    throw new DatasetLoadError(`Cannot find ${DATA_FILES.artifacts} in ${resolved}`, [
      { path: resolved, message: `Missing ${DATA_FILES.artifacts}` },
    ]);
  }

  const candidates = DATA_DIR_CANDIDATES().filter(Boolean);
  const unique = [...new Set(candidates.map((candidate) => path.resolve(candidate)))];

  for (const candidate of unique) {
    if (fs.existsSync(path.join(candidate, DATA_FILES.artifacts))) {
      return candidate;
    }
  }

  throw new DatasetLoadError(
    `Could not find ${DATA_FILES.artifacts}. Looked in: ${unique.join(', ')}`,
    unique.map((candidate) => ({
      path: candidate,
      message: `Missing ${DATA_FILES.artifacts}`,
    })),
  );
}

export function loadDataset(dataDir?: string): Dataset {
  const directory = resolveDataDir(dataDir);

  const artifacts = readJsonFile(path.join(directory, DATA_FILES.artifacts));
  const routes = readJsonFile(path.join(directory, DATA_FILES.routes));
  const quizzes = readJsonFile(path.join(directory, DATA_FILES.quizzes));

  return buildDataset({ artifacts, routes, quizzes }, { dataDir: directory });
}

let cachedDataset: Dataset | null = null;

export function getDataset(): Dataset {
  if (!cachedDataset) {
    cachedDataset = loadDataset();
  }
  return cachedDataset;
}

/** Test helper only. Does not alter any record's verification status. */
export function resetDatasetCacheForTests(): void {
  cachedDataset = null;
}

export function formatIssuesForTerminal(error: unknown): string {
  if (error instanceof DatasetValidationError || error instanceof DatasetLoadError) {
    const lines = [error.message];
    for (const issue of error.issues) {
      lines.push(`  - ${issue.path}: ${issue.message}`);
    }
    return lines.join('\n');
  }
  return error instanceof Error ? error.message : String(error);
}
