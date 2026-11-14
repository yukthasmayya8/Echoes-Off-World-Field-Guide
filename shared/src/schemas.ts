/**
 * Zod schemas for every stored JSON file plus request validation.
 *
 * The type assertions at the bottom make `tsc` fail if a schema and its
 * hand-written interface drift apart.
 */
import { z } from 'zod';
import {
  ARTIFACT_STATUS_FILTER_VALUES,
  ARTIFACT_TYPE_VALUES,
  BODY_VALUES,
  ISO_DATE_PATTERN,
  LOCATION_CONFIDENCE_VALUES,
  MAX_SEARCH_QUERY_LENGTH,
  MAX_SLUG_LENGTH,
  NSSDCA_RECORD_URL_PATTERN,
  QUIZ_MIN_OPTIONS,
  ROUTE_BODY_VALUES,
  SLUG_PATTERN,
  STORY_CHAPTER_COUNT,
  TIMELINE_EVENT_TYPE_VALUES,
  VERIFICATION_STATUS_VALUES,
} from './constants';
import type {
  Artifact,
  ArtifactImage,
  ArtifactListResult,
  ArtifactLocation,
  CatalogEntry,
  CatalogSearchResult,
  Discovery,
  GuidedRoute,
  GuidedRouteStep,
  HealthPayload,
  MissionInfo,
  NssdcaMetadata,
  Quiz,
  QuizAnswerResult,
  QuizDefinition,
  QuizOption,
  QuizQuestion,
  QuizQuestionDefinition,
  Source,
  Story,
  StoryChapter,
  TimelineEvent,
} from './types';

const nonEmpty = z.string().trim().min(1, 'Must not be empty');
const identifier = z.string().trim().min(1).max(120);

export const bodySchema = z.enum(BODY_VALUES);
export const routeBodySchema = z.enum(ROUTE_BODY_VALUES);
export const verificationStatusSchema = z.enum(VERIFICATION_STATUS_VALUES);
export const artifactStatusFilterSchema = z.enum(ARTIFACT_STATUS_FILTER_VALUES);
export const artifactTypeSchema = z.enum(ARTIFACT_TYPE_VALUES);
export const locationConfidenceSchema = z.enum(LOCATION_CONFIDENCE_VALUES);
export const timelineEventTypeSchema = z.enum(TIMELINE_EVENT_TYPE_VALUES);

export const slugSchema = z
  .string()
  .min(1)
  .max(MAX_SLUG_LENGTH)
  .regex(SLUG_PATTERN, 'Expected a lowercase kebab-case slug');

export const isoDateSchema = z
  .string()
  .regex(ISO_DATE_PATTERN, 'Expected a calendar date in YYYY-MM-DD form')
  .refine((value) => {
    const parsed = new Date(`${value}T00:00:00.000Z`);
    return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
  }, 'Expected a real calendar date in YYYY-MM-DD form');

const httpUrlSchema = z.string().refine((value) => {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}, 'Expected an absolute http(s) URL');

export const sourceSchema = z.object({
  id: slugSchema,
  title: nonEmpty,
  organization: nonEmpty,
  url: httpUrlSchema,
  supportedClaims: z.array(nonEmpty).min(1, 'A source must list at least one supported claim'),
  originalWording: nonEmpty,
  simplifiedExplanation: nonEmpty,
  accessedOn: isoDateSchema,
});

export const artifactImageSchema = z.object({
  url: httpUrlSchema,
  alt: nonEmpty,
  credit: nonEmpty,
});

export const nssdcaSourceFieldSchema = z.object({
  field: nonEmpty,
  value: nonEmpty,
});

export const nssdcaMetadataSchema = z
  .object({
    recordTitle: nonEmpty,
    recordId: z
      .string()
      .min(1)
      .max(40)
      .regex(/^[A-Za-z0-9-]+$/, 'NSSDCA record IDs contain only letters, digits and hyphens'),
    recordUrl: z.string().regex(NSSDCA_RECORD_URL_PATTERN, 'Expected an NSSDCA spacecraft record URL'),
    checkedOn: isoDateSchema,
    originalSourceFields: z.array(nssdcaSourceFieldSchema).min(1),
  })
  .superRefine((metadata, ctx) => {
    const urlId = metadata.recordUrl.split('id=')[1];
    if (urlId !== metadata.recordId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['recordUrl'],
        message: `NSSDCA URL id "${urlId ?? ''}" does not match recordId "${metadata.recordId}"`,
      });
    }
  });

export const missionInfoSchema = z
  .object({
    objective: nonEmpty,
    launchDate: isoDateSchema.nullable(),
    arrivalDate: isoDateSchema.nullable(),
    originalOperationalStatus: nonEmpty,
    simplifiedOperationalStatus: nonEmpty,
    finalDisposition: nonEmpty,
  })
  .superRefine((mission, ctx) => {
    if (mission.launchDate && mission.arrivalDate && mission.arrivalDate < mission.launchDate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['arrivalDate'],
        message: 'arrivalDate must not be earlier than launchDate',
      });
    }
  });

export const artifactCoordinatesSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-360).max(360),
  referenceFrame: nonEmpty.optional(),
  sourceId: identifier,
});

export const artifactLocationSchema = z.object({
  label: nonEmpty,
  confidence: locationConfidenceSchema,
  explanation: nonEmpty,
  coordinates: artifactCoordinatesSchema.optional(),
});

export const storyChapterSchema = z.object({
  id: slugSchema,
  number: z.number().int().min(1).max(STORY_CHAPTER_COUNT),
  title: nonEmpty,
  originalWording: nonEmpty,
  simplifiedWording: nonEmpty,
  sourceIds: z.array(identifier).min(1),
});

export const storySchema = z.object({
  chapters: z
    .array(storyChapterSchema)
    .length(STORY_CHAPTER_COUNT, `A story must contain exactly ${STORY_CHAPTER_COUNT} chapters`),
});

export const timelineEventSchema = z.object({
  id: slugSchema,
  title: nonEmpty,
  date: isoDateSchema,
  description: nonEmpty,
  eventType: timelineEventTypeSchema,
  sourceIds: z.array(identifier).min(1),
});

export const discoverySchema = z.object({
  id: slugSchema,
  hardware: nonEmpty,
  observation: nonEmpty,
  scientificResult: nonEmpty,
  simpleExplanation: nonEmpty,
  detailedExplanation: nonEmpty,
  sourceIds: z.array(identifier).min(1),
});

export const artifactSchema = z.object({
  id: slugSchema,
  slug: slugSchema,
  name: nonEmpty,
  aliases: z.array(nonEmpty),
  body: bodySchema,
  missionName: nonEmpty,
  artifactType: artifactTypeSchema,
  parentMission: nonEmpty,
  parentArtifactId: identifier.nullable(),
  childArtifactIds: z.array(identifier),
  relationshipDescription: nonEmpty.nullable(),
  verificationStatus: verificationStatusSchema,
  nssdca: nssdcaMetadataSchema,
  mission: missionInfoSchema,
  location: artifactLocationSchema,
  summary: nonEmpty,
  story: storySchema,
  timeline: z.array(timelineEventSchema).min(1),
  discoveries: z.array(discoverySchema),
  sources: z.array(sourceSchema).min(1),
  image: artifactImageSchema.optional(),
  editorialNote: nonEmpty.optional(),
});

export const artifactSummarySchema = z.object({
  id: slugSchema,
  slug: slugSchema,
  name: nonEmpty,
  aliases: z.array(nonEmpty),
  body: bodySchema,
  missionName: nonEmpty,
  artifactType: artifactTypeSchema,
  nssdcaRecordId: nonEmpty,
  nssdcaRecordUrl: nonEmpty,
  locationConfidence: locationConfidenceSchema,
  verificationStatus: verificationStatusSchema,
  summary: nonEmpty,
});

export const catalogEntrySchema = artifactSummarySchema.extend({
  matchedOn: z.array(nonEmpty),
});

export const guidedRouteStepSchema = z.object({
  id: slugSchema,
  order: z.number().int().min(1),
  artifactSlug: slugSchema,
  title: nonEmpty,
  narrative: nonEmpty,
  focus: nonEmpty,
});

export const guidedRouteSchema = z.object({
  id: slugSchema,
  slug: slugSchema,
  title: nonEmpty,
  description: nonEmpty,
  body: routeBodySchema,
  estimatedMinutes: z.number().int().min(1).max(240),
  steps: z.array(guidedRouteStepSchema).min(1),
});

export const quizOptionSchema = z.object({
  id: slugSchema,
  text: nonEmpty,
});

const quizQuestionBaseSchema = z.object({
  id: slugSchema,
  prompt: nonEmpty,
  options: z
    .array(quizOptionSchema)
    .min(QUIZ_MIN_OPTIONS, `A question needs at least ${QUIZ_MIN_OPTIONS} options`),
  sourceIds: z.array(identifier).min(1),
});

function checkOptions(
  question: { options: Array<{ id: string }> },
  ctx: z.RefinementCtx,
): void {
  const seen = new Set<string>();
  for (const [index, option] of question.options.entries()) {
    if (seen.has(option.id)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['options', index, 'id'],
        message: `Duplicate option id "${option.id}"`,
      });
    }
    seen.add(option.id);
  }
}

export const quizQuestionSchema = quizQuestionBaseSchema.superRefine(checkOptions);

export const quizQuestionDefinitionSchema = quizQuestionBaseSchema
  .extend({
    correctOptionId: identifier,
    explanation: nonEmpty,
  })
  .superRefine((question, ctx) => {
    checkOptions(question, ctx);
    if (!question.options.some((option) => option.id === question.correctOptionId)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['correctOptionId'],
        message: `correctOptionId "${question.correctOptionId}" is not one of the question options`,
      });
    }
  });

export const quizSchema = z.object({
  artifactSlug: slugSchema,
  title: nonEmpty,
  questions: z.array(quizQuestionSchema).min(1),
});

export const quizDefinitionSchema = z.object({
  artifactSlug: slugSchema,
  title: nonEmpty,
  questions: z.array(quizQuestionDefinitionSchema).min(1),
});

/* -------------------------------------------------------------------------- */
/* Request schemas                                                            */
/* -------------------------------------------------------------------------- */

export const catalogQuerySchema = z.object({
  q: z.string().trim().max(MAX_SEARCH_QUERY_LENGTH).optional().default(''),
  body: bodySchema.optional(),
});

export const artifactQuerySchema = z.object({
  body: bodySchema.optional(),
  type: artifactTypeSchema.optional(),
  status: artifactStatusFilterSchema.optional().default('verified'),
  q: z.string().trim().max(MAX_SEARCH_QUERY_LENGTH).optional().default(''),
});

export const slugParamSchema = z.object({
  slug: slugSchema,
});

export const quizAnswerBodySchema = z
  .object({
    optionId: identifier,
    questionId: identifier.optional(),
  })
  .strict();

/* -------------------------------------------------------------------------- */
/* Compile-time contract checks                                               */
/* -------------------------------------------------------------------------- */

type Exact<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false;
type Assert<T extends true> = T;

type _SourceSchema = Assert<Exact<z.infer<typeof sourceSchema>, Source>>;
type _ImageSchema = Assert<Exact<z.infer<typeof artifactImageSchema>, ArtifactImage>>;
type _NssdcaSchema = Assert<Exact<z.infer<typeof nssdcaMetadataSchema>, NssdcaMetadata>>;
type _MissionSchema = Assert<Exact<z.infer<typeof missionInfoSchema>, MissionInfo>>;
type _LocationSchema = Assert<Exact<z.infer<typeof artifactLocationSchema>, ArtifactLocation>>;
type _ChapterSchema = Assert<Exact<z.infer<typeof storyChapterSchema>, StoryChapter>>;
type _StorySchema = Assert<Exact<z.infer<typeof storySchema>, Story>>;
type _TimelineSchema = Assert<Exact<z.infer<typeof timelineEventSchema>, TimelineEvent>>;
type _DiscoverySchema = Assert<Exact<z.infer<typeof discoverySchema>, Discovery>>;
type _ArtifactSchema = Assert<Exact<z.infer<typeof artifactSchema>, Artifact>>;
type _RouteStepSchema = Assert<Exact<z.infer<typeof guidedRouteStepSchema>, GuidedRouteStep>>;
type _RouteSchema = Assert<Exact<z.infer<typeof guidedRouteSchema>, GuidedRoute>>;
type _OptionSchema = Assert<Exact<z.infer<typeof quizOptionSchema>, QuizOption>>;
type _QuestionSchema = Assert<Exact<z.infer<typeof quizQuestionSchema>, QuizQuestion>>;
type _QuestionDefinitionSchema = Assert<
  Exact<z.infer<typeof quizQuestionDefinitionSchema>, QuizQuestionDefinition>
>;
type _QuizSchema = Assert<Exact<z.infer<typeof quizSchema>, Quiz>>;
type _QuizDefinitionSchema = Assert<Exact<z.infer<typeof quizDefinitionSchema>, QuizDefinition>>;
type _EntrySchema = Assert<Exact<z.infer<typeof catalogEntrySchema>, CatalogEntry>>;

/* Response envelopes are exported for tests and future client validation. */
export const healthPayloadSchema = z.object({
  status: z.enum(['ok', 'degraded']),
  apiVersion: nonEmpty,
  timestamp: nonEmpty,
  uptimeSeconds: z.number().min(0),
  dataset: z.object({
    artifacts: z.number().int().min(0),
    verified: z.number().int().min(0),
    needsReview: z.number().int().min(0),
    routes: z.number().int().min(0),
    quizzes: z.number().int().min(0),
  }),
}) satisfies z.ZodType<HealthPayload>;

export const catalogSearchResultSchema = z.object({
  query: z.string(),
  body: bodySchema.optional(),
  count: z.number().int().min(0),
  results: z.array(catalogEntrySchema),
  availableBodies: z.array(bodySchema),
}) satisfies z.ZodType<CatalogSearchResult>;

export const artifactListResultSchema = z.object({
  count: z.number().int().min(0),
  filters: z.object({
    body: bodySchema.optional(),
    type: artifactTypeSchema.optional(),
    status: artifactStatusFilterSchema,
    q: z.string(),
  }),
  artifacts: z.array(artifactSummarySchema),
}) satisfies z.ZodType<ArtifactListResult>;

export const quizAnswerResultSchema = z.object({
  artifactSlug: slugSchema,
  questionId: identifier,
  optionId: identifier,
  correct: z.boolean(),
  correctOptionId: identifier,
  explanation: nonEmpty,
  sourceIds: z.array(identifier),
  sources: z.array(sourceSchema),
  evaluatedBy: z.enum(['server', 'local']),
}) satisfies z.ZodType<QuizAnswerResult>;
