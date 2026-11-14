import { useEffect, useMemo, useRef, useState } from 'react';
import type { Artifact, Source, TimelineEvent } from '../../types';
import styles from './AfterlifeFeature.module.css';

/* ------------------------------------------------------------------ */
/* Contract (matches section 12.8 of the spec)                          */
/* autoReveal is OPTIONAL: Member 1 can pass true when the visitor      */
/* arrives from Storybook chapter 5 ("What Remains").                   */
/* ------------------------------------------------------------------ */
export interface AfterlifeFeatureProps {
  artifact: Artifact | null;
  onOpenSource: (sourceId: string) => void;
  onSelectChapter: (chapterId: string) => void;
  autoReveal?: boolean;
}

/* ------------------------------ helpers ----------------------------- */

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const CATEGORY_LABELS: Record<string, string> = {
  launch: 'Launch',
  arrival: 'Arrival',
  landing: 'Landing',
  deployment: 'Deployment',
  first_activity: 'First activity',
  milestone: 'Mission milestone',
  discovery: 'Scientific discovery',
  final_communication: 'Final communication',
  end_of_operations: 'End of operations',
  final_disposition: 'Final location or disposition',
};

function humanize(value: string | null | undefined, fallback = 'Not listed'): string {
  if (!value) return fallback;
  const text = value.replace(/_/g, ' ').trim();
  if (!text) return fallback;
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/** Parses "YYYY", "YYYY-MM" or "YYYY-MM-DD" without any timezone conversion. */
function parseParts(iso: string | null | undefined) {
  if (!iso) return null;
  const m = /^(\d{4})(?:-(\d{2}))?(?:-(\d{2}))?/.exec(iso);
  if (!m) return null;
  return {
    year: Number(m[1]),
    month: m[2] ? Number(m[2]) : null,
    day: m[3] ? Number(m[3]) : null,
  };
}

function formatDatePart(iso: string | null | undefined): string | null {
  const p = parseParts(iso);
  if (!p) return null;
  const monthName = p.month && p.month >= 1 && p.month <= 12 ? MONTHS[p.month - 1] : null;
  if (monthName && p.day) return `${p.day} ${monthName} ${p.year}`;
  if (monthName) return `${monthName} ${p.year}`;
  return String(p.year);
}

/** Shows exactly what the record supports; never fills in a missing date. */
function formatEventDate(event: TimelineEvent): string {
  const start = formatDatePart(event.date);
  if (!start) return 'Date not listed';
  const end = formatDatePart(event.dateEnd);
  return end && end !== start ? `${start} to ${end}` : start;
}

function sortKey(event: TimelineEvent): number {
  const p = parseParts(event.date);
  if (!p) return Number.POSITIVE_INFINITY; // undated events go last, never guessed
  return p.year * 10000 + (p.month ?? 0) * 100 + (p.day ?? 0);
}

function sortChronologically(events: TimelineEvent[]): TimelineEvent[] {
  return events
    .map((event, index) => ({ event, index }))
    .sort((a, b) => {
      const ka = sortKey(a.event);
      const kb = sortKey(b.event);
      if (ka === kb) return a.index - b.index;
      return ka < kb ? -1 : 1;
    })
    .map((x) => x.event);
}

/* --------------------------- small components ------------------------ */

function SourceChips({
  ids,
  sources,
  onOpenSource,
}: {
  ids: string[] | undefined;
  sources: Source[];
  onOpenSource: (id: string) => void;
}) {
  if (!ids || ids.length === 0) {
    return <p className={styles.noSource}>No source is attached to this item yet.</p>;
  }
  return (
    <ul className={styles.chips} aria-label="Supporting sources">
      {ids.map((id) => {
        const source = sources.find((s) => s.id === id);
        return (
          <li key={id}>
            <button type="button" className={styles.chip} onClick={() => onOpenSource(id)}>
              <span className={styles.chipOrg}>{source?.organization ?? 'Source'}</span>
              <span className={styles.chipTitle}>{source?.title ?? id}</span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

function StatusPanel({ artifact }: { artifact: Artifact }) {
  const status = artifact.legacyStatus ?? {};
  const rows = [
    {
      label: 'Operational status',
      question: 'Is it still carrying out its mission?',
      value: humanize(status?.operational, 'Unknown'),
    },
    {
      label: 'Communication status',
      question: 'Is it still talking to mission control?',
      value: humanize(status?.communication, 'Not listed'),
    },
    {
      label: 'Physical disposition',
      question: 'What is known about the hardware itself?',
      value: humanize(status?.physicalDisposition, 'Unknown'),
    },
  ];
  return (
    <section className={styles.statusPanel} aria-labelledby="afterlife-status-heading">
      <h3 id="afterlife-status-heading" className={styles.subheading}>
        Three different questions
      </h3>
      <p className={styles.lede}>
        A mission can end while its hardware stays where it landed. Echoes keeps these
        answers apart.
      </p>
      <dl className={styles.statusGrid}>
        {rows.map((row) => (
          <div key={row.label} className={styles.statusCell}>
            <dt>{row.label}</dt>
            <dd className={styles.statusValue}>{row.value}</dd>
            <dd className={styles.statusQuestion}>{row.question}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

const CONFIDENCE_STEPS = [
  { key: 'exact', label: 'Exact' },
  { key: 'approximate', label: 'Approximate' },
  { key: 'unknown', label: 'Unknown' },
] as const;

function ConfidenceScale({ confidence }: { confidence: string | undefined }) {
  return (
    <ol className={styles.scale} aria-label="Location confidence">
      {CONFIDENCE_STEPS.map((step) => {
        const active = step.key === confidence;
        return (
          <li
            key={step.key}
            className={active ? `${styles.scaleStep} ${styles.scaleActive}` : styles.scaleStep}
            aria-current={active ? 'true' : undefined}
          >
            <span className={styles.scaleMark} aria-hidden="true">
              {active ? '●' : '○'}
            </span>
            {step.label}
            {active && <span className={styles.srOnly}> (this record)</span>}
          </li>
        );
      })}
    </ol>
  );
}

/* ------------------------------ main body ---------------------------- */

function AfterlifeBody({
  artifact,
  onOpenSource,
  onSelectChapter,
  autoReveal = false,
}: Required<Pick<AfterlifeFeatureProps, 'artifact'>> &
  Omit<AfterlifeFeatureProps, 'artifact'> & { artifact: Artifact }) {
  const [openId, setOpenId] = useState<string | null>(null);
  const [visited, setVisited] = useState<Set<string>>(() => new Set());
  const [revealed, setRevealed] = useState(autoReveal);
  const revealHeadingRef = useRef<HTMLHeadingElement>(null);
  const didMount = useRef(false);

  const events = useMemo(() => sortChronologically(artifact.timeline ?? []), [artifact.timeline]);
  const sources = artifact.sources ?? [];
  const whatRemains = artifact.chapters?.[4]; // chapter 5 of the five-chapter structure
  const lastEvent = events[events.length - 1];
  const reachedEnd = lastEvent ? visited.has(lastEvent.id) : false;

  // Move keyboard/screen-reader focus to the reveal when the visitor opens it.
  useEffect(() => {
    if (didMount.current && revealed) revealHeadingRef.current?.focus();
    didMount.current = true;
  }, [revealed]);

  function toggleEvent(id: string) {
    setOpenId((current) => (current === id ? null : id));
    setVisited((prev) => new Set(prev).add(id));
  }

  function chapterFor(event: TimelineEvent): string | undefined {
    if (event.chapterId) return event.chapterId;
    if (event.category === 'final_disposition') return whatRemains?.id;
    return undefined;
  }

  const location = artifact.location;
  const confidence = location?.confidence;
  const showCoordinates =
    location?.coordinates && (confidence === 'exact' || confidence === 'approximate');
  const contributions = artifact.discoveries ?? [];
  const revealSourceIds = Array.from(
    new Set([...(location?.sourceIds ?? []), ...(whatRemains?.sourceIds ?? [])]),
  );

  return (
    <div className={styles.root} data-body={artifact.body}>
      <header className={styles.header}>
        <p className={styles.context}>
          {artifact.body} · {artifact.mission?.name ?? 'Mission not listed'}
        </p>
        <h2 className={styles.title}>{artifact.name}: timeline and afterlife</h2>
        <p className={styles.lede}>
          First what happened, in order. Then what remains.
        </p>
      </header>

      <StatusPanel artifact={artifact} />

      {/* ------------------------------ timeline ----------------------------- */}
      <section className={styles.timelineSection} aria-labelledby="afterlife-timeline-heading">
        <h3 id="afterlife-timeline-heading" className={styles.subheading}>
          Mission timeline
        </h3>

        {events.length === 0 ? (
          <p className={styles.empty}>
            No documented events are listed for {artifact.name} yet. Missing events stay
            missing rather than being guessed.
          </p>
        ) : (
          <>
            <p className={styles.progress} aria-live="polite">
              {visited.size} of {events.length} events opened
            </p>
            <ol className={styles.timeline}>
              {events.map((event) => {
                const isOpen = openId === event.id;
                const chapterId = chapterFor(event);
                const detailId = `afterlife-event-${event.id}`;
                return (
                  <li
                    key={event.id}
                    className={isOpen ? `${styles.event} ${styles.eventOpen}` : styles.event}
                  >
                    <button
                      type="button"
                      className={styles.eventButton}
                      aria-expanded={isOpen}
                      aria-controls={detailId}
                      onClick={() => toggleEvent(event.id)}
                    >
                      <time className={styles.eventDate} dateTime={event.date ?? undefined}>
                        {formatEventDate(event)}
                      </time>
                      <span className={styles.eventTitle}>{event.title}</span>
                      <span className={styles.eventCategory}>
                        {CATEGORY_LABELS[event.category] ?? humanize(event.category)}
                      </span>
                    </button>

                    {isOpen && (
                      <div id={detailId} className={styles.eventDetail}>
                        <p>{event.description || 'No description is listed for this event.'}</p>
                        {event.datePrecision && event.datePrecision !== 'day' && (
                          <p className={styles.note}>
                            Date precision: {humanize(event.datePrecision)}.
                          </p>
                        )}
                        <SourceChips
                          ids={event.sourceIds}
                          sources={sources}
                          onOpenSource={onOpenSource}
                        />
                        {chapterId && (
                          <button
                            type="button"
                            className={styles.linkButton}
                            onClick={() => onSelectChapter(chapterId)}
                          >
                            Read this in the Storybook
                          </button>
                        )}
                      </div>
                    )}
                  </li>
                );
              })}
            </ol>
          </>
        )}
      </section>

      {/* ------------------------------- reveal ------------------------------ */}
      <section
        id="afterlife-reveal"
        className={revealed ? `${styles.reveal} ${styles.revealOpen}` : styles.reveal}
        aria-labelledby="afterlife-reveal-heading"
      >
        {!revealed ? (
          <div className={styles.sealed}>
            <h3 id="afterlife-reveal-heading" className={styles.revealTitleSealed}>
              The mission is over. What is left?
            </h3>
            <button
              type="button"
              className={
                reachedEnd ? `${styles.revealButton} ${styles.revealReady}` : styles.revealButton
              }
              onClick={() => setRevealed(true)}
            >
              Reveal what remains
            </button>
            {!reachedEnd && events.length > 0 && (
              <p className={styles.note}>
                Open the last event on the timeline first for the full picture.
              </p>
            )}
          </div>
        ) : (
          <div className={styles.revealed} aria-live="polite">
            <div className={styles.horizon} aria-hidden="true" />
            <h3
              id="afterlife-reveal-heading"
              ref={revealHeadingRef}
              tabIndex={-1}
              className={styles.revealTitle}
            >
              What remains of {artifact.name}
            </h3>

            <div className={styles.revealGrid}>
              <div className={styles.revealBlock}>
                <h4>Final known physical state</h4>
                <p className={styles.bigValue}>
                  {humanize(artifact.legacyStatus?.physicalDisposition, 'Unknown')}
                </p>
              </div>

              <div className={styles.revealBlock}>
                <h4>Documented location</h4>
                <p>{location?.description ? humanize(location.description) : 'Unknown'}</p>
                <ConfidenceScale confidence={confidence} />
                {confidence !== 'exact' && (
                  <p className={styles.note}>
                    Why this is not exact:{' '}
                    {location?.uncertaintyExplanation ??
                      'The dataset does not record an explanation.'}
                  </p>
                )}
                {showCoordinates && location?.coordinates && (
                  <p className={styles.note}>
                    Coordinates ({confidence}): {location.coordinates.lat}°,{' '}
                    {location.coordinates.lon}°
                  </p>
                )}
              </div>
            </div>

            <div className={styles.revealBlock}>
              <h4>What it contributed</h4>
              {contributions.length === 0 ? (
                <p>No contributions are listed for this artifact yet.</p>
              ) : (
                <ul className={styles.contributions}>
                  {contributions.map((d) => (
                    <li key={d.id}>{d.title}</li>
                  ))}
                </ul>
              )}
            </div>

            <div className={styles.revealBlock}>
              <h4>Why it still matters</h4>
              {whatRemains?.body && whatRemains.body.length > 0 ? (
                whatRemains.body.map((paragraph, i) => <p key={i}>{paragraph}</p>)
              ) : (
                <p>No significance text is listed for this artifact yet.</p>
              )}
            </div>

            <div className={styles.revealBlock}>
              <h4>Sources for this section</h4>
              <SourceChips ids={revealSourceIds} sources={sources} onOpenSource={onOpenSource} />
            </div>

            {whatRemains && (
              <button
                type="button"
                className={styles.linkButton}
                onClick={() => onSelectChapter(whatRemains.id)}
              >
                Read “{whatRemains.title}” in the Storybook
              </button>
            )}
          </div>
        )}
      </section>
    </div>
  );
}

/* ------------------------------ public API --------------------------- */

export function AfterlifeFeature({
  artifact,
  onOpenSource,
  onSelectChapter,
  autoReveal,
}: AfterlifeFeatureProps) {
  if (!artifact) {
    return (
      <div className={styles.root}>
        <p className={styles.empty}>
          Choose an artifact in the Atlas to see its timeline and what remains.
        </p>
      </div>
    );
  }
  // key = artifact.id resets all local state, so nothing stale survives a switch.
  return (
    <AfterlifeBody
      key={artifact.id}
      artifact={artifact}
      onOpenSource={onOpenSource}
      onSelectChapter={onSelectChapter}
      autoReveal={autoReveal}
    />
  );
}

export default AfterlifeFeature;
