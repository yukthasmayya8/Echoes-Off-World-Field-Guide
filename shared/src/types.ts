/**
 * Shared TypeScript contracts for Echoes — Off-World Field Guide.
 *
 * Every backend response and every frontend feature consumes these types.
 * Zod schemas in `schemas.ts` assert that the JSON store matches them.
 */

export type Body = 'moon' | 'mars';
export type VerificationStatus = 'verified' | 'needs_review';
export type ArtifactStatusFilter = VerificationStatus | 'all';
export type ArtifactType =
  | 'lander'
  | 'rover'
  | 'lunar-module'
  | 'robotic-lander'
  | 'experiment-package'
  | 'orbiter'
  | 'other';
export type LocationConfidence = 'exact' | 'approximate' | 'unknown';
export type TimelineEventType =
  | 'launch'
  | 'arrival'
  | 'landing'
  | 'deployment'
  | 'surface-operations'
  | 'science'
  | 'departure'
  | 'end-of-mission'
  | 'afterlife'
  | 'other';
export type RouteBody = Body | 'mixed';
export type QuizEvaluationSource = 'server' | 'local';

/** A source supporting one or more claims on an artifact. */
export interface Source {
  /** Stable identifier referenced by chapters, events, discoveries and quizzes. */
  id: string;
  title: string;
  organization: string;
  url: string;
  /** Human-readable claims this source supports. */
  supportedClaims: string[];
  /** Wording kept as close as possible to the archive text. */
  originalWording: string;
  /** Plain-language explanation of the same evidence. */
  simplifiedExplanation: string;
  /** Source-check date, YYYY-MM-DD. */
  accessedOn: string;
}

export interface ArtifactImage {
  url: string;
  alt: string;
  credit: string;
}

export interface NssdcaSourceField {
  field: string;
  value: string;
}

/** Archival metadata copied from an NSSDCA master-catalog record. */
export interface NssdcaMetadata {
  recordTitle: string;
  recordId: string;
  recordUrl: string;
  /** Date on which a human checked the record, YYYY-MM-DD. */
  checkedOn: string;
  /** Selected fields exactly as presented by the archive. */
  originalSourceFields: NssdcaSourceField[];
}

export interface MissionInfo {
  objective: string;
  launchDate: string | null;
  arrivalDate: string | null;
  /** Status language retained from the archive. */
  originalOperationalStatus: string;
  /** Plain-language rewording of the same status. */
  simplifiedOperationalStatus: string;
  finalDisposition: string;
}

export interface ArtifactCoordinates {
  latitude: number;
  longitude: number;
  /** Coordinate frame or convention, only when the source states one. */
  referenceFrame?: string;
  /** Source that supports the coordinates. */
  sourceId: string;
}

export interface ArtifactLocation {
  label: string;
  confidence: LocationConfidence;
  explanation: string;
  coordinates?: ArtifactCoordinates;
}

export interface StoryChapter {
  id: string;
  /** 1 through 5; the story must have exactly five chapters. */
  number: number;
  title: string;
  originalWording: string;
  simplifiedWording: string;
  sourceIds: string[];
}

export interface Story {
  chapters: StoryChapter[];
}

export interface TimelineEvent {
  id: string;
  title: string;
  /** ISO calendar date, YYYY-MM-DD. */
  date: string;
  description: string;
  eventType: TimelineEventType;
  sourceIds: string[];
}

export interface Discovery {
  id: string;
  hardware: string;
  observation: string;
  scientificResult: string;
  simpleExplanation: string;
  detailedExplanation: string;
  sourceIds: string[];
}

export interface Artifact {
  id: string;
  slug: string;
  name: string;
  aliases: string[];
  body: Body;
  missionName: string;
  artifactType: ArtifactType;
  parentMission: string;
  parentArtifactId: string | null;
  childArtifactIds: string[];
  relationshipDescription: string | null;
  verificationStatus: VerificationStatus;
  nssdca: NssdcaMetadata;
  mission: MissionInfo;
  location: ArtifactLocation;
  summary: string;
  story: Story;
  timeline: TimelineEvent[];
  discoveries: Discovery[];
  sources: Source[];
  image?: ArtifactImage;
  /** Required when a record is still under editorial review. */
  editorialNote?: string;
}

/** Compact shape used by the atlas, search results and route previews. */
export interface ArtifactSummary {
  id: string;
  slug: string;
  name: string;
  aliases: string[];
  body: Body;
  missionName: string;
  artifactType: ArtifactType;
  nssdcaRecordId: string;
  nssdcaRecordUrl: string;
  locationConfidence: LocationConfidence;
  verificationStatus: VerificationStatus;
  summary: string;
}

export interface CatalogEntry extends ArtifactSummary {
  /** Which fields matched a search query. Empty when browsing. */
  matchedOn: string[];
}

export interface GuidedRouteStep {
  /** Stable identifier, suitable for progress tracking. */
  id: string;
  /** 1-based position in the route. */
  order: number;
  artifactSlug: string;
  title: string;
  narrative: string;
  focus: string;
}

export interface GuidedRoute {
  id: string;
  slug: string;
  title: string;
  description: string;
  body: RouteBody;
  estimatedMinutes: number;
  steps: GuidedRouteStep[];
}

export interface QuizOption {
  id: string;
  text: string;
}

/** Public quiz question shape: deliberately contains no correct answer. */
export interface QuizQuestion {
  id: string;
  prompt: string;
  options: QuizOption[];
  sourceIds: string[];
}

export interface Quiz {
  artifactSlug: string;
  title: string;
  questions: QuizQuestion[];
}

/** Stored quiz question shape. Never sent to the client directly. */
export interface QuizQuestionDefinition extends QuizQuestion {
  correctOptionId: string;
  explanation: string;
}

/** Stored quiz shape, including answer keys. */
export interface QuizDefinition {
  artifactSlug: string;
  title: string;
  questions: QuizQuestionDefinition[];
}

export interface QuizAnswerResult {
  artifactSlug: string;
  questionId: string;
  optionId: string;
  correct: boolean;
  correctOptionId: string;
  explanation: string;
  sourceIds: string[];
  /** Hydrated source objects supporting the explanation. */
  sources: Source[];
  evaluatedBy: QuizEvaluationSource;
}

export interface QuizAnswerRequest {
  optionId: string;
  questionId?: string;
}

/* -------------------------------------------------------------------------- */
/* API envelopes                                                              */
/* -------------------------------------------------------------------------- */

export interface ApiMeta {
  apiVersion: string;
  timestamp: string;
}

export interface ApiSuccess<T> {
  success: true;
  data: T;
  meta: ApiMeta;
}

export interface ApiErrorDetail {
  path: string;
  message: string;
}

export interface ApiErrorInfo {
  code: string;
  message: string;
  details?: ApiErrorDetail[];
}

export interface ApiFailure {
  success: false;
  error: ApiErrorInfo;
  meta: ApiMeta;
}

export type ApiResponse<T> = ApiSuccess<T> | ApiFailure;

export interface DatasetCounts {
  artifacts: number;
  verified: number;
  needsReview: number;
  routes: number;
  quizzes: number;
}

export interface HealthPayload {
  status: 'ok' | 'degraded';
  apiVersion: string;
  timestamp: string;
  uptimeSeconds: number;
  dataset: DatasetCounts;
}

export interface ArtifactFilters {
  body?: Body;
  type?: ArtifactType;
  status?: ArtifactStatusFilter;
  q?: string;
}

export interface CatalogSearchResult {
  query: string;
  body?: Body;
  count: number;
  results: CatalogEntry[];
  availableBodies: Body[];
}

export interface ArtifactListResult {
  count: number;
  filters: {
    body?: Body;
    type?: ArtifactType;
    status: ArtifactStatusFilter;
    q: string;
  };
  artifacts: ArtifactSummary[];
}

export interface GuidedRouteListResult {
  count: number;
  routes: GuidedRoute[];
}

/* -------------------------------------------------------------------------- */
/* Frontend integration result types                                          */
/* -------------------------------------------------------------------------- */

export type DataSource = 'api' | 'demo';

export interface Sourced<T> {
  data: T;
  source: DataSource;
  /** Present when the API was unavailable and local data was used. */
  notice?: string;
}
