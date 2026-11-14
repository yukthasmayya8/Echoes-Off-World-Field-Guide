/**
 * Adapters between the canonical shared contracts (featureTypes.ts) and the
 * teammate feature components' established prop shapes (legacyTypes.ts).
 *
 * The parent application keeps passing typed shared data; these mappers are
 * pure functions, so feature components never fetch or mutate anything and no
 * information is invented during conversion. Fields the shared contracts do
 * not carry are left undefined so the components render their honest
 * "not listed" fallbacks.
 */
import type {
  Artifact as SharedArtifact,
  CatalogEntry,
  Discovery as SharedDiscovery,
  Quiz as SharedQuiz,
  QuizQuestion as SharedQuizQuestion,
  Source as SharedSource,
  StoryChapter as SharedStoryChapter,
  TimelineEvent as SharedTimelineEvent,
} from '@echoes/shared';
import type { ArtifactSummary as AtlasRecord } from '../atlas/AtlasFeature';
import type {
  Artifact as LegacyArtifact,
  Chapter as LegacyChapter,
  Discovery as LegacyDiscovery,
  Quiz as LegacyQuiz,
  Source as LegacySource,
  TimelineEvent as LegacyTimelineEvent,
} from '../legacyTypes';
import type { AtlasFeatureLocation } from './featureTypes';

/** Legacy chapter keys, in the canonical five-chapter order. */
const CHAPTER_KEY_ORDER = [
  'why-sent',
  'carried',
  'found',
  'ended',
  'remains',
] as const;

/**
 * A mission counts as ended only when the archived final disposition says so.
 * Anything else stays "unknown" instead of being guessed.
 */
const END_OF_MISSION_SIGNALS =
  /remain|crash|lost|shut ?down|failed|no longer|terminated|silence/i;

export function deriveLegacyStatus(artifact: SharedArtifact): LegacyArtifact['status'] {
  return END_OF_MISSION_SIGNALS.test(artifact.mission.finalDisposition)
    ? 'ended'
    : 'unknown';
}

export function toLegacyChapter(chapter: SharedStoryChapter): LegacyChapter {
  return {
    id: chapter.id,
    key: CHAPTER_KEY_ORDER[chapter.number - 1] ?? 'why-sent',
    title: chapter.title,
    // Simplified wording is the readable text; the archive wording is the
    // "Go deeper" expansion behind the same claims.
    text: chapter.simplifiedWording,
    body: [chapter.simplifiedWording],
    deeper: chapter.originalWording,
    sourceIds: [...chapter.sourceIds],
  };
}

export function toLegacySource(source: SharedSource): LegacySource {
  return {
    id: source.id,
    organization: source.organization,
    title: source.title,
    url: source.url,
    supports: source.supportedClaims.join('; '),
    excerpt: source.originalWording,
    simplifiedExplanation: source.simplifiedExplanation,
    dateAccessed: source.accessedOn,
  };
}

export function toLegacyTimelineEvent(
  event: SharedTimelineEvent,
): LegacyTimelineEvent {
  return {
    id: event.id,
    title: event.title,
    date: event.date,
    dateEnd: null,
    description: event.description,
    // The category label is passed through raw; AfterlifeFeature humanizes
    // labels it does not know instead of dropping them.
    category: event.eventType,
    sourceIds: [...event.sourceIds],
  };
}

export function toLegacyDiscovery(discovery: SharedDiscovery): LegacyDiscovery {
  return {
    id: discovery.id,
    // The shared contract names the hardware; the legacy interface expects a
    // display title plus an instrument field.
    title: discovery.hardware,
    instrument: discovery.hardware,
    // The shared contract has no separate measurement field; leaving it empty
    // makes ScienceEvidenceFeature render its "not listed" fallback.
    measurement: '',
    observation: discovery.observation,
    scientificResult: discovery.scientificResult,
    simpleExplanation: discovery.simpleExplanation,
    technicalExplanation: discovery.detailedExplanation,
    sourceIds: [...discovery.sourceIds],
  };
}

export function toLegacyArtifact(artifact: SharedArtifact): LegacyArtifact {
  const coordinates = artifact.location.coordinates;
  return {
    id: artifact.id,
    name: artifact.name,
    body: artifact.body,
    mission: { name: artifact.missionName },
    missionName: artifact.missionName,
    artifactType: artifact.artifactType,
    summary: artifact.summary,
    image: artifact.image
      ? {
          url: artifact.image.url,
          alt: artifact.image.alt,
          credit: artifact.image.credit,
        }
      : undefined,
    status: deriveLegacyStatus(artifact),
    legacyStatus: {
      // The archived status language, kept verbatim in simplified form.
      operational: artifact.mission.simplifiedOperationalStatus,
      // The dataset records no separate communication status.
      physicalDisposition: artifact.mission.finalDisposition,
    },
    location: {
      label: artifact.location.label,
      confidence: artifact.location.confidence,
      description: artifact.location.explanation,
      note: artifact.location.explanation,
      coordinates: coordinates
        ? { lat: coordinates.latitude, lon: coordinates.longitude }
        : undefined,
      sourceIds: coordinates?.sourceId ? [coordinates.sourceId] : [],
    },
    chapters: [...artifact.story.chapters]
      .sort((a, b) => a.number - b.number)
      .map(toLegacyChapter),
    timeline: artifact.timeline.map(toLegacyTimelineEvent),
    discoveries: artifact.discoveries.map(toLegacyDiscovery),
    sources: artifact.sources.map(toLegacySource),
  };
}

/** Resolves a source id against the artifact's own source list. */
export function openSharedSource(
  artifact: SharedArtifact,
  sourceId: string,
  onOpenSource: (source: SharedSource) => void,
): void {
  const source = artifact.sources.find((candidate) => candidate.id === sourceId);
  if (source) onOpenSource(source);
}

/**
 * Atlas records are keyed by slug (the parent's selection key) and carry the
 * archived location text/coordinates, when the hydrated record provides them.
 */
export function toAtlasRecord(
  entry: CatalogEntry,
  location?: AtlasFeatureLocation,
): AtlasRecord {
  const coordinates = location?.coordinates;
  return {
    id: entry.slug,
    name: entry.name,
    body: entry.body === 'moon' ? 'Moon' : 'Mars',
    type: entry.artifactType,
    mission: { name: entry.missionName },
    description: entry.summary,
    nssdc: { recordId: entry.nssdcaRecordId, url: entry.nssdcaRecordUrl },
    aliases: [...entry.aliases],
    ...(location
      ? {
          location: {
            label: location.label,
            confidence: location.confidence,
            coordinates: coordinates
              ? { lat: coordinates.lat, lon: coordinates.lon }
              : undefined,
          },
        }
      : {}),
  };
}

/**
 * Builds the legacy quiz shape. Correct answers are never copied to the
 * client; evaluation goes through the provided evaluateAnswer callback.
 */
export function toLegacyQuiz(quiz: SharedQuiz): LegacyQuiz {
  return {
    artifactSlug: quiz.artifactSlug,
    artifactName: quiz.title.replace(/^Mission Debrief:\s*/i, ''),
    questions: quiz.questions.map((question) => ({
      id: question.id,
      question: question.prompt,
      options: question.options.map((option) => option.text),
      sourceIds: [...question.sourceIds],
    })),
  };
}

/** Index of the correct option within a shared quiz question. */
export function correctOptionIndexFor(
  question: SharedQuizQuestion,
  correctOptionId: string,
): number {
  const index = question.options.findIndex(
    (option) => option.id === correctOptionId,
  );
  return index >= 0 ? index : 0;
}
