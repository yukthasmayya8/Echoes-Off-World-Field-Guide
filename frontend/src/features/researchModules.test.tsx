/**
 * Tests for the research and learning modules added to Mission Control.
 * Every fixture comes from the same verified local dataset the app serves.
 */
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { getLocalArtifactBySlug } from '../services/localFallback';
import type { PassportState } from '../app/progress';
import { FactVault } from './fact-vault/FactVault';
import { UnknownsObservatory } from './unknowns/UnknownsObservatory';
import { LegacyBridge } from './legacy-bridge/LegacyBridge';
import { SpaceHeritage } from './space-heritage/SpaceHeritage';
import { CompareArtifacts } from './compare/CompareArtifacts';
import { ExploreDeeper } from './explore-deeper/ExploreDeeper';
import { DiscoveryPassport } from './discovery-passport/DiscoveryPassport';
import { TeacherMode } from './teacher-mode/TeacherMode';
import { SearchResults } from './search/SearchResults';
import { NasaResources } from './nasa-resources/NasaResources';

const eagle = getLocalArtifactBySlug('apollo-11-eagle');
if (!eagle) throw new Error('Fixture artifact missing');
const sojourner = getLocalArtifactBySlug('sojourner');
if (!sojourner) throw new Error('Fixture Mars artifact missing');

const artifacts = [eagle, sojourner];
const noop = () => undefined;

const emptyPassport: PassportState = {
  explored: [],
  stories: [],
  evidence: [],
  investigations: [],
  saved: [],
  lastSlug: null,
  updatedAt: null,
};

describe('Fact Vault', () => {
  it('lists sourced facts and filters them by query', () => {
    const onOpenSource = vi.fn();
    render(<FactVault artifacts={artifacts} onOpenSource={onOpenSource} />);

    expect(screen.getByRole('heading', { name: 'Fact Vault' })).toBeTruthy();
    expect(screen.getByText(/sourced facts in view/i)).toBeTruthy();

    fireEvent.change(screen.getByRole('searchbox', { name: /search facts/i }), {
      target: { value: 'seismometer' },
    });
    expect(screen.getByText(/seismometer/i)).toBeTruthy();

    fireEvent.change(screen.getByRole('searchbox', { name: /search facts/i }), {
      target: { value: 'zzzz-not-a-fact' },
    });
    expect(screen.getByText(/No facts match those filters/i)).toBeTruthy();
  });
});

describe('Unknowns Observatory', () => {
  it('separates documented uncertainty from dataset gaps', () => {
    render(<UnknownsObservatory artifacts={artifacts} onOpenSource={noop} />);

    expect(screen.getByRole('heading', { name: 'Unknowns Observatory' })).toBeTruthy();
    expect(screen.getAllByText('Dataset gap').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Documented uncertainty').length).toBeGreaterThan(0);
    expect(screen.getByText(/Why this distinction matters/i)).toBeTruthy();
  });
});

describe('Legacy Bridge', () => {
  it('labels documented relationships and thematic comparisons differently', () => {
    render(
      <LegacyBridge
        artifacts={artifacts}
        onOpenSource={noop}
        onSelectArtifact={noop}
      />,
    );

    expect(screen.getByRole('heading', { name: 'Legacy Bridge' })).toBeTruthy();
    expect(screen.getAllByText('Documented').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Thematic comparison').length).toBeGreaterThan(0);
    expect(screen.getByText(/No causal overreach/i)).toBeTruthy();
  });
});

describe('Space Heritage', () => {
  it('runs the decision activity and marks the defensible option', () => {
    render(<SpaceHeritage />);

    fireEvent.click(
      screen.getByRole('button', {
        name: /Land outside a documented exclusion zone/i,
      }),
    );

    expect(screen.getByText('Most defensible')).toBeTruthy();
    expect(screen.getByText(/official preservation body/i)).toBeTruthy();
  });
});

describe('Compare Artifacts', () => {
  it('renders both selected records field by field', () => {
    render(<CompareArtifacts artifacts={artifacts} onSelectArtifact={noop} />);

    expect(screen.getByRole('heading', { name: 'Compare Artifacts' })).toBeTruthy();
    expect(screen.getByRole('table')).toBeTruthy();
    expect(screen.getAllByText(eagle.name).length).toBeGreaterThan(0);
    expect(screen.getAllByText(sojourner.name).length).toBeGreaterThan(0);
    expect(screen.getByText('Final disposition')).toBeTruthy();
  });
});

describe('Explore Deeper', () => {
  it('retrieves record passages and refuses to invent an answer', () => {
    render(
      <ExploreDeeper
        artifact={eagle}
        artifacts={artifacts}
        onOpenSource={noop}
        onSelectArtifact={noop}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Why was it sent?' }));
    expect(screen.getByText(/What the reviewed record says/i)).toBeTruthy();

    fireEvent.change(screen.getByRole('searchbox', { name: /your question/i }), {
      target: { value: 'purple monkey dishwasher' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Search the record/i }));
    expect(screen.getByText(/does not contain an answer/i)).toBeTruthy();
  });
});

describe('Discovery Passport', () => {
  it('summarises local progress and awards the first badge', () => {
    const passport: PassportState = {
      ...emptyPassport,
      explored: [eagle.slug],
      stories: [eagle.slug],
      lastSlug: eagle.slug,
      updatedAt: '2026-11-14T00:00:00.000Z',
    };

    render(
      <DiscoveryPassport
        artifacts={artifacts}
        passport={passport}
        onSelectArtifact={noop}
        onNavigate={noop}
      />,
    );

    expect(screen.getByRole('heading', { name: 'Discovery Passport' })).toBeTruthy();
    expect(screen.getAllByText(eagle.name).length).toBeGreaterThan(0);
    expect(screen.getByText('First Discovery')).toBeTruthy();
    expect(screen.getAllByText('Earned').length).toBeGreaterThan(0);
    expect(screen.getByText(/No account, name or email/i)).toBeTruthy();
  });
});

describe('Teacher Mode', () => {
  it('builds a printable lesson from the selected record', () => {
    const onNavigate = vi.fn();
    render(
      <TeacherMode
        artifact={eagle}
        artifacts={artifacts}
        onSelectArtifact={noop}
        onNavigate={onNavigate}
      />,
    );

    expect(screen.getByRole('heading', { name: 'Teacher Mode' })).toBeTruthy();
    expect(screen.getByText('Learning objectives')).toBeTruthy();
    expect(screen.getByText(/reading a mission record/i)).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: /Open investigation/i }));
    expect(onNavigate).toHaveBeenCalledWith('archaeologist');
  });
});

describe('Global Search', () => {
  it('finds hardware across records and hands off to a module', () => {
    const onOpenView = vi.fn();
    render(
      <SearchResults
        query="seismometer"
        artifacts={artifacts}
        onOpenView={onOpenView}
        onSelectArtifact={noop}
      />,
    );

    expect(screen.getByText(/Results for/i)).toBeTruthy();
    expect(screen.getAllByText(/seismometer/i).length).toBeGreaterThan(0);

    fireEvent.click(screen.getAllByRole('button', { name: 'Storybook' })[0]);
    expect(onOpenView).toHaveBeenCalledWith(eagle.slug, 'story');
  });
});

describe('NASA Resources', () => {
  it('separates ingested, cited and linked provenance', () => {
    render(<NasaResources />);

    expect(screen.getByRole('heading', { name: 'NASA Resources' })).toBeTruthy();
    expect(screen.getAllByText('Ingested dataset').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Cited by ingested records').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Linked for further exploration').length).toBeGreaterThan(0);
    expect(screen.getByText(/No live NASA API at runtime/i)).toBeTruthy();
    expect(screen.getByText(/could not be retrieved/i)).toBeTruthy();
  });
});
