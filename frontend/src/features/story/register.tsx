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

function MoonStorybookFeature({ artifact }: MoonStoriesFeatureProps) {
  return <StoryFeature artifact={toLegacyArtifact(artifact)} />;
}

function MarsStorybookFeature({ artifact }: MarsStoriesFeatureProps) {
  return <StoryFeature artifact={toLegacyArtifact(artifact)} />;
}

export default [
  defineFeature({ key: 'moonStories', component: MoonStorybookFeature }),
  defineFeature({ key: 'marsStories', component: MarsStorybookFeature }),
];
