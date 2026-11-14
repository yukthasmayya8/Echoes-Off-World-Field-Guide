import type { ReactNode } from 'react';
import type { Source } from '@echoes/shared';
import type {
  AfterlifeFeatureProps,
  AtlasFeatureProps,
  GuidedRouteFeatureProps,
  MarsStoriesFeatureProps,
  MissionDebriefFeatureProps,
  MoonStoriesFeatureProps,
  ScienceEvidenceFeatureProps,
} from './featureTypes';

function PlaceholderShell({
  feature,
  title,
  children,
}: {
  feature: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="feature-placeholder" data-feature={feature}>
      <div className="feature-placeholder__badges">
        <span className="badge badge--pending">Awaiting teammate UI</span>
        <span className="badge">{feature}</span>
      </div>
      <h3>{title}</h3>
      <p className="feature-placeholder__note">
        The integration slot is wired and receiving real typed props. This is a
        developer placeholder, not the final feature interface.
      </p>
      {children}
    </div>
  );
}

function SourceButton({
  label,
  source,
  onOpenSource,
}: {
  label: string;
  source: Source | undefined;
  onOpenSource: (source: Source) => void;
}) {
  if (!source) return null;
  return (
    <button type="button" className="button button--ghost" onClick={() => onOpenSource(source)}>
      {label}
    </button>
  );
}

export function AtlasFallback({
  records,
  selectedArtifactId,
  onSelectArtifact,
}: AtlasFeatureProps) {
  return (
    <PlaceholderShell feature="atlas" title="NSSDCA Archive Atlas">
      <p>
        {records.length} searchable verified record{records.length === 1 ? '' : 's'} received.
        Selected: <code>{selectedArtifactId ?? 'none'}</code>
      </p>
      <p className="feature-placeholder__label">Developer selection harness</p>
      <ul className="harness-list">
        {records.map((record) => (
          <li key={record.slug}>
            <button
              type="button"
              className={
                record.slug === selectedArtifactId
                  ? 'harness-button harness-button--active'
                  : 'harness-button'
              }
              onClick={() => onSelectArtifact(record.slug)}
            >
              <span>{record.name}</span>
              <small>
                {record.body.toUpperCase()} · {record.missionName} · NSSDCA{' '}
                {record.nssdcaRecordId}
              </small>
            </button>
          </li>
        ))}
      </ul>
      {records.length === 0 ? <p>No verified artifacts match the current search.</p> : null}
    </PlaceholderShell>
  );
}

function StorybookFallback({
  feature,
  title,
  artifact,
  onOpenSource,
}: {
  feature: string;
  title: string;
  artifact: MoonStoriesFeatureProps['artifact'];
  onOpenSource: (source: Source) => void;
}) {
  return (
    <PlaceholderShell feature={feature} title={title}>
      <p>
        <strong>{artifact.name}</strong> — {artifact.summary}
      </p>
      <p>
        {artifact.story.chapters.length} chapters · {artifact.timeline.length} timeline events ·{' '}
        {artifact.sources.length} source{artifact.sources.length === 1 ? '' : 's'}
      </p>
      <ol className="harness-list harness-list--plain">
        {artifact.story.chapters.map((chapter) => (
          <li key={chapter.id}>
            <span>{chapter.title}</span>
            <small>{chapter.sourceIds.join(', ')}</small>
          </li>
        ))}
      </ol>
      <div className="feature-placeholder__actions">
        <SourceButton
          label="Open primary NSSDCA source"
          source={artifact.sources[0]}
          onOpenSource={onOpenSource}
        />
      </div>
    </PlaceholderShell>
  );
}

export function MoonStoriesFallback(props: MoonStoriesFeatureProps) {
  return (
    <StorybookFallback
      feature="moonStories"
      title="Moon Artifact Storybook"
      artifact={props.artifact}
      onOpenSource={props.onOpenSource}
    />
  );
}

export function MarsStoriesFallback(props: MarsStoriesFeatureProps) {
  return (
    <StorybookFallback
      feature="marsStories"
      title="Mars Artifact Storybook"
      artifact={props.artifact}
      onOpenSource={props.onOpenSource}
    />
  );
}

export function AfterlifeFallback({
  artifact,
  onOpenSource,
  onSelectChapter,
}: AfterlifeFeatureProps) {
  const dispositionSource = artifact.sources[0];

  return (
    <PlaceholderShell feature="afterlife" title="Mission Timeline & Afterlife">
      <p>
        {artifact.timeline.length} chronological events loaded for{' '}
        <strong>{artifact.name}</strong>.
      </p>
      <ol className="harness-list harness-list--plain">
        {artifact.timeline.map((event) => (
          <li key={event.id}>
            <span>
              <code>{event.date}</code> {event.title}
            </span>
            <small>{event.eventType}</small>
          </li>
        ))}
      </ol>
      <p>
        <strong>Final disposition:</strong> {artifact.mission.finalDisposition}
      </p>
      <div className="feature-placeholder__actions">
        {artifact.story.chapters.map((chapter) => (
          <button
            key={chapter.id}
            type="button"
            className="button button--ghost"
            onClick={() => onSelectChapter(chapter)}
          >
            Chapter {chapter.number}
          </button>
        ))}
        <SourceButton
          label="Open disposition source"
          source={dispositionSource}
          onOpenSource={onOpenSource}
        />
      </div>
    </PlaceholderShell>
  );
}

export function ScienceEvidenceFallback({
  artifact,
  onOpenSource,
}: ScienceEvidenceFeatureProps) {
  return (
    <PlaceholderShell feature="scienceEvidence" title="Science-to-Discovery Reveal + Evidence">
      <p>
        {artifact.discoveries.length} structured discovery record
        {artifact.discoveries.length === 1 ? '' : 's'} loaded.
      </p>
      <ul className="harness-list harness-list--plain">
        {artifact.discoveries.map((discovery) => (
          <li key={discovery.id}>
            <span>{discovery.hardware}</span>
            <small>{discovery.sourceIds.join(', ')}</small>
          </li>
        ))}
      </ul>
      <p>
        <strong>Location confidence:</strong> {artifact.location.confidence} —{' '}
        {artifact.location.label}
      </p>
      <p>{artifact.location.explanation}</p>
      <div className="feature-placeholder__actions">
        <SourceButton
          label="Open evidence source"
          source={artifact.sources[0]}
          onOpenSource={onOpenSource}
        />
      </div>
    </PlaceholderShell>
  );
}

export function MissionDebriefFallback({ quiz }: MissionDebriefFeatureProps) {
  return (
    <PlaceholderShell feature="missionDebrief" title="Mission Debrief">
      <p>
        <strong>{quiz.title}</strong> — {quiz.questions.length} question
        {quiz.questions.length === 1 ? '' : 's'} loaded without answer keys.
      </p>
      <ul className="harness-list harness-list--plain">
        {quiz.questions.map((question) => (
          <li key={question.id}>
            <span>{question.prompt}</span>
            <small>
              {question.options.length} options · sources {question.sourceIds.join(', ')}
            </small>
          </li>
        ))}
      </ul>
      <p className="feature-placeholder__note">
        Submission is wired through <code>submitQuizAnswer</code>. In DEMO MODE it
        is evaluated locally and labelled as local; the placeholder does not render
        the final debrief interface.
      </p>
    </PlaceholderShell>
  );
}

export function GuidedRouteFallback({
  routes,
  artifacts,
  onSelectArtifact,
}: GuidedRouteFeatureProps) {
  const bySlug = new Map(artifacts.map((artifact) => [artifact.slug, artifact]));

  return (
    <PlaceholderShell feature="guidedRoute" title="Guided Story Route">
      <p>
        {routes.length} route{routes.length === 1 ? '' : 's'} received, with{' '}
        {artifacts.length} hydrated artifact record{artifacts.length === 1 ? '' : 's'}.
      </p>
      {routes.map((route) => (
        <div key={route.id} className="harness-route">
          <h4>
            {route.title} <small>({route.estimatedMinutes} min)</small>
          </h4>
          <p>{route.description}</p>
          <ol className="harness-list harness-list--plain">
            {route.steps.map((step) => {
              const artifact = bySlug.get(step.artifactSlug);
              return (
                <li key={step.id}>
                  <button
                    type="button"
                    className="harness-button harness-button--inline"
                    onClick={() => onSelectArtifact(step.artifactSlug)}
                  >
                    {step.order}. {artifact?.name ?? step.title}
                  </button>
                  <small>{step.focus}</small>
                </li>
              );
            })}
          </ol>
        </div>
      ))}
    </PlaceholderShell>
  );
}
