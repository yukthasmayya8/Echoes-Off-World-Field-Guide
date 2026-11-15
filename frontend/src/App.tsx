import { useCallback, useEffect, useMemo, useState } from 'react';
import { ARCHIVE_DATA_LABEL, type Artifact, type Body } from '@echoes/shared';
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
import { NAV_GROUPS, VIEW_TITLES, type ViewId } from './app/navigation';
import {
  markEvidenceComplete,
  markExplored,
  markInvestigationComplete,
  markStoryComplete,
  toggleSaved,
  usePassport,
} from './app/progress';
import { Dashboard } from './features/dashboard/Dashboard';
import { EvidenceDetective } from './features/evidence-detective/EvidenceDetective';
import { TimeMachine } from './features/time-machine/TimeMachine';
import { ArtifactDna } from './features/artifact-dna/ArtifactDna';
import { SpaceArchaeologist } from './features/space-archaeologist/SpaceArchaeologist';
import { FactVault } from './features/fact-vault/FactVault';
import { UnknownsObservatory } from './features/unknowns/UnknownsObservatory';
import { LegacyBridge } from './features/legacy-bridge/LegacyBridge';
import { SpaceHeritage } from './features/space-heritage/SpaceHeritage';
import { CompareArtifacts } from './features/compare/CompareArtifacts';
import { NasaResources } from './features/nasa-resources/NasaResources';
import { ExploreDeeper } from './features/explore-deeper/ExploreDeeper';
import { DiscoveryPassport } from './features/discovery-passport/DiscoveryPassport';
import { TeacherMode } from './features/teacher-mode/TeacherMode';
import { SearchResults } from './features/search/SearchResults';

const DESTINATIONS: Array<{ value: DestinationFilter; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'moon', label: 'Moon' },
  { value: 'mars', label: 'Mars' },
];

const VIEW_EYEBROWS: Record<ViewId, string> = {
  home: 'NASA SPACE APPS CHALLENGE 2026',
  atlas: 'PLANETARY ARCHIVE',
  story: 'CINEMATIC STORYBOOK',
  timeline: 'MISSION CHRONOLOGY',
  science: 'HARDWARE TO DISCOVERY',
  evidence: 'TEST A CLAIM',
  dna: 'HARDWARE EXPLORER',
  archaeologist: 'GUIDED INVESTIGATION',
  routes: 'CURATED JOURNEYS',
  facts: 'SOURCED KNOWLEDGE',
  unknowns: 'EVIDENCE BOUNDARIES',
  deeper: 'SOURCE-GROUNDED ANSWERS',
  compare: 'SIDE BY SIDE',
  legacy: 'THEN TO NOW',
  heritage: 'WHY SITES MATTER',
  resources: 'DATA PROVENANCE',
  passport: 'YOUR LEARNING JOURNEY',
  teacher: 'CLASSROOM KIT',
  search: 'GLOBAL SEARCH',
};

type OpenViewTarget = 'story' | 'timeline' | 'science' | 'evidence';

function ArtifactRequired({
  artifacts,
  title,
  message,
  onSelect,
}: {
  artifacts: Artifact[];
  title: string;
  message: string;
  onSelect: (slug: string) => void;
}) {
  return (
    <section className="empty-state empty-state--module" aria-label={title}>
      <span className="empty-state__icon" aria-hidden="true">
        ☾
      </span>
      <h2 className="empty-state__title">{title}</h2>
      <p className="empty-state__body">{message}</p>
      {artifacts.length > 0 ? (
        <div className="artifact-quick-list">
          {artifacts.map((artifact) => (
            <button
              key={artifact.slug}
              type="button"
              className="artifact-quick"
              onClick={() => onSelect(artifact.slug)}
            >
              <span aria-hidden="true">{artifact.body === 'moon' ? '☾' : '♂'}</span>
              <span>
                <strong>{artifact.name}</strong>
                <small>{artifact.missionName}</small>
              </span>
            </button>
          ))}
        </div>
      ) : (
        <p className="muted">Verified records are still loading.</p>
      )}
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
    selectDestination,
    selectRoute,
    selectArtifact,
    openSource,
    closeSource,
    selectChapter,
    retry,
  } = useEchoesApp();

  const passport = usePassport();
  const [view, setView] = useState<ViewId>('home');
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

  const navigate = useCallback(
    (next: ViewId) => {
      setView(next);
      closeSource();
      try {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } catch {
        /* jsdom and older browsers may not implement smooth scrolling */
      }
    },
    [closeSource],
  );

  const handleSelectArtifact = useCallback(
    (slug: string) => {
      markExplored(slug);
      void selectArtifact(slug);
    },
    [selectArtifact],
  );

  const handleOpenView = useCallback(
    (slug: string, target: OpenViewTarget) => {
      handleSelectArtifact(slug);
      navigate(target);
    },
    [handleSelectArtifact, navigate],
  );

  const exploreBody = useCallback(
    (body: Body) => {
      selectDestination(body);
      navigate('atlas');
    },
    [navigate, selectDestination],
  );

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

  const storyComplete = useCallback(() => {
    if (selectedArtifact) markStoryComplete(selectedArtifact.slug);
  }, [selectedArtifact]);

  const evidenceComplete = useCallback(() => {
    if (selectedArtifact) markEvidenceComplete(selectedArtifact.slug);
  }, [selectedArtifact]);

  const investigationComplete = useCallback(() => {
    if (selectedArtifact) markInvestigationComplete(selectedArtifact.slug);
  }, [selectedArtifact]);

  const saved = selectedArtifact ? passport.saved.includes(selectedArtifact.slug) : false;

  const renderView = () => {
    switch (view) {
      case 'home':
        return (
          <Dashboard
            artifacts={artifacts}
            records={records}
            routes={routes}
            passport={passport}
            onNavigate={navigate}
            onExplore={exploreBody}
            onSelectArtifact={(slug) => {
              handleSelectArtifact(slug);
              navigate('story');
            }}
          />
        );

      case 'atlas':
        return (
          <AtlasSlot
            records={records}
            selectedArtifactId={selectedSlug}
            onSelectArtifact={handleSelectArtifact}
            locations={artifactLocations}
            onOpenView={handleOpenView}
          />
        );

      case 'story':
        if (!selectedArtifact) {
          return (
            <ArtifactRequired
              artifacts={artifacts}
              title="Choose an artifact to open its storybook"
              message="Every storybook is built from one verified artifact record. Pick a record to begin, or open the Atlas to explore landing sites."
              onSelect={handleSelectArtifact}
            />
          );
        }
        return selectedArtifact.body === 'moon' ? (
          <MoonStoriesSlot
            artifact={selectedArtifact}
            onOpenSource={openSource}
            narrationChapters={selectedArtifact.story.chapters}
            onComplete={storyComplete}
          />
        ) : (
          <MarsStoriesSlot
            artifact={selectedArtifact}
            onOpenSource={openSource}
            narrationChapters={selectedArtifact.story.chapters}
            onComplete={storyComplete}
          />
        );

      case 'timeline':
        if (!selectedArtifact) {
          return (
            <ArtifactRequired
              artifacts={artifacts}
              title="Choose an artifact to travel through time"
              message="The Time Machine walks the documented mission chronology event by event."
              onSelect={handleSelectArtifact}
            />
          );
        }
        return (
          <div className="view-stack">
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
            <section className="panel-card" aria-label="Time Machine chronology explorer">
              <TimeMachine
                artifact={selectedArtifact}
                sources={selectedArtifact.sources}
              />
            </section>
          </div>
        );

      case 'science':
        if (!selectedArtifact) {
          return (
            <ArtifactRequired
              artifacts={artifacts}
              title="Choose an artifact to reveal its science"
              message="The Science Reveal follows documented hardware to measurement to scientific result."
              onSelect={handleSelectArtifact}
            />
          );
        }
        return (
          <div className="view-stack">
            <ScienceEvidenceSlot
              artifact={selectedArtifact}
              onOpenSource={openSource}
            />
            {quiz ? (
              <section className="panel-card" aria-label="Mission debrief">
                <MissionDebriefSlot
                  quiz={quiz}
                  artifact={selectedArtifact}
                  onOpenSource={openSource}
                />
              </section>
            ) : (
              <div className="empty-card">
                <strong>No verified debrief is available for this artifact yet.</strong>
                <p>The quiz is only shown when a reviewed question set exists.</p>
              </div>
            )}
          </div>
        );

      case 'evidence':
        if (!selectedArtifact) {
          return (
            <ArtifactRequired
              artifacts={artifacts}
              title="Choose an artifact to test a claim"
              message="Evidence Detective asks you to judge claims against the archive: confirmed, partial, unproven or contradicted."
              onSelect={handleSelectArtifact}
            />
          );
        }
        return (
          <EvidenceDetective
            artifact={selectedArtifact}
            sources={selectedArtifact.sources}
            onComplete={evidenceComplete}
          />
        );

      case 'dna':
        if (!selectedArtifact) {
          return (
            <ArtifactRequired
              artifacts={artifacts}
              title="Choose an artifact to inspect its hardware"
              message="Artifact DNA opens the documented hardware, what it observed and what result it produced."
              onSelect={handleSelectArtifact}
            />
          );
        }
        return (
          <ArtifactDna
            artifact={selectedArtifact}
            sources={selectedArtifact.sources}
          />
        );

      case 'archaeologist':
        if (!selectedArtifact) {
          return (
            <ArtifactRequired
              artifacts={artifacts}
              title="Choose an artifact to investigate"
              message="The Digital Space Archaeologist runs a seven-step investigation of one verified record."
              onSelect={handleSelectArtifact}
            />
          );
        }
        return (
          <SpaceArchaeologist
            artifact={selectedArtifact}
            sources={selectedArtifact.sources}
            onComplete={investigationComplete}
          />
        );

      case 'routes':
        return (
          <GuidedRouteSlot
            routes={visibleRoutes}
            artifacts={artifacts}
            onSelectArtifact={handleSelectArtifact}
            onOpenView={handleOpenView}
            exploredSlugs={passport.explored}
            onMarkExplored={markExplored}
          />
        );

      case 'facts':
        return <FactVault artifacts={artifacts} onOpenSource={openSource} />;

      case 'unknowns':
        return <UnknownsObservatory artifacts={artifacts} onOpenSource={openSource} />;

      case 'deeper':
        return (
          <ExploreDeeper
            artifact={selectedArtifact}
            artifacts={artifacts}
            onOpenSource={openSource}
            onSelectArtifact={handleSelectArtifact}
          />
        );

      case 'compare':
        return (
          <CompareArtifacts
            artifacts={artifacts}
            onSelectArtifact={handleSelectArtifact}
          />
        );

      case 'legacy':
        return (
          <LegacyBridge
            artifacts={artifacts}
            onOpenSource={openSource}
            onSelectArtifact={handleSelectArtifact}
          />
        );

      case 'heritage':
        return <SpaceHeritage />;

      case 'resources':
        return <NasaResources />;

      case 'passport':
        return (
          <DiscoveryPassport
            artifacts={artifacts}
            passport={passport}
            onSelectArtifact={handleSelectArtifact}
            onNavigate={navigate}
          />
        );

      case 'teacher':
        return (
          <TeacherMode
            artifact={selectedArtifact}
            artifacts={artifacts}
            onSelectArtifact={handleSelectArtifact}
            onNavigate={navigate}
          />
        );

      case 'search':
        return (
          <SearchResults
            query={query}
            artifacts={artifacts}
            onOpenView={handleOpenView}
            onSelectArtifact={handleSelectArtifact}
          />
        );

      default:
        return null;
    }
  };

  return (
    <div className="mission-app" data-theme={themeId}>
      <a className="skip-link" href="#view-content">
        Skip to content
      </a>

      <aside className="sidebar" aria-label="Mission Control navigation">
        <div className="brand">
          <span className="brand__mark" aria-hidden="true">
            ✦
          </span>
          <div>
            <strong>ECHOES</strong>
            <small>Off-World Field Guide</small>
          </div>
        </div>

        <nav className="sidebar__nav">
          {NAV_GROUPS.map((group) => (
            <div key={group.label} className="nav-group">
              <p className="nav-group__label">{group.label}</p>
              {group.items.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={`nav-item ${view === item.id ? 'nav-item--active' : ''}`}
                  onClick={() => navigate(item.id)}
                  aria-current={view === item.id ? 'page' : undefined}
                  title={item.hint}
                >
                  <span className="nav-item__icon" aria-hidden="true">
                    {item.icon}
                  </span>
                  <span className="nav-item__text">
                    <span>{item.label}</span>
                    <small>{item.hint}</small>
                  </span>
                </button>
              ))}
            </div>
          ))}
        </nav>

        <div className="sidebar__footer">
          <label className="sidebar__route">
            Curated route
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
          <div className="sidebar__mode">
            <span
              className={`badge ${
                sourceMode === 'demo' ? 'badge--demo' : 'badge--live'
              }`}
            >
              {sourceMode === 'demo' ? ARCHIVE_DATA_LABEL : 'LIVE API'}
            </span>
            <span className="badge">{artifacts.length} records</span>
          </div>
          <p className="sidebar__note">
            Verified NSSDCA records only. One record is held for second-editor
            review and is not shown.
          </p>
        </div>
      </aside>

      <div className="app-main">
        <header className="topbar">
          <div className="topbar__title">
            <p className="eyebrow">{VIEW_EYEBROWS[view]}</p>
            <h1>{VIEW_TITLES[view]}</h1>
          </div>

          <form
            className="topbar__search"
            onSubmit={(event) => {
              event.preventDefault();
              navigate('search');
            }}
          >
            <label htmlFor="global-search" className="visually-hidden">
              Search every module
            </label>
            <input
              id="global-search"
              type="search"
              value={query}
              placeholder="Search hardware, missions, places…"
              onChange={(event) => setQuery(event.target.value)}
            />
            <button type="submit" className="button button--small">
              Search
            </button>
          </form>

          <div className="topbar__controls">
            <div
              className="destination-toggle destination-toggle--compact"
              role="group"
              aria-label="Destination"
            >
              {DESTINATIONS.map((destination) => (
                <button
                  key={destination.value}
                  type="button"
                  className={
                    selectedDestination === destination.value
                      ? 'button button--small button--active'
                      : 'button button--small button--ghost'
                  }
                  aria-pressed={selectedDestination === destination.value}
                  onClick={() => selectDestination(destination.value)}
                >
                  {destination.label}
                </button>
              ))}
            </div>

            <label className="theme-select">
              <span className="visually-hidden">Theme</span>
              <span className="theme-dot" aria-hidden="true" />
              <select
                value={themeId}
                onChange={(event) => handleThemeChange(event.target.value as ThemeId)}
                aria-label="Theme"
              >
                {getAllThemes().map((entry) => (
                  <option key={entry.id} value={entry.id}>
                    {entry.name}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </header>

        {loading ? (
          <div className="loading-bar" role="status">
            <span />
            Loading verified records…
          </div>
        ) : null}

        {sourceMode === 'demo' ? (
          <div className="archive-note" role="status">
            <span>
              {demoNotice ?? 'Using the verified local archive while the live connection is unavailable.'}
            </span>
            <button type="button" className="button button--small button--ghost" onClick={retry}>
              Retry connection
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

        {selectedArtifact ? (
          <div className="selection-bar">
            <span className={`selection-bar__body selection-bar__body--${selectedArtifact.body}`}>
              <span aria-hidden="true">{selectedArtifact.body === 'moon' ? '☾' : '♂'}</span>
              {selectedArtifact.body === 'moon' ? 'Moon' : 'Mars'}
            </span>
            <div className="selection-bar__identity">
              <strong>{selectedArtifact.name}</strong>
              <small>
                {selectedArtifact.missionName} · {selectedArtifact.location.label} ·{' '}
                {selectedArtifact.location.confidence} location
              </small>
            </div>
            {detailLoading ? <span className="selection-bar__loading">Loading details…</span> : null}
            <div className="selection-bar__actions">
              <button
                type="button"
                className={saved ? 'button button--small button--active' : 'button button--small button--ghost'}
                onClick={() => toggleSaved(selectedArtifact.slug)}
                aria-pressed={saved}
              >
                {saved ? '★ Saved' : '☆ Save'}
              </button>
              <button
                type="button"
                className="button button--small button--ghost"
                onClick={() => navigate('story')}
              >
                Storybook
              </button>
              <button
                type="button"
                className="button button--small button--ghost"
                onClick={() => navigate('atlas')}
              >
                Atlas
              </button>
            </div>
          </div>
        ) : null}

        <main id="view-content" className="view" tabIndex={-1}>
          {renderView()}
        </main>

        <footer className="app-footer">
          <p>
            <strong>ECHOES</strong> is an educational field guide. Only verified
            NSSDCA records appear by default, each with claim-level sources and a
            source-check date. Records under editorial review are held out.
          </p>
          <p className="muted">
            Archive data courtesy of the NASA NSSDCA Master Catalog. This build
            does not call live NASA services and does not imply NASA endorsement.
            Theme: {theme.name}.
          </p>
        </footer>
      </div>

      {activeSource ? (
        <aside className="source-drawer" aria-label="Source evidence">
          <div className="source-drawer__header">
            <span className="badge">Evidence</span>
            <button
              type="button"
              className="button button--ghost button--small"
              onClick={closeSource}
            >
              Close
            </button>
          </div>
          <h2>{activeSource.title}</h2>
          <p className="muted">{activeSource.organization}</p>
          <a
            className="source-link"
            href={activeSource.url}
            target="_blank"
            rel="noreferrer noopener"
          >
            Open source record ↗
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
