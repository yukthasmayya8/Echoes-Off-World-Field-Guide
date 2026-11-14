import { useCallback, useEffect, useMemo, type ReactNode, useState } from 'react';
import { DEMO_MODE_LABEL, type Body } from '@echoes/shared';
import {
  AfterlifeSlot,
  AtlasSlot,
  GuidedRouteSlot,
  MarsStoriesSlot,
  MissionDebriefSlot,
  MoonStoriesSlot,
  ScienceEvidenceSlot,
} from './features/integration/FeatureRegistry';
import type { AtlasFeatureLocation } from './features/integration/featureTypes';
import {
  type ThemeId,
  DEFAULT_THEME,
  loadThemeFromStorage,
  saveThemeToStorage,
  getTheme,
  getAllThemes,
} from './app/theme';
import { useEchoesApp, type DestinationFilter } from './app/useEchoesApp';
import { EvidenceDetective } from './features/evidence-detective/EvidenceDetective';
import { TimeMachine } from './features/time-machine/TimeMachine';
import { ArtifactDna } from './features/artifact-dna/ArtifactDna';
import { SpaceArchaeologist } from './features/space-archaeologist/SpaceArchaeologist';

const DESTINATIONS: Array<{ value: DestinationFilter; label: string }> = [
  { value: 'all', label: 'All destinations' },
  { value: 'moon', label: 'Moon' },
  { value: 'mars', label: 'Mars' },
];

const BODY_LABELS: Record<Body, string> = {
  moon: 'Moon Artifact Storybook',
  mars: 'Mars Artifact Storybook',
};

function Panel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="panel">
      <h2 className="panel__title">{title}</h2>
      {children}
    </section>
  );
}

function FeatureCard({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="feature-card">
      <h3 className="feature-card__title">{title}</h3>
      <div className="feature-card__body">{children}</div>
    </section>
  );
}

export default function App() {
  const {
    records,
    routes,
    visibleRoutes,
    artifacts,
    selectedArtifact,
    selectedSlug,
    selectedDestination,
    selectedRouteSlug,
    quiz,
    loading,
    detailLoading,
    error,
    sourceMode,
    demoNotice,
    activeSource,
    activeChapter,
    query,
    setQuery,
    submitSearch,
    clearSearch,
    selectDestination,
    selectRoute,
    selectArtifact,
    openSource,
    closeSource,
    selectChapter,
    retry,
  } = useEchoesApp();

  /* ---------------------------------------------------------------- Theme */
  const [themeId, setThemeId] = useState<ThemeId>(DEFAULT_THEME);

  useEffect(() => {
    const stored = loadThemeFromStorage();
    setThemeId(stored);
    document.documentElement.setAttribute('data-theme', stored);
  }, []);

  const theme = getTheme(themeId);

  const handleThemeChange = useCallback((next: ThemeId) => {
    setThemeId(next);
    document.documentElement.setAttribute('data-theme', next);
    saveThemeToStorage(next);
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', themeId);
  }, [themeId]);
  const artifactLocations = useMemo(() => {
    const index: Record<string, AtlasFeatureLocation> = {};
    for (const artifact of artifacts) {
      const coordinates = artifact.location.coordinates;
      index[artifact.slug] = {
        label: artifact.location.label,
        confidence: artifact.location.confidence,
        ...(coordinates
          ? {
              coordinates: {
                lat: coordinates.latitude,
                lon: coordinates.longitude,
              },
            }
          : {}),
      };
    }
    return index;
  }, [artifacts]);

  return (
    <div className="app-shell" data-theme={themeId}>
      <header className="hero">
        <div>
          <p className="hero__eyebrow">NASA Space Apps Challenge 2026</p>
          <h1>Echoes — Off-World Field Guide</h1>
          <p className="hero__subtitle">
            Abandoned but not forgotten: the machines NASA left on the Moon and Mars.
          </p>
        </div>
        <div className="hero__status">
          <span className={`badge ${sourceMode === 'demo' ? 'badge--demo' : 'badge--live'}`}>
            {sourceMode === 'demo' ? DEMO_MODE_LABEL : 'LIVE API'}
          </span>
          <span className="badge">{artifacts.length} records hydrated</span>
        </div>
        <div className="hero__stats" aria-label="Archive overview">
          <span className="stat">
            <span className="stat__value">{artifacts.length}</span>
            <span className="stat__label">verified records</span>
          </span>
          <span className="stat__sep" aria-hidden="true">·</span>
          <span className="stat">
            <span className="stat__value">{artifacts.filter((a) => a.body === 'moon').length}</span>
            <span className="stat__label">Moon</span>
          </span>
          <span className="stat__sep" aria-hidden="true">·</span>
          <span className="stat">
            <span className="stat__value">{artifacts.filter((a) => a.body === 'mars').length}</span>
            <span className="stat__label">Mars</span>
          </span>
          <span className="stat__sep" aria-hidden="true">·</span>
          <span className="stat">
            <span className="stat__value">{routes.length}</span>
            <span className="stat__label">curated routes</span>
          </span>
        </div>
        <button
          type="button"
          className="theme-selector"
          onClick={() => {
            const themes: ThemeId[] = [
              'lunar-night',
              'martian-dawn',
              'space-observatory',
              'mission-control',
            ];
            const currentIndex = themes.indexOf(themeId);
            handleThemeChange(themes[(currentIndex + 1) % themes.length]);
          }}
        >
          <span className="theme-dot" aria-hidden="true" />
          {theme.name}
        </button>
      </header>

      {sourceMode === 'demo' ? (
        <div className="demo-banner" role="status">
          <strong>{DEMO_MODE_LABEL}</strong>
          <span>
            {demoNotice ??
              'The live API is unavailable. Showing the verified local JSON dataset only.'}
          </span>
          <button type="button" className="button button--small" onClick={retry}>
            Retry live API
          </button>
        </div>
      ) : null}

      {error ? (
        <div className="error-banner" role="alert">
          <strong>Could not load data.</strong>
          <span>{error}</span>
          <button type="button" className="button button--small" onClick={retry}>
            Retry
          </button>
        </div>
      ) : null}

      <section className="controls" aria-label="Catalog filters">
        <form
          className="search"
          onSubmit={(event) => {
            event.preventDefault();
            submitSearch();
          }}
        >
          <label htmlFor="catalog-search">Search the archive</label>
          <div className="search__row">
            <input
              id="catalog-search"
              type="search"
              value={query}
              placeholder="Name, alias, mission or NSSDCA ID"
              onChange={(event) => setQuery(event.target.value)}
            />
            <button type="submit" className="button">
              Search
            </button>
            <button type="button" className="button button--ghost" onClick={clearSearch}>
              Clear
            </button>
          </div>
        </form>

        <div className="destination-toggle" role="group" aria-label="Destination">
          {DESTINATIONS.map((destination) => (
            <button
              key={destination.value}
              type="button"
              className={
                selectedDestination === destination.value
                  ? 'button button--active'
                  : 'button button--ghost'
              }
              aria-pressed={selectedDestination === destination.value}
              onClick={() => selectDestination(destination.value)}
            >
              {destination.label}
            </button>
          ))}
        </div>

        <label className="route-picker">
          Guided route
          <select
            value={selectedRouteSlug ?? ''}
            onChange={(event) => selectRoute(event.target.value || null)}
          >
            <option value="">All curated routes</option>
            {routes.map((route) => (
              <option key={route.id} value={route.slug}>
                {route.title}
              </option>
            ))}
          </select>
        </label>
      </section>

      <p className="status-line" aria-live="polite">
        {loading
          ? 'Loading verified records…'
          : `${records.length} verified record${records.length === 1 ? '' : 's'} in view`}
        {selectedArtifact ? ` · Selected: ${selectedArtifact.name}` : ' · No artifact selected'}
        {detailLoading ? ' · Loading details…' : ''}
      </p>

      <main className="layout">
        <Panel title="1. NSSDCA Archive Atlas">
          <AtlasSlot
            records={records}
            selectedArtifactId={selectedSlug}
            onSelectArtifact={selectArtifact}
            locations={artifactLocations}
          />
        </Panel>

        {selectedArtifact ? (
          <>
            <div className="feature-grid">
              <FeatureCard title={BODY_LABELS[selectedArtifact.body]}>
                {selectedArtifact.body === 'moon' ? (
                  <MoonStoriesSlot
                    artifact={selectedArtifact}
                    onOpenSource={openSource}
                    narrationChapters={selectedArtifact.story.chapters}
                  />
                ) : (
                  <MarsStoriesSlot
                    artifact={selectedArtifact}
                    onOpenSource={openSource}
                    narrationChapters={selectedArtifact.story.chapters}
                  />
                )}
              </FeatureCard>

              <FeatureCard title="Mission Timeline & Afterlife">
                <AfterlifeSlot
                  artifact={selectedArtifact}
                  onOpenSource={openSource}
                  onSelectChapter={selectChapter}
                />
                {activeChapter ? (
                  <p className="status-line">
                    Chapter focus: {activeChapter.number}. {activeChapter.title}
                  </p>
                ) : null}
              </FeatureCard>

              <FeatureCard title="Science Evidence & Discovery">
                <ScienceEvidenceSlot
                  artifact={selectedArtifact}
                  onOpenSource={openSource}
                />
              </FeatureCard>

              <FeatureCard title="Mission Debrief">
                {quiz ? (
                  <MissionDebriefSlot
                    quiz={quiz}
                    artifact={selectedArtifact}
                    onOpenSource={openSource}
                  />
                ) : (
                  <p className="muted">
                    No verified debrief is available for this artifact yet.
                  </p>
                )}
              </FeatureCard>

              <FeatureCard title="Time Machine — Mission History">
                <TimeMachine artifact={selectedArtifact} sources={selectedArtifact.sources} />
              </FeatureCard>

              <FeatureCard title="Artifact DNA — Hardware">
                <ArtifactDna artifact={selectedArtifact} sources={selectedArtifact.sources} />
              </FeatureCard>

              <FeatureCard title="Evidence Detective">
                <EvidenceDetective artifact={selectedArtifact} sources={selectedArtifact.sources} />
              </FeatureCard>

              <FeatureCard title="Digital Space Archaeologist">
                <SpaceArchaeologist artifact={selectedArtifact} sources={selectedArtifact.sources} />
              </FeatureCard>
            </div>
          </>
        ) : (
          <Panel title="Artifact story">
            <div className="empty-state">
              <span className="empty-state__icon" aria-hidden="true">
                🌙
              </span>
              <h3 className="empty-state__title">Choose a verified record</h3>
              <p className="empty-state__body">
                Select an artifact in the Atlas to unlock its narrated
                storybook, mission timeline, hardware DNA, evidence detective,
                time machine, and space archaeologist investigation.
              </p>
              <p className="muted empty-state__note">
                Only verified records appear by default. Records under editorial
                review are held out until a second editor signs off.
              </p>
            </div>
          </Panel>
        )}

        <Panel title="Guided Story Route">
          <GuidedRouteSlot
            routes={visibleRoutes}
            artifacts={artifacts}
            onSelectArtifact={selectArtifact}
          />
        </Panel>
      </main>

      <footer className="footer">
        <p>
          Only <strong>verified</strong> records appear by default. NSSDCA archive wording is
          preserved alongside simplified wording, with claim-level sources and source-check
          dates. Feature panels register themselves through the typed feature registry; the
          guided route panel remains a typed placeholder until its owner ships.
        </p>
        <p className="muted">
          Archive data courtesy of NASA NSSDCA Master Catalog. All records were
          source-checked on 2026-11-14 and are reproduced with simplified wording
          alongside the original archive text.
        </p>
      </footer>

      {activeSource ? (
        <aside className="source-drawer" aria-label="Source evidence">
          <div className="source-drawer__header">
            <span className="badge">Evidence</span>
            <button type="button" className="button button--ghost button--small" onClick={closeSource}>
              Close
            </button>
          </div>
          <h2>{activeSource.title}</h2>
          <p className="muted">{activeSource.organization}</p>
          <a className="source-link" href={activeSource.url} target="_blank" rel="noreferrer">
            Open source record
          </a>
          <h3>Supported claims</h3>
          <ul>
            {activeSource.supportedClaims.map((claim) => (
              <li key={claim}>{claim}</li>
            ))}
          </ul>
          <h3>Original archive wording</h3>
          <blockquote>{activeSource.originalWording}</blockquote>
          <h3>Simplified explanation</h3>
          <p>{activeSource.simplifiedExplanation}</p>
          <p className="muted">Source checked: {activeSource.accessedOn}</p>
        </aside>
      ) : null}
    </div>
  );
}
