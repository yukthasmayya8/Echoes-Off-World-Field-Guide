import type { ReactNode } from 'react';
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
import { useEchoesApp, type DestinationFilter } from './app/useEchoesApp';

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

  return (
    <div className="app-shell">
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
          />
        </Panel>

        {selectedArtifact ? (
          <>
            <Panel title={BODY_LABELS[selectedArtifact.body]}>
              {selectedArtifact.body === 'moon' ? (
                <MoonStoriesSlot
                  artifact={selectedArtifact}
                  onOpenSource={openSource}
                />
              ) : (
                <MarsStoriesSlot
                  artifact={selectedArtifact}
                  onOpenSource={openSource}
                />
              )}
            </Panel>

            <Panel title="4. Mission Timeline & Afterlife">
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
            </Panel>

            <Panel title="5. Science-to-Discovery Reveal + Evidence & Confidence">
              <ScienceEvidenceSlot artifact={selectedArtifact} onOpenSource={openSource} />
            </Panel>

            <Panel title="6a. Mission Debrief">
              {quiz ? (
                <MissionDebriefSlot quiz={quiz} onOpenSource={openSource} />
              ) : (
                <p className="muted">
                  No verified debrief is available for this artifact yet.
                </p>
              )}
            </Panel>
          </>
        ) : (
          <Panel title="Artifact story">
            <p className="muted">
              Select a verified record in the Atlas placeholder to load the same artifact
              into the Moon or Mars storybook, timeline, science evidence and debrief.
            </p>
          </Panel>
        )}

        <Panel title="6b. Guided Story Route">
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
          dates. Feature panels are typed integration placeholders until teammate interfaces
          register themselves.
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
