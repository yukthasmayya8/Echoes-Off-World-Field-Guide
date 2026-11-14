/**
 * Discovery Passport — anonymous local learning progress. No account, name or
 * email is required or stored.
 */

import type { Artifact } from '@echoes/shared';
import {
  buildBadges,
  resetPassport,
  toggleSaved,
  type PassportState,
} from '../../app/progress';
import type { ViewId } from '../../app/navigation';

interface DiscoveryPassportProps {
  artifacts: Artifact[];
  passport: PassportState;
  onSelectArtifact: (slug: string) => void;
  onNavigate: (view: ViewId) => void;
}

function namesFor(slugs: string[], artifacts: Artifact[]): string[] {
  return slugs
    .map((slug) => artifacts.find((artifact) => artifact.slug === slug)?.name ?? slug)
    .filter(Boolean);
}

export function DiscoveryPassport({
  artifacts,
  passport,
  onSelectArtifact,
  onNavigate,
}: DiscoveryPassportProps) {
  const badges = buildBadges(passport);
  const earned = badges.filter((badge) => badge.earned);
  const explored = namesFor(passport.explored, artifacts);
  const saved = namesFor(passport.saved, artifacts);
  const moonExplored = passport.explored.filter(
    (slug) => artifacts.find((artifact) => artifact.slug === slug)?.body === 'moon',
  ).length;
  const marsExplored = passport.explored.filter(
    (slug) => artifacts.find((artifact) => artifact.slug === slug)?.body === 'mars',
  ).length;

  const summary = explored.length
    ? `You have explored ${explored.length} verified artifact${explored.length === 1 ? '' : 's'} (${moonExplored} Moon, ${marsExplored} Mars), completed ${passport.stories.length} storybook${passport.stories.length === 1 ? '' : 's'}, finished ${passport.evidence.length} evidence challenge${passport.evidence.length === 1 ? '' : 's'} and ${passport.investigations.length} investigation${passport.investigations.length === 1 ? '' : 's'}.`
    : 'Your passport is empty. Open an artifact in the Atlas to make your first discovery.';

  return (
    <section className="passport" aria-label="Discovery Passport">
      <header className="module-header">
        <p className="eyebrow">YOUR LEARNING JOURNEY</p>
        <h2>Discovery Passport</h2>
        <p>
          Progress is stored only in this browser. No account, name or email is
          required, and no personal information is collected.
        </p>
      </header>

      <div className="passport-hero">
        <div className="passport-hero__stamp" aria-hidden="true">✧</div>
        <div>
          <span className="passport-hero__label">Personal discovery summary</span>
          <p>{summary}</p>
        </div>
        <div className="passport-hero__count">
          <span>{earned.length}</span>
          <small>of {badges.length} badges</small>
        </div>
      </div>

      <div className="passport-stats">
        <div><span>{passport.explored.length}</span><small>Artifacts explored</small></div>
        <div><span>{passport.stories.length}</span><small>Stories completed</small></div>
        <div><span>{passport.evidence.length}</span><small>Evidence challenges</small></div>
        <div><span>{passport.investigations.length}</span><small>Investigations</small></div>
        <div><span>{passport.saved.length}</span><small>Saved artifacts</small></div>
      </div>

      <section className="passport-section">
        <div className="passport-section__head">
          <h3>Achievement badges</h3>
          <span>{earned.length} earned</span>
        </div>
        <div className="badge-grid">
          {badges.map((badge) => (
            <article
              key={badge.id}
              className={`achievement ${badge.earned ? 'achievement--earned' : 'achievement--locked'}`}
            >
              <span className="achievement__icon" aria-hidden="true">
                {badge.earned ? '★' : '☆'}
              </span>
              <h4>{badge.label}</h4>
              <p>{badge.description}</p>
              <span className="achievement__state">
                {badge.earned ? 'Earned' : 'Locked'}
              </span>
            </article>
          ))}
        </div>
      </section>

      <div className="passport-columns">
        <section className="passport-section">
          <div className="passport-section__head">
            <h3>Artifacts explored</h3>
            <span>{explored.length}</span>
          </div>
          {explored.length ? (
            <ul className="passport-list">
              {passport.explored.map((slug) => {
                const artifact = artifacts.find((entry) => entry.slug === slug);
                return (
                  <li key={slug}>
                    <button type="button" onClick={() => onSelectArtifact(slug)}>
                      <span aria-hidden="true">{artifact?.body === 'mars' ? '♂' : '☾'}</span>
                      {artifact?.name ?? slug}
                    </button>
                    <small>{artifact?.missionName ?? 'Record not loaded'}</small>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="muted">No artifacts explored yet.</p>
          )}
        </section>

        <section className="passport-section">
          <div className="passport-section__head">
            <h3>Saved artifacts</h3>
            <span>{saved.length}</span>
          </div>
          {passport.saved.length ? (
            <ul className="passport-list">
              {passport.saved.map((slug) => {
                const artifact = artifacts.find((entry) => entry.slug === slug);
                return (
                  <li key={slug}>
                    <button type="button" onClick={() => onSelectArtifact(slug)}>
                      {artifact?.name ?? slug}
                    </button>
                    <button
                      type="button"
                      className="passport-remove"
                      onClick={() => toggleSaved(slug)}
                      aria-label={`Remove ${artifact?.name ?? slug} from saved artifacts`}
                    >
                      Remove
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="muted">No saved artifacts yet.</p>
          )}
        </section>
      </div>

      <div className="passport-actions">
        <button type="button" className="button" onClick={() => onNavigate('atlas')}>
          Explore another artifact
        </button>
        <button type="button" className="button button--ghost" onClick={() => onNavigate('teacher')}>
          Classroom mode
        </button>
        <button
          type="button"
          className="button button--ghost"
          onClick={() => {
            if (window.confirm('Reset all locally stored ECHOES progress?')) {
              resetPassport();
            }
          }}
        >
          Reset passport
        </button>
      </div>
    </section>
  );
}
