/**
 * Typed integration contracts for the six product features.
 *
 * A teammate feature implements exactly one of these prop contracts. The
 * parent application owns selection, loading, errors and source navigation, so
 * feature components stay presentational and never call fetch themselves.
 */
import type { ComponentType } from 'react';
import type {
  Artifact,
  CatalogEntry,
  GuidedRoute,
  LocationConfidence,
  Quiz,
  Source,
  StoryChapter,
} from '@echoes/shared';

export type OpenSourceHandler = (source: Source) => void;
export type SelectArtifactHandler = (artifactSlug: string) => void;
export type SelectChapterHandler = (chapter: StoryChapter) => void;

/**
 * Archived location text for one artifact, keyed by slug. Coordinates are
 * copied verbatim from the verified record; the map never adds precision.
 */
export interface AtlasFeatureLocation {
  label: string;
  confidence?: LocationConfidence;
  coordinates?: { lat: number; lon: number };
}

/** 1. NSSDCA Archive Atlas. */
export interface AtlasFeatureProps {
  records: CatalogEntry[];
  /** Artifact slug, the canonical selection key owned by the parent. */
  selectedArtifactId: string | null;
  onSelectArtifact: SelectArtifactHandler;
  /** Location index built by the parent from hydrated artifact records. */
  locations?: Record<string, AtlasFeatureLocation>;
  /** Optional parent navigation from the selected-location panel. */
  onOpenView?: (artifactSlug: string, view: 'story' | 'timeline' | 'science' | 'evidence') => void;
}

/** 2. Moon Artifact Storybook. */
export interface MoonStoriesFeatureProps {
  artifact: Artifact;
  onOpenSource: OpenSourceHandler;
  /** Shared story chapters for cinematic narration. */
  narrationChapters?: StoryChapter[];
  /** Optional passport hook fired when the visitor reaches the story ending. */
  onComplete?: () => void;
}

/** 3. Mars Artifact Storybook. */
export interface MarsStoriesFeatureProps {
  artifact: Artifact;
  onOpenSource: OpenSourceHandler;
  /** Shared story chapters for cinematic narration. */
  narrationChapters?: StoryChapter[];
  /** Optional passport hook fired when the visitor reaches the story ending. */
  onComplete?: () => void;
}

/** 4. Mission Timeline & Afterlife. */
export interface AfterlifeFeatureProps {
  artifact: Artifact;
  onOpenSource: OpenSourceHandler;
  onSelectChapter: SelectChapterHandler;
}

/** 5. Science-to-Discovery Reveal and Evidence & Confidence Drawer. */
export interface ScienceEvidenceFeatureProps {
  artifact: Artifact;
  onOpenSource: OpenSourceHandler;
}

/** 6a. Mission Debrief. */
export interface MissionDebriefFeatureProps {
  quiz: Quiz;
  /**
   * The selected artifact. The registration adapter uses it to resolve quiz
   * source ids into full Source objects for the parent evidence drawer.
   */
  artifact: Artifact;
  onOpenSource: OpenSourceHandler;
}

/** 6b. Guided Story Route. */
export interface GuidedRouteFeatureProps {
  routes: GuidedRoute[];
  artifacts: Artifact[];
  onSelectArtifact: SelectArtifactHandler;
  /**
   * Optional parent-owned navigation. When supplied, the route can hand the
   * visitor straight to the storybook, timeline or evidence view for a step.
   */
  onOpenView?: (artifactSlug: string, view: 'story' | 'timeline' | 'science' | 'evidence') => void;
  /**
   * Artifact slugs the visitor has already explored, owned by the parent's
   * Discovery Passport. Route progress derives from this so it survives
   * navigation between views.
   */
  exploredSlugs?: string[];
  /** Optional parent-owned passport hook fired when a stop is marked explored. */
  onMarkExplored?: (artifactSlug: string) => void;
}

export interface FeaturePropsMap {
  atlas: AtlasFeatureProps;
  moonStories: MoonStoriesFeatureProps;
  marsStories: MarsStoriesFeatureProps;
  afterlife: AfterlifeFeatureProps;
  scienceEvidence: ScienceEvidenceFeatureProps;
  missionDebrief: MissionDebriefFeatureProps;
  guidedRoute: GuidedRouteFeatureProps;
}

export type FeatureKey = keyof FeaturePropsMap;

export type FeatureComponent<K extends FeatureKey> = ComponentType<FeaturePropsMap[K]>;

export interface FeatureRegistration<K extends FeatureKey = FeatureKey> {
  key: K;
  component: FeatureComponent<K>;
  /** Optional human-readable owner, shown only in developer placeholders. */
  owner?: string;
}

/**
 * Identity helper so a teammate registration module gets full type checking
 * without importing anything from the shared registry internals.
 */
export function defineFeature<K extends FeatureKey>(
  registration: FeatureRegistration<K>,
): FeatureRegistration<K> {
  return registration;
}
