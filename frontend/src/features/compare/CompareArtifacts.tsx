/**
 * Compare Artifacts — side-by-side view of two shared records. Missing fields
 * are shown as “Not in the ingested record”, never filled in.
 */

import { useState } from 'react';
import type { Artifact } from '@echoes/shared';

const NOT_RECORDED = 'Not in the ingested record';

interface CompareArtifactsProps {
  artifacts: Artifact[];
  onSelectArtifact: (slug: string) => void;
}

function valueOrMissing(value: string | null | undefined): string {
  return value && value.trim() ? value : NOT_RECORDED;
}

export function CompareArtifacts({ artifacts, onSelectArtifact }: CompareArtifactsProps) {
  const [leftSlug, setLeftSlug] = useState(artifacts[0]?.slug ?? '');
  const [rightSlug, setRightSlug] = useState(artifacts[1]?.slug ?? artifacts[0]?.slug ?? '');

  const left = artifacts.find((artifact) => artifact.slug === leftSlug) ?? artifacts[0];
  const right = artifacts.find((artifact) => artifact.slug === rightSlug) ?? artifacts[1];

  if (!left || !right) {
    return (
      <section className="compare" aria-label="Compare artifacts">
        <h2>Compare Artifacts</h2>
        <p>Two verified records are needed for a comparison.</p>
      </section>
    );
  }

  const rows: Array<{ label: string; left: string; right: string }> = [
    { label: 'Destination', left: left.body === 'moon' ? 'Moon' : 'Mars', right: right.body === 'moon' ? 'Moon' : 'Mars' },
    { label: 'Mission', left: left.missionName, right: right.missionName },
    { label: 'Artifact type', left: left.artifactType.replace(/-/g, ' '), right: right.artifactType.replace(/-/g, ' ') },
    { label: 'Launch date', left: valueOrMissing(left.mission.launchDate), right: valueOrMissing(right.mission.launchDate) },
    { label: 'Arrival / landing date', left: valueOrMissing(left.mission.arrivalDate), right: valueOrMissing(right.mission.arrivalDate) },
    { label: 'Location', left: left.location.label, right: right.location.label },
    { label: 'Location confidence', left: left.location.confidence, right: right.location.confidence },
    { label: 'Archived operational status', left: left.mission.simplifiedOperationalStatus, right: right.mission.simplifiedOperationalStatus },
    { label: 'Final disposition', left: left.mission.finalDisposition, right: right.mission.finalDisposition },
    {
      label: 'Documented hardware',
      left: left.discoveries.length ? left.discoveries.map((entry) => entry.hardware).join('; ') : NOT_RECORDED,
      right: right.discoveries.length ? right.discoveries.map((entry) => entry.hardware).join('; ') : NOT_RECORDED,
    },
    {
      label: 'Scientific results',
      left: left.discoveries.length ? left.discoveries.map((entry) => entry.scientificResult).join(' ') : NOT_RECORDED,
      right: right.discoveries.length ? right.discoveries.map((entry) => entry.scientificResult).join(' ') : NOT_RECORDED,
    },
    { label: 'Timeline events', left: `${left.timeline.length} documented`, right: `${right.timeline.length} documented` },
    { label: 'Story chapters', left: `${left.story.chapters.length} chapters`, right: `${right.story.chapters.length} chapters` },
    { label: 'NSSDCA record', left: left.nssdca.recordId, right: right.nssdca.recordId },
  ];

  const choose = (side: 'left' | 'right', slug: string) => {
    if (side === 'left') setLeftSlug(slug);
    else setRightSlug(slug);
  };

  return (
    <section className="compare" aria-label="Compare artifacts">
      <header className="module-header">
        <p className="eyebrow">SIDE BY SIDE</p>
        <h2>Compare Artifacts</h2>
        <p>
          Compare two verified records field by field. Unavailable values stay
          visibly unavailable instead of being inferred.
        </p>
      </header>

      <div className="compare-pickers">
        <label>
          Left artifact
          <select value={left.slug} onChange={(event) => choose('left', event.target.value)}>
            {artifacts.map((artifact) => (
              <option key={artifact.slug} value={artifact.slug}>{artifact.name}</option>
            ))}
          </select>
        </label>
        <span className="compare-vs" aria-hidden="true">⇄</span>
        <label>
          Right artifact
          <select value={right.slug} onChange={(event) => choose('right', event.target.value)}>
            {artifacts.map((artifact) => (
              <option key={artifact.slug} value={artifact.slug}>{artifact.name}</option>
            ))}
          </select>
        </label>
      </div>

      <div className="compare-heads">
        {[left, right].map((artifact) => (
          <article key={artifact.slug} className="compare-head">
            <div className="compare-head__image">
              {artifact.image ? (
                <img src={artifact.image.url} alt={artifact.image.alt} loading="lazy" />
              ) : (
                <span aria-hidden="true">{artifact.body === 'moon' ? '☾' : '♂'}</span>
              )}
            </div>
            <span className="badge">{artifact.body === 'moon' ? 'Moon' : 'Mars'}</span>
            <h3>{artifact.name}</h3>
            <p>{artifact.summary}</p>
            <button type="button" className="button button--ghost" onClick={() => onSelectArtifact(artifact.slug)}>
              Select this artifact
            </button>
          </article>
        ))}
      </div>

      <div className="compare-table-wrap">
        <table className="compare-table">
          <caption className="visually-hidden">Artifact comparison</caption>
          <thead>
            <tr>
              <th scope="col">Field</th>
              <th scope="col">{left.name}</th>
              <th scope="col">{right.name}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.label}>
                <th scope="row">{row.label}</th>
                <td>{row.left}</td>
                <td>{row.right}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
