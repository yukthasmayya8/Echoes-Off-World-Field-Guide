/**
 * Global search over the hydrated verified records. Results link to the shared
 * modules; no duplicate data store is created.
 */

import { useMemo } from 'react';
import type { Artifact } from '@echoes/shared';

interface SearchResultsProps {
  query: string;
  artifacts: Artifact[];
  onOpenView: (slug: string, view: 'story' | 'timeline' | 'science' | 'evidence') => void;
  onSelectArtifact: (slug: string) => void;
}

interface SearchHit {
  artifact: Artifact;
  field: string;
  excerpt: string;
}

function makeHits(artifacts: Artifact[], query: string): SearchHit[] {
  const needle = query.trim().toLowerCase();
  if (!needle) return [];
  const hits: SearchHit[] = [];

  for (const artifact of artifacts) {
    const fields: Array<[string, string]> = [
      ['Name', artifact.name],
      ['Mission', artifact.missionName],
      ['Summary', artifact.summary],
      ['Objective', artifact.mission.objective],
      ['Location', `${artifact.location.label} ${artifact.location.explanation}`],
      ['NSSDCA', `${artifact.nssdca.recordId} ${artifact.nssdca.recordTitle}`],
      ...artifact.aliases.map((alias): [string, string] => ['Alias', alias]),
      ...artifact.discoveries.flatMap((discovery): Array<[string, string]> => [
        ['Hardware', `${discovery.hardware} ${discovery.observation}`],
        ['Science', `${discovery.scientificResult} ${discovery.simpleExplanation}`],
      ]),
      ...artifact.story.chapters.map((chapter): [string, string] => [
        `Chapter ${chapter.number}`,
        `${chapter.title} ${chapter.simplifiedWording}`,
      ]),
      ...artifact.timeline.map((event): [string, string] => [
        'Timeline',
        `${event.date} ${event.title} ${event.description}`,
      ]),
    ];

    for (const [field, value] of fields) {
      if (value.toLowerCase().includes(needle)) {
        hits.push({
          artifact,
          field,
          excerpt: value.length > 220 ? `${value.slice(0, 220)}…` : value,
        });
      }
    }
  }

  return hits.slice(0, 60);
}

export function SearchResults({ query, artifacts, onOpenView, onSelectArtifact }: SearchResultsProps) {
  const hits = useMemo(() => makeHits(artifacts, query), [artifacts, query]);

  return (
    <section className="search-results" aria-label="Search results">
      <header className="module-header">
        <p className="eyebrow">GLOBAL SEARCH</p>
        <h2>{query.trim() ? `Results for “${query.trim()}”` : 'Search the archive'}</h2>
        <p>
          Search names, missions, hardware, discoveries, story chapters and
          timeline events across every verified record.
        </p>
      </header>

      {query.trim() ? (
        <p className="result-count" aria-live="polite">
          {hits.length} match{hits.length === 1 ? '' : 'es'} across{' '}
          {new Set(hits.map((hit) => hit.artifact.slug)).size} artifact
          {new Set(hits.map((hit) => hit.artifact.slug)).size === 1 ? '' : 's'}
        </p>
      ) : (
        <div className="empty-card">
          <strong>Type a query in the top search bar.</strong>
          <p>Try “seismometer”, “Ares Vallis”, “airbag” or “Tranquility”.</p>
        </div>
      )}

      <div className="search-hit-list">
        {hits.map((hit) => (
          <article key={`${hit.artifact.slug}-${hit.field}-${hit.excerpt.slice(0, 20)}`} className="search-hit">
            <div className="search-hit__top">
              <span className="badge">{hit.field}</span>
              <span className="search-hit__artifact">
                {hit.artifact.body === 'moon' ? '☾' : '♂'} {hit.artifact.name}
              </span>
            </div>
            <p>{hit.excerpt}</p>
            <div className="search-hit__actions">
              <button type="button" className="button button--small" onClick={() => onOpenView(hit.artifact.slug, 'story')}>
                Storybook
              </button>
              <button type="button" className="button button--ghost button--small" onClick={() => onOpenView(hit.artifact.slug, 'timeline')}>
                Time machine
              </button>
              <button type="button" className="button button--ghost button--small" onClick={() => onOpenView(hit.artifact.slug, 'science')}>
                Science
              </button>
              <button type="button" className="button button--ghost button--small" onClick={() => onSelectArtifact(hit.artifact.slug)}>
                Select
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
