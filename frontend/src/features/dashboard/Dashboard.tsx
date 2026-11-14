/**
 * Mission Control dashboard. This is the first screen: it makes the Moon and
 * Mars immediately reachable instead of asking visitors to scroll a document.
 */

import type { Artifact, CatalogEntry, GuidedRoute } from '@echoes/shared';
import type { PassportState } from '../../app/progress';
import type { ViewId } from '../../app/navigation';

interface DashboardProps {
  artifacts: Artifact[];
  records: CatalogEntry[];
  routes: GuidedRoute[];
  passport: PassportState;
  onNavigate: (view: ViewId) => void;
  onExplore: (body: 'moon' | 'mars') => void;
  onSelectArtifact: (slug: string) => void;
}

const MODULES: Array<{ view: ViewId; icon: string; title: string; body: string }> = [
  { view: 'atlas', icon: '◎', title: 'Planetary Atlas', body: 'Zoom, pan and select verified landing sites on Moon and Mars maps.' },
  { view: 'story', icon: '▤', title: 'Storybook', body: 'Five-chapter narrated mission stories with three narration styles.' },
  { view: 'timeline', icon: '◷', title: 'Time Machine', body: 'Walk the documented mission chronology event by event.' },
  { view: 'science', icon: '✦', title: 'Science Reveal', body: 'Follow hardware to measurement to scientific result.' },
  { view: 'dna', icon: '⬡', title: 'Artifact DNA', body: 'Inspect the documented hardware and what it observed.' },
  { view: 'evidence', icon: '⌖', title: 'Evidence Detective', body: 'Judge a claim against the archive: confirmed, partial, unproven or contradicted.' },
  { view: 'archaeologist', icon: '⛏', title: 'Space Archaeologist', body: 'Run a seven-step investigation of a real artifact.' },
  { view: 'facts', icon: '▣', title: 'Fact Vault', body: 'Search every sourced fact in the collection.' },
  { view: 'unknowns', icon: '◌', title: 'Unknowns Observatory', body: 'See exactly what the record does not establish.' },
  { view: 'legacy', icon: '⤳', title: 'Legacy Bridge', body: 'Trace documented influence and clearly labelled thematic links.' },
  { view: 'heritage', icon: '⌂', title: 'Space Heritage', body: 'Why landing sites matter and how to explore them responsibly.' },
  { view: 'compare', icon: '⇄', title: 'Compare Artifacts', body: 'Place two machines side by side across every field.' },
];

function dayOfYear(date: Date): number {
  const start = Date.UTC(date.getUTCFullYear(), 0, 0);
  const current = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
  return Math.floor((current - start) / 86400000);
}

export function Dashboard({
  artifacts,
  records,
  routes,
  passport,
  onNavigate,
  onExplore,
  onSelectArtifact,
}: DashboardProps) {
  const featured =
    artifacts.find((artifact) => artifact.slug === passport.lastSlug) ??
    artifacts[0] ??
    null;
  const daily = artifacts.length
    ? artifacts[dayOfYear(new Date()) % artifacts.length]
    : null;
  const featureRoute = routes[0] ?? null;
  const exploredPercent = artifacts.length
    ? Math.round((passport.explored.length / artifacts.length) * 100)
    : 0;

  return (
    <div className="dashboard">
      <section className="dashboard-hero">
        <div className="dashboard-hero__copy">
          <p className="eyebrow">NASA SPACE APPS CHALLENGE 2026</p>
          <h1>
            Every artifact has a story.
            <br />
            Every discovery has evidence.
          </h1>
          <p className="dashboard-hero__lead">
            ECHOES is an interactive field guide to the hardware humans left on
            the Moon and Mars. Travel to a landing site, open its mission record,
            test the evidence and see what still remains unknown.
          </p>
          <div className="dashboard-hero__actions">
            <button type="button" className="button button--moon" onClick={() => onExplore('moon')}>
              <span aria-hidden="true">☾</span> Explore the Moon
            </button>
            <button type="button" className="button button--mars" onClick={() => onExplore('mars')}>
              <span aria-hidden="true">♂</span> Explore Mars
            </button>
            <button type="button" className="button button--ghost" onClick={() => onNavigate('routes')}>
              Guided journeys
            </button>
          </div>
          <dl className="dashboard-hero__stats">
            <div>
              <dt>Verified records</dt>
              <dd>{artifacts.length}</dd>
            </div>
            <div>
              <dt>Curated routes</dt>
              <dd>{routes.length}</dd>
            </div>
            <div>
              <dt>Archive records</dt>
              <dd>{records.length}</dd>
            </div>
            <div>
              <dt>Your progress</dt>
              <dd>{exploredPercent}%</dd>
            </div>
          </dl>
        </div>

        <div className="dashboard-hero__art" aria-hidden="true">
          <div className="planet planet--moon">
            <span className="planet__crater planet__crater--1" />
            <span className="planet__crater planet__crater--2" />
            <span className="planet__crater planet__crater--3" />
          </div>
          <div className="planet planet--mars" />
          <div className="orbit-line" />
          <span className="hero-tag hero-tag--moon">Moon</span>
          <span className="hero-tag hero-tag--mars">Mars</span>
        </div>
      </section>

      <section className="dashboard-strip" aria-label="Continue exploring">
        <div className="continue-card">
          <div>
            <p className="eyebrow">CONTINUE EXPLORATION</p>
            {featured ? (
              <>
                <h2>{featured.name}</h2>
                <p>
                  {featured.missionName} · {featured.location.label} ·{' '}
                  {featured.location.confidence} location
                </p>
              </>
            ) : (
              <p>Select an artifact in the Atlas to begin.</p>
            )}
          </div>
          <div className="continue-card__actions">
            {featured ? (
              <>
                <button type="button" className="button" onClick={() => onSelectArtifact(featured.slug)}>
                  Resume record
                </button>
                <button type="button" className="button button--ghost" onClick={() => onNavigate('story')}>
                  Open storybook
                </button>
              </>
            ) : (
              <button type="button" className="button" onClick={() => onNavigate('atlas')}>
                Open Atlas
              </button>
            )}
            <button type="button" className="button button--ghost" onClick={() => onNavigate('passport')}>
              Discovery Passport
            </button>
          </div>
        </div>
      </section>

      <div className="dashboard-grid">
        <section className="dashboard-panel dashboard-panel--feature">
          <p className="eyebrow">DISCOVERY OF THE DAY</p>
          {daily ? (
            <>
              <div className="daily-image">
                {daily.image ? (
                  <img src={daily.image.url} alt={daily.image.alt} loading="lazy" />
                ) : (
                  <span aria-hidden="true">{daily.body === 'moon' ? '☾' : '♂'}</span>
                )}
              </div>
              <h2>{daily.name}</h2>
              <p className="daily-meta">
                {daily.body === 'moon' ? 'Moon' : 'Mars'} · {daily.missionName}
              </p>
              <p>{daily.summary}</p>
              <div className="dashboard-panel__actions">
                <button type="button" className="button" onClick={() => onSelectArtifact(daily.slug)}>
                  Investigate
                </button>
                <button type="button" className="button button--ghost" onClick={() => onNavigate('unknowns')}>
                  What is unknown?
                </button>
              </div>
            </>
          ) : (
            <p>No verified artifact is loaded yet.</p>
          )}
        </section>

        <section className="dashboard-panel">
          <p className="eyebrow">FEATURED ROUTE</p>
          {featureRoute ? (
            <>
              <h2>{featureRoute.title}</h2>
              <p>{featureRoute.description}</p>
              <ul className="route-preview">
                {featureRoute.steps.map((step) => (
                  <li key={step.id}>
                    <span className="route-preview__order">{step.order}</span>
                    <span>
                      <strong>{step.title}</strong>
                      <small>{step.focus}</small>
                    </span>
                  </li>
                ))}
              </ul>
              <div className="dashboard-panel__actions">
                <button type="button" className="button" onClick={() => onNavigate('routes')}>
                  Start route
                </button>
              </div>
            </>
          ) : (
            <p>No curated routes are available.</p>
          )}
        </section>

        <section className="dashboard-panel dashboard-panel--progress">
          <p className="eyebrow">YOUR DISCOVERY PASSPORT</p>
          <h2>{passport.explored.length} of {artifacts.length} artifacts explored</h2>
          <div
            className="dashboard-progress"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={exploredPercent}
            aria-label="Artifacts explored"
          >
            <span style={{ width: `${exploredPercent}%` }} />
          </div>
          <dl className="passport-mini">
            <div>
              <dt>Stories completed</dt>
              <dd>{passport.stories.length}</dd>
            </div>
            <div>
              <dt>Evidence challenges</dt>
              <dd>{passport.evidence.length}</dd>
            </div>
            <div>
              <dt>Investigations</dt>
              <dd>{passport.investigations.length}</dd>
            </div>
            <div>
              <dt>Saved artifacts</dt>
              <dd>{passport.saved.length}</dd>
            </div>
          </dl>
          <div className="dashboard-panel__actions">
            <button type="button" className="button button--ghost" onClick={() => onNavigate('passport')}>
              Open passport
            </button>
            <button type="button" className="button button--ghost" onClick={() => onNavigate('teacher')}>
              Teacher mode
            </button>
          </div>
        </section>
      </div>

      <section className="module-section" aria-label="All modules">
        <div className="module-section__head">
          <div>
            <p className="eyebrow">EXPLORE EVERY LAYER</p>
            <h2>One connected archive</h2>
          </div>
          <p>
            Every module reads the same verified artifact record. Selecting an
            artifact in the Atlas keeps it selected everywhere.
          </p>
        </div>
        <div className="module-grid">
          {MODULES.map((module) => (
            <button
              key={module.view}
              type="button"
              className="module-card"
              onClick={() => onNavigate(module.view)}
            >
              <span className="module-card__icon" aria-hidden="true">
                {module.icon}
              </span>
              <span className="module-card__title">{module.title}</span>
              <span className="module-card__body">{module.body}</span>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
