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
  Quiz,
  Source,
  StoryChapter,
} from '@echoes/shared';

export type OpenSourceHandler = (source: Source) => void;
export type SelectArtifactHandler = (artifactSlug: string) => void;
export type SelectChapterHandler = (chapter: StoryChapter) => void;

/** 1. NSSDCA Archive Atlas. */
export interface AtlasFeatureProps {
  records: CatalogEntry[];
  /** Artifact slug, the canonical selection key owned by the parent. */
  selectedArtifactId: string | null;
  onSelectArtifact: SelectArtifactHandler;
}

/** 2. Moon Artifact Storybook. */
export interface MoonStoriesFeatureProps {
  artifact: Artifact;
  onOpenSource: OpenSourceHandler;
}

/** 3. Mars Artifact Storybook. */
export interface MarsStoriesFeatureProps {
  artifact: Artifact;
  onOpenSource: OpenSourceHandler;
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
  onOpenSource: OpenSourceHandler;
}

/** 6b. Guided Story Route. */
export interface GuidedRouteFeatureProps {
  routes: GuidedRoute[];
  artifacts: Artifact[];
  onSelectArtifact: SelectArtifactHandler;
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
