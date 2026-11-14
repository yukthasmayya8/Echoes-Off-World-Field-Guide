import { afterEach, describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import {
  getLocalArtifactBySlug,
  getLocalQuiz,
  getLocalRoutes,
} from '../../services/localFallback';
import {
  AtlasSlot,
  MoonStoriesSlot,
  registerFeature,
  unregisterFeature,
} from './FeatureRegistry';
import type {
  AfterlifeFeatureProps,
  AtlasFeatureProps,
  GuidedRouteFeatureProps,
  MarsStoriesFeatureProps,
  MissionDebriefFeatureProps,
  MoonStoriesFeatureProps,
  ScienceEvidenceFeatureProps,
} from './featureTypes';

const artifact = getLocalArtifactBySlug('apollo-11-eagle');
if (!artifact) throw new Error('Fixture artifact missing');

const noopSource = () => undefined;
const noopSelect = () => undefined;

const atlasProps: AtlasFeatureProps = {
  records: [],
  selectedArtifactId: null,
  onSelectArtifact: noopSelect,
};

const moonProps: MoonStoriesFeatureProps = {
  artifact,
  onOpenSource: noopSource,
};

const marsArtifact = getLocalArtifactBySlug('sojourner');
if (!marsArtifact) throw new Error('Fixture Mars artifact missing');

const marsProps: MarsStoriesFeatureProps = {
  artifact: marsArtifact,
  onOpenSource: noopSource,
};

const afterlifeProps: AfterlifeFeatureProps = {
  artifact,
  onOpenSource: noopSource,
  onSelectChapter: () => undefined,
};

const scienceProps: ScienceEvidenceFeatureProps = {
  artifact,
  onOpenSource: noopSource,
};

const quiz = getLocalQuiz('apollo-11-eagle');
if (!quiz) throw new Error('Fixture quiz missing');

const debriefProps: MissionDebriefFeatureProps = {
  quiz,
  onOpenSource: noopSource,
};

const routeProps: GuidedRouteFeatureProps = {
  routes: getLocalRoutes(),
  artifacts: [artifact, marsArtifact],
  onSelectArtifact: noopSelect,
};

afterEach(() => {
  unregisterFeature('atlas');
});

describe('feature integration contracts', () => {
  it('accepts the exact props required by every feature contract', () => {
    // The declarations above are checked by `tsc`; these assertions verify the
    // shared data really satisfies the contracts at runtime too.
    expect(moonProps.artifact.body).toBe('moon');
    expect(marsProps.artifact.body).toBe('mars');
    expect(afterlifeProps.artifact.timeline.length).toBeGreaterThan(0);
    expect(scienceProps.artifact.discoveries.length).toBeGreaterThan(0);
    expect(debriefProps.quiz.questions[0]?.options.length).toBeGreaterThan(1);
    expect(routeProps.routes[0]?.steps.length).toBeGreaterThan(0);
    expect(routeProps.artifacts.map((entry) => entry.slug)).toContain('apollo-11-eagle');
  });

  it('renders a meaningful placeholder when no teammate component is registered', () => {
    const html = renderToStaticMarkup(<AtlasSlot {...atlasProps} />);

    expect(html).toContain('Awaiting teammate UI');
    expect(html).toContain('NSSDCA Archive Atlas');
    expect(html).toContain('Developer selection harness');
  });

  it('renders a storybook placeholder with the five wired chapters', () => {
    const html = renderToStaticMarkup(<MoonStoriesSlot {...moonProps} />);

    expect(html).toContain('Moon Artifact Storybook');
    expect(html).toContain('5 chapters');
    expect(html).toContain('Tranquility Base');
  });

  it('renders a registered teammate component with the same typed props', () => {
    registerFeature('atlas', ({ records, selectedArtifactId }) => (
      <div>
        Atlas {records.length} selected {selectedArtifactId ?? 'none'}
      </div>
    ));

    const html = renderToStaticMarkup(<AtlasSlot {...atlasProps} />);

    expect(html).toContain('Atlas 0 selected none');
    expect(html).not.toContain('Awaiting teammate UI');
  });
});
