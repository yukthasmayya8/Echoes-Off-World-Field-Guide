/**
 * Mounts the real registered teammate features (not the developer
 * placeholders) with the verified local dataset and confirms they render.
 * Also asserts that the registry discovers every registration.
 */
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import {
  AfterlifeSlot,
  AtlasSlot,
  discoverFeatures,
  getRegisteredFeatures,
  GuidedRouteSlot,
  MarsStoriesSlot,
  MissionDebriefSlot,
  MoonStoriesSlot,
  ScienceEvidenceSlot,
  unregisterFeature,
} from './FeatureRegistry';
import type { AtlasFeatureProps, FeatureKey } from './featureTypes';
import {
  getLocalArtifactBySlug,
  getLocalQuiz,
  getLocalRoutes,
  searchLocalCatalog,
} from '../../services/localFallback';

const eagle = getLocalArtifactBySlug('apollo-11-eagle');
if (!eagle) throw new Error('Fixture artifact missing');
const sojourner = getLocalArtifactBySlug('sojourner');
if (!sojourner) throw new Error('Fixture Mars artifact missing');

const quiz = getLocalQuiz('apollo-11-eagle');
if (!quiz) throw new Error('Fixture quiz missing');

const routes = getLocalRoutes();
const routeArtifacts = [
  getLocalArtifactBySlug('apollo-11-eagle'),
  getLocalArtifactBySlug('surveyor-3'),
  getLocalArtifactBySlug('mars-pathfinder-lander'),
  getLocalArtifactBySlug('sojourner'),
].filter((artifact): artifact is NonNullable<typeof artifact> => Boolean(artifact));

const noopSource = () => undefined;
const noopSelect = () => undefined;

/** Location index built the same way App.tsx builds it. */
const locations: NonNullable<AtlasFeatureProps['locations']> = {};
for (const slug of [
  'apollo-11-eagle',
  'surveyor-3',
  'mars-pathfinder-lander',
  'sojourner',
]) {
  const artifact = getLocalArtifactBySlug(slug);
  if (!artifact) continue;
  const coordinates = artifact.location.coordinates;
  locations[slug] = {
    label: artifact.location.label,
    confidence: artifact.location.confidence,
    ...(coordinates
      ? { coordinates: { lat: coordinates.latitude, lon: coordinates.longitude } }
      : {}),
  };
}

beforeAll(async () => {
  // Make discovery deterministic: clear anything the import-time
  // auto-discovery registered, then run it explicitly.
  for (const key of [
    'atlas',
    'moonStories',
    'marsStories',
    'afterlife',
    'scienceEvidence',
    'missionDebrief',
    'guidedRoute',
  ] satisfies FeatureKey[]) {
    unregisterFeature(key);
  }
  await discoverFeatures();
});

describe('registered teammate features', () => {
  it('discovers every registered feature across all seven keys', () => {
    expect([...getRegisteredFeatures()].sort()).toEqual(
      [
        'afterlife',
        'atlas',
        'guidedRoute',
        'marsStories',
        'missionDebrief',
        'moonStories',
        'scienceEvidence',
      ].sort(),
    );
  });

  it('mounts the real Atlas with map markers, list fallback and selection flow', () => {
    const onSelectArtifact = vi.fn();
    render(
      <AtlasSlot
        records={searchLocalCatalog('').results}
        selectedArtifactId={null}
        onSelectArtifact={onSelectArtifact}
        locations={locations}
      />,
    );

    expect(screen.getByRole('heading', { name: 'Archive Atlas' })).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Moon map' })).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Mars map' })).toBeTruthy();
    expect(document.body.textContent).not.toContain('Awaiting teammate UI');

    // The keyboard-accessible marker for the Eagle selects the artifact
    // through the parent-owned selection handler.
    const marker = screen.getByRole('button', { name: /Tranquility Base/ });
    fireEvent.click(marker);
    expect(onSelectArtifact).toHaveBeenCalledWith('apollo-11-eagle');

    // The text fallback also carries the archived location wording.
    expect(screen.getByText(/Southeast Oceanus Procellarum/)).toBeTruthy();
  });

  it('mounts the real Moon Storybook for a selected artifact', () => {
    render(<MoonStoriesSlot artifact={eagle} onOpenSource={noopSource} />);

    expect(screen.getByRole('heading', { name: eagle.name })).toBeTruthy();
    expect(screen.getByText('Chapter 1 of 5')).toBeTruthy();
    expect(document.body.textContent).not.toContain('Awaiting teammate UI');
  });

  it('mounts the real Mars Storybook for a selected artifact', () => {
    render(<MarsStoriesSlot artifact={sojourner} onOpenSource={noopSource} />);

    expect(screen.getByRole('heading', { name: sojourner.name })).toBeTruthy();
    expect(document.body.textContent).not.toContain('Awaiting teammate UI');
  });

  it('mounts the real Mission Timeline & Afterlife for a selected artifact', () => {
    render(
      <AfterlifeSlot
        artifact={eagle}
        onOpenSource={noopSource}
        onSelectChapter={noopSelect}
      />,
    );

    expect(screen.getByRole('heading', { name: /timeline and afterlife/i })).toBeTruthy();
    expect(screen.getByText(eagle.timeline[0].title)).toBeTruthy();
    expect(document.body.textContent).not.toContain('Awaiting teammate UI');
  });

  it('mounts the real Science-to-Discovery Reveal for a selected artifact', () => {
    render(<ScienceEvidenceSlot artifact={eagle} onOpenSource={noopSource} />);

    expect(screen.getByText(/Science behind/)).toBeTruthy();
    expect(screen.getAllByRole('tab')).toHaveLength(eagle.discoveries.length);
    expect(document.body.textContent).not.toContain('Awaiting teammate UI');
  });

  it('mounts the real Mission Debrief with server-evaluated answers', () => {
    render(
      <MissionDebriefSlot quiz={quiz} artifact={eagle} onOpenSource={noopSource} />,
    );

    expect(screen.getByText(/Mission debrief/)).toBeTruthy();
    expect(screen.getByText(quiz.questions[0].prompt)).toBeTruthy();
    expect(document.body.textContent).not.toContain('Awaiting teammate UI');
  });

  it('mounts the real Guided Story Route with steps, progress and module handoff', () => {
    const onSelectArtifact = vi.fn();
    const onOpenView = vi.fn();
    const route = routes[0];
    if (!route) throw new Error('Fixture route missing');

    render(
      <GuidedRouteSlot
        routes={routes}
        artifacts={routeArtifacts}
        onSelectArtifact={onSelectArtifact}
        onOpenView={onOpenView}
      />,
    );

    expect(screen.getByRole('heading', { name: 'Guided Story Routes' })).toBeTruthy();
    expect(screen.getAllByText(route.steps[0].title).length).toBeGreaterThan(0);
    expect(document.body.textContent).not.toContain('Awaiting teammate UI');

    fireEvent.click(screen.getByRole('button', { name: /Open storybook/i }));
    expect(onSelectArtifact).toHaveBeenCalledWith(route.steps[0].artifactSlug);
    expect(onOpenView).toHaveBeenCalledWith(route.steps[0].artifactSlug, 'story');

    // Opening a module from a stop records that stop as explored, so the
    // explicit completion control is now shown in its disabled, done state.
    const doneButton = screen.getByRole('button', { name: /Stop explored/i });
    expect((doneButton as HTMLButtonElement).disabled).toBe(true);
  });

  it('derives route progress from the parent passport so it survives navigation', () => {
    const route = routes[0];
    if (!route) throw new Error('Fixture route missing');
    const firstSlug = route.steps[0].artifactSlug;

    render(
      <GuidedRouteSlot
        routes={routes}
        artifacts={routeArtifacts}
        onSelectArtifact={vi.fn()}
        onOpenView={vi.fn()}
        exploredSlugs={[firstSlug]}
        onMarkExplored={vi.fn()}
      />,
    );

    expect(screen.getByText('50%')).toBeTruthy();
    expect(screen.getByRole('button', { name: /Stop explored/i })).toBeTruthy();
    expect(screen.getAllByText(route.steps[0].title).length).toBeGreaterThan(0);
  });
});
