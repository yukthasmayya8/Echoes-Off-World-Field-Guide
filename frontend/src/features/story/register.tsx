/**
 * Storybook feature registration.
 *
 * StoryFeature is a single component that serves both bodies, so this module
 * registers it under both the moonStories and marsStories keys via an array
 * default export (supported by the registry).
 */
import { StoryFeature } from './StoryFeature';
import { defineFeature } from '../integration/featureTypes';
import type {
  MarsStoriesFeatureProps,
  MoonStoriesFeatureProps,
} from '../integration/featureTypes';
import { toLegacyArtifact } from '../integration/legacyAdapters';

function MoonStorybookFeature({ artifact, narrationChapters }: MoonStoriesFeatureProps) {
  return (
    <StoryFeature
      artifact={toLegacyArtifact(artifact)}
      narrationChapters={narrationChapters ?? artifact.story.chapters}
    />
  );
}

function MarsStorybookFeature({ artifact, narrationChapters }: MarsStoriesFeatureProps) {
  return (
    <StoryFeature
      artifact={toLegacyArtifact(artifact)}
      narrationChapters={narrationChapters ?? artifact.story.chapters}
    />
  );
}

export default [
  defineFeature({ key: 'moonStories', component: MoonStorybookFeature }),
  defineFeature({ key: 'marsStories', component: MarsStorybookFeature }),
];
