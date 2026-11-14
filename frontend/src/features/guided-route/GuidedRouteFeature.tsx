/**
 * Guided Story Route — the real implementation that replaces the typed
 * placeholder. Routes are curated journeys over the shared artifact records;
 * the component never invents steps or narrative, it only renders the route
 * data supplied by the parent.
 */

import { useMemo, useState } from 'react';
import type { Artifact } from '@echoes/shared';
import type { GuidedRouteFeatureProps } from '../integration/featureTypes';

type OpenView = NonNullable<GuidedRouteFeatureProps['onOpenView']>;

export function GuidedRouteFeature({
  routes,
  artifacts,
  onSelectArtifact,
  onOpenView,
  exploredSlugs,
  onMarkExplored,
}: GuidedRouteFeatureProps) {
  const [activeRouteSlug, setActiveRouteSlug] = useState<string | null>(
    routes[0]?.slug ?? null,
  );
  const [stepIndex, setStepIndex] = useState(0);
  const [completed, setCompleted] = useState<string[]>([]);

  const bySlug = useMemo(
    () => new Map(artifacts.map((artifact) => [artifact.slug, artifact])),
    [artifacts],
  );

  const passportExplored = useMemo(
    () => new Set(exploredSlugs ?? []),
    [exploredSlugs],
  );

  const activeRoute =
    routes.find((route) => route.slug === activeRouteSlug) ?? routes[0] ?? null;

  if (!activeRoute) {
    return (
      <section className="route-empty" aria-label="Guided story routes">
        <h2>Guided Story Routes</h2>
        <p>
          No curated routes are available for the current filter. Clear the
          search or choose “All curated routes” to see the full journeys.
        </p>
      </section>
    );
  }

  const orderedSteps = [...activeRoute.steps].sort((a, b) => a.order - b.order);
  const safeIndex = Math.min(stepIndex, orderedSteps.length - 1);
  const step = orderedSteps[safeIndex];
  const artifact = step ? bySlug.get(step.artifactSlug) : undefined;
  const done = new Set(completed);
  const isDone = (entry: (typeof orderedSteps)[number]) =>
    done.has(entry.id) || passportExplored.has(entry.artifactSlug);
  const routeDone = orderedSteps.every((entry) => isDone(entry));
  const progress = orderedSteps.length
    ? Math.round(
        (orderedSteps.filter((entry) => isDone(entry)).length / orderedSteps.length) * 100,
      )
    : 0;

  const chooseRoute = (slug: string) => {
    setActiveRouteSlug(slug);
    setStepIndex(0);
  };

  const markStep = (entry: (typeof orderedSteps)[number]) => {
    setCompleted((previous) =>
      previous.includes(entry.id) ? previous : [...previous, entry.id],
    );
    if (onMarkExplored) {
      onMarkExplored(entry.artifactSlug);
    } else {
      // Standalone use still records the visit through the shared selection.
      onSelectArtifact(entry.artifactSlug);
    }
  };

  const openStep = (target: 'story' | 'timeline' | 'science' | 'evidence') => {
    if (!step) return;
    markStep(step);
    onSelectArtifact(step.artifactSlug);
    if (onOpenView) onOpenView(step.artifactSlug, target);
  };

  return (
    <section className="guided-route" aria-label="Guided story route">
      <header className="guided-route__header">
        <p className="eyebrow">CURATED JOURNEYS</p>
        <h2>Guided Story Routes</h2>
        <p className="guided-route__intro">
          Ordered artifact journeys built from the verified records. Each step
          opens the same shared data used by the Atlas, Storybook and Time
          Machine.
        </p>
      </header>

      <div className="route-tabs" role="tablist" aria-label="Curated routes">
        {routes.map((route) => (
          <button
            key={route.id}
            type="button"
            role="tab"
            aria-selected={route.slug === activeRoute.slug}
            className={
              route.slug === activeRoute.slug
                ? 'route-tab route-tab--active'
                : 'route-tab'
            }
            onClick={() => chooseRoute(route.slug)}
          >
            <span className="route-tab__body">{route.body === 'mixed' ? 'Moon + Mars' : route.body === 'moon' ? 'Moon' : 'Mars'}</span>
            <span className="route-tab__title">{route.title}</span>
            <span className="route-tab__meta">{route.estimatedMinutes} min · {route.steps.length} stops</span>
          </button>
        ))}
      </div>

      <div className="route-overview">
        <div>
          <h3>{activeRoute.title}</h3>
          <p>{activeRoute.description}</p>
        </div>
        <div className="route-progress" aria-label="Route progress">
          <span className="route-progress__value">{progress}%</span>
          <span className="route-progress__label">route explored</span>
          <div
            className="route-progress__track"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={progress}
          >
            <span style={{ width: `${progress}%` }} />
          </div>
        </div>
      </div>

      <ol className="route-steps" aria-label="Route steps">
        {orderedSteps.map((entry, index) => {
          const entryArtifact = bySlug.get(entry.artifactSlug);
          const isActive = index === safeIndex;
          const entryDone = isDone(entry);
          return (
            <li key={entry.id}>
              <button
                type="button"
                className={`route-step ${isActive ? 'route-step--active' : ''} ${entryDone ? 'route-step--done' : ''}`}
                onClick={() => setStepIndex(index)}
                aria-current={isActive ? 'step' : undefined}
              >
                <span className="route-step__number" aria-hidden="true">
                  {entryDone ? '✓' : entry.order}
                </span>
                <span className="route-step__content">
                  <span className="route-step__title">
                    {entryArtifact?.name ?? entry.title}
                  </span>
                  <span className="route-step__focus">{entry.focus}</span>
                </span>
                <span className="route-step__body">
                  {entryArtifact ? (entryArtifact.body === 'moon' ? 'Moon' : 'Mars') : '—'}
                </span>
              </button>
            </li>
          );
        })}
      </ol>

      {step ? (
        <article className="route-detail" aria-live="polite">
          <div className="route-detail__top">
            <p className="eyebrow">STOP {step.order} OF {orderedSteps.length}</p>
            <h3>{step.title}</h3>
            <p className="route-detail__narrative">{step.narrative}</p>
          </div>

          {artifact ? (
            <div className="route-artifact">
              <div className="route-artifact__image">
                {artifact.image ? (
                  <img src={artifact.image.url} alt={artifact.image.alt} loading="lazy" />
                ) : (
                  <span aria-hidden="true">{artifact.body === 'moon' ? '☾' : '♂'}</span>
                )}
              </div>
              <div className="route-artifact__body">
                <span className="badge">{artifact.body === 'moon' ? 'Moon' : 'Mars'}</span>
                <h4>{artifact.name}</h4>
                <p>{artifact.summary}</p>
                <dl className="route-facts">
                  <div>
                    <dt>Mission</dt>
                    <dd>{artifact.missionName}</dd>
                  </div>
                  <div>
                    <dt>Location</dt>
                    <dd>{artifact.location.label}</dd>
                  </div>
                  <div>
                    <dt>Confidence</dt>
                    <dd>{artifact.location.confidence}</dd>
                  </div>
                  <div>
                    <dt>NSSDCA</dt>
                    <dd>{artifact.nssdca.recordId}</dd>
                  </div>
                </dl>
                <div className="route-actions">
                  <button type="button" className="button" onClick={() => openStep('story')}>
                    Open storybook
                  </button>
                  <button type="button" className="button button--ghost" onClick={() => openStep('timeline')}>
                    Time machine
                  </button>
                  <button type="button" className="button button--ghost" onClick={() => openStep('science')}>
                    Science reveal
                  </button>
                  <button type="button" className="button button--ghost" onClick={() => openStep('evidence')}>
                    Evidence detective
                  </button>
                  {artifact.nssdca.recordUrl ? (
                    <a
                      className="button button--ghost"
                      href={artifact.nssdca.recordUrl}
                      target="_blank"
                      rel="noreferrer noopener"
                    >
                      NSSDCA record ↗
                    </a>
                  ) : null}
                </div>
              </div>
            </div>
          ) : (
            <div className="route-missing">
              <strong>Artifact not hydrated yet.</strong>
              <p>
                The route references <code>{step.artifactSlug}</code>, but the
                record has not loaded. Select it to retry the shared load.
              </p>
              <button
                type="button"
                className="button"
                onClick={() => onSelectArtifact(step.artifactSlug)}
              >
                Load artifact
              </button>
            </div>
          )}

          <div className="route-detail__footer">
            <button
              type="button"
              className="button button--ghost"
              onClick={() => setStepIndex(Math.max(0, safeIndex - 1))}
              disabled={safeIndex === 0}
            >
              ← Previous stop
            </button>
            <button
              type="button"
              className={isDone(step) ? 'button button--ghost' : 'button'}
              onClick={() => markStep(step)}
              disabled={isDone(step)}
            >
              {isDone(step) ? '✓ Stop explored' : 'Mark stop explored'}
            </button>
            <button
              type="button"
              className="button button--ghost"
              onClick={() => setStepIndex(Math.min(orderedSteps.length - 1, safeIndex + 1))}
              disabled={safeIndex >= orderedSteps.length - 1}
            >
              Next stop →
            </button>
          </div>

          {routeDone ? (
            <div className="route-complete" role="status">
              <strong>Route complete.</strong> You explored all {orderedSteps.length}{' '}
              stops in “{activeRoute.title}”. Open the Discovery Passport to see
              your progress.
            </div>
          ) : null}
        </article>
      ) : null}

      <p className="route-disclosure">
        Routes are curated navigation aids over verified records. They do not add
        events, facts or quotations beyond the artifact sources. Progress follows
        the artifacts recorded in your Discovery Passport, so it survives
        navigation and reloads on this device.
      </p>
    </section>
  );
}

export type { OpenView };
