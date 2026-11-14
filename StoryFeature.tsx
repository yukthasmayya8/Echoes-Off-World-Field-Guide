import { useEffect, useMemo, useRef, useState } from 'react';
import type { Artifact, Chapter } from '../../types/artifact';
import styles from './StoryFeature.module.css';

type ChapterKey = Chapter['key'];

const CHAPTERS: ReadonlyArray<{ key: ChapterKey; eyebrow: string; prompt: string }> = [
  { key: 'why-sent', eyebrow: 'THE PURPOSE', prompt: 'Why was it sent?' },
  { key: 'carried', eyebrow: 'THE HARDWARE', prompt: 'What did it carry?' },
  { key: 'found', eyebrow: 'THE SCIENCE', prompt: 'What did it find?' },
  { key: 'ended', eyebrow: 'THE LAST SIGNAL', prompt: 'How did the mission end?' },
  { key: 'remains', eyebrow: 'THE LEGACY', prompt: 'What remains today?' },
];

const STATUS_LABELS: Record<Artifact['status'], string> = {
  active: 'Active',
  inactive: 'Inactive',
  ended: 'Mission ended',
  unknown: 'Status unknown',
};

const CONFIDENCE_LABELS: Record<Artifact['location']['confidence'], string> = {
  exact: 'Exact location',
  approximate: 'Approximate location',
  unknown: 'Location not confirmed',
};

function safeWebUrl(value: string): string | null {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.href : null;
  } catch {
    return null;
  }
}

function titleCase(value: string): string {
  return value.replace(/[-_]/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function StoryFeature({
  artifact,
  activeChapterKey,
  onOpenSources,
}: {
  artifact: Artifact;
  activeChapterKey?: ChapterKey;
  onOpenSources?: () => void;
}): JSX.Element {
  const [chapterIndex, setChapterIndex] = useState(0);
  const [imageFailed, setImageFailed] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const chapterRef = useRef<HTMLElement | null>(null);

  const chapterByKey = useMemo(
    () => new Map(artifact.chapters.map((chapter) => [chapter.key, chapter])),
    [artifact.chapters],
  );
  const orderedChapters = useMemo(
    () => CHAPTERS.map((item) => ({ ...item, chapter: chapterByKey.get(item.key) })),
    [chapterByKey],
  );
  const current = orderedChapters[chapterIndex];
  const chapter = current?.chapter;
  const sourceById = useMemo(
    () => new Map(artifact.sources.map((source) => [source.id, source])),
    [artifact.sources],
  );
  const resolvedSources = (chapter?.sourceIds ?? [])
    .map((id) => sourceById.get(id))
    .filter((source): source is NonNullable<typeof source> => Boolean(source));
  const missingSourceIds = (chapter?.sourceIds ?? []).filter((id) => !sourceById.has(id));
  const storyComplete = orderedChapters.every((item) => Boolean(item.chapter));
  const imageUrl = artifact.image ? safeWebUrl(artifact.image.url) : null;
  const locationNote = artifact.location.note.trim();

  useEffect(() => {
    setChapterIndex(0);
    setExpanded(false);
    setImageFailed(false);
  }, [artifact.id]);

  useEffect(() => {
    if (!activeChapterKey) return;
    const nextIndex = CHAPTERS.findIndex((item) => item.key === activeChapterKey);
    if (nextIndex < 0 || !orderedChapters[nextIndex]?.chapter) return;
    setChapterIndex(nextIndex);
    setExpanded(false);
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    requestAnimationFrame(() => {
      chapterRef.current?.scrollIntoView({
        behavior: reducedMotion ? 'auto' : 'smooth',
        block: 'nearest',
      });
    });
  }, [activeChapterKey, orderedChapters]);

  useEffect(() => {
    setExpanded(false);
  }, [chapterIndex]);

  const goTo = (index: number) => {
    if (index < 0 || index >= CHAPTERS.length || !orderedChapters[index]?.chapter) return;
    setChapterIndex(index);
  };

  return (
    <section className={styles.story} aria-label={`Artifact story: ${artifact.name}`}>
      <header className={styles.header}>
        <div className={styles.headerText}>
          <p className={styles.kicker}>ECHOES FIELD STORY</p>
          <h2>{artifact.name}</h2>
          <div className={styles.meta}>
            <span className={styles.mission}>{artifact.missionName}</span>
            <span className={styles.status}>{STATUS_LABELS[artifact.status]}</span>
            <span className={styles.body}>{artifact.body === 'moon' ? 'Moon' : 'Mars'}</span>
          </div>
        </div>
        <span className={styles.artifactType}>{titleCase(artifact.artifactType)}</span>
      </header>

      <div className={styles.introGrid}>
        <div className={styles.portrait}>
          {artifact.image && imageUrl && !imageFailed ? (
            <img
              src={imageUrl}
              alt={artifact.image.alt}
              onError={() => setImageFailed(true)}
            />
          ) : (
            <div className={styles.imageFallback} role="img" aria-label={`No image available for ${artifact.name}`}>
              <span aria-hidden="true">✦</span>
              <strong>{imageFailed ? 'Image unavailable' : 'Field record'}</strong>
              <small>{artifact.body === 'moon' ? 'LUNAR ARCHIVE' : 'MARTIAN ARCHIVE'}</small>
            </div>
          )}
          {artifact.image?.credit && <p className={styles.credit}>Image credit: {artifact.image.credit}</p>}
        </div>
        <div className={styles.introCopy}>
          <p className={styles.kicker}>FIELD BRIEFING</p>
          <p className={styles.summary}>{artifact.summary}</p>
          <div className={styles.locationCard}>
            <span className={styles.locationIcon} aria-hidden="true">⌖</span>
            <div>
              <strong>{artifact.location.label || 'Location not recorded'}</strong>
              <span className={styles.confidence}>{CONFIDENCE_LABELS[artifact.location.confidence]}</span>
              {locationNote && <p>{locationNote}</p>}
            </div>
          </div>
        </div>
      </div>

      <div className={styles.storyHeading}>
        <div>
          <p className={styles.kicker}>FOLLOW THE MISSION</p>
          <h3>Five moments. One lasting story.</h3>
        </div>
        <span className={styles.progressText}>Chapter {chapterIndex + 1} of 5</span>
      </div>

      <nav className={styles.chapterNav} aria-label="Story chapters">
        {CHAPTERS.map((item, index) => {
          const available = Boolean(orderedChapters[index]?.chapter);
          return (
            <button
              key={item.key}
              type="button"
              className={`${styles.chapterStep} ${chapterIndex === index ? styles.chapterStepActive : ''}`}
              onClick={() => goTo(index)}
              disabled={!available}
              aria-current={chapterIndex === index ? 'step' : undefined}
              aria-label={`Chapter ${index + 1}: ${item.prompt}${available ? '' : ' (content unavailable)'}`}
            >
              <span className={styles.stepNumber}>{String(index + 1).padStart(2, '0')}</span>
              <span className={styles.stepLabel}>{item.prompt}</span>
            </button>
          );
        })}
      </nav>
      <div
        className={styles.progressTrack}
        role="progressbar"
        aria-label="Story reading progress"
        aria-valuemin={1}
        aria-valuemax={5}
        aria-valuenow={chapterIndex + 1}
      >
        <span style={{ width: `${((chapterIndex + 1) / 5) * 100}%` }} />
      </div>

      {!storyComplete && (
        <div className={styles.dataNotice} role="status">
          <strong>Story record incomplete.</strong> Some chapter content has not been supplied in the verified artifact record. This view will not fill gaps with invented facts.
        </div>
      )}

      {chapter ? (
        <article className={styles.chapterCard} ref={chapterRef} aria-live="polite" aria-labelledby="story-chapter-title" tabIndex={-1}>
          <div className={styles.chapterTopline}>
            <span className={styles.chapterEyebrow}>{current.eyebrow}</span>
            {chapter.dramatized && <span className={styles.dramatized}>Dramatized · imagined narration</span>}
          </div>
          <h3 id="story-chapter-title">{chapter.title}</h3>
          <p className={styles.chapterText}>{chapter.text}</p>

          {chapter.deeper?.trim() && (
            <div className={styles.deeperWrap}>
              <button
                type="button"
                className={styles.deeperButton}
                aria-expanded={expanded}
                onClick={() => setExpanded((value) => !value)}
              >
                <span>{expanded ? 'Show less' : 'Go deeper'}</span>
                <span aria-hidden="true" className={expanded ? styles.chevronOpen : styles.chevron}>⌄</span>
              </button>
              {expanded && <p className={styles.deeperText}>{chapter.deeper}</p>}
            </div>
          )}

          <div className={styles.evidence}>
            <div className={styles.evidenceHeading}>
              <div>
                <p className={styles.kicker}>CHECK THE RECORD</p>
                <h4>Evidence for this chapter</h4>
              </div>
              {onOpenSources && (
                <button type="button" className={styles.allSourcesButton} onClick={onOpenSources}>
                  All sources <span aria-hidden="true">↗</span>
                </button>
              )}
            </div>
            {resolvedSources.length > 0 ? (
              <ul className={styles.sourceList}>
                {resolvedSources.map((source) => {
                  const href = safeWebUrl(source.url);
                  return (
                    <li key={source.id}>
                      <span className={styles.sourceMark} aria-hidden="true">↗</span>
                      <div>
                        {href ? (
                          <a href={href} target="_blank" rel="noreferrer noopener">{source.title}</a>
                        ) : (
                          <span className={styles.sourceTitle}>{source.title}</span>
                        )}
                        <small>{source.organization}{source.supports ? ` · ${source.supports}` : ''}</small>
                        <small className={styles.sourceId}>Record ID: {source.id}</small>
                      </div>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className={styles.noEvidence}>No chapter sources are linked yet. This chapter needs a source before its claims can be treated as verified.</p>
            )}
            {missingSourceIds.length > 0 && (
              <p className={styles.dataNotice} role="alert">Unresolved source IDs: {missingSourceIds.join(', ')}. Please correct the artifact record.</p>
            )}
          </div>

          <div className={styles.chapterFooter}>
            <button type="button" className={styles.secondaryButton} onClick={() => goTo(chapterIndex - 1)} disabled={chapterIndex === 0}>
              <span aria-hidden="true">←</span> Previous
            </button>
            {chapterIndex < CHAPTERS.length - 1 ? (
              <button type="button" className={styles.primaryButton} onClick={() => goTo(chapterIndex + 1)} disabled={!orderedChapters[chapterIndex + 1]?.chapter}>
                Next chapter <span aria-hidden="true">→</span>
              </button>
            ) : (
              <span className={styles.storyEnd}>End of field story</span>
            )}
          </div>
        </article>
      ) : (
        <div className={styles.dataNotice} role="status">
          <strong>This chapter is not available yet.</strong> The team needs to add its verified content to the artifact record.
        </div>
      )}
    </section>
  );
}
