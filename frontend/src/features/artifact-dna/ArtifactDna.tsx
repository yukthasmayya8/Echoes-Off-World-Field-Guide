/**
 * Artifact DNA — hardware exploration experience.
 *
 * Lets visitors explore the actual hardware components of an artifact, drawn
 * from verified discovery records. Each component shows its name, purpose,
 * how it worked, why the mission needed it, and its scientific/engineering
 * role. Nothing is invented — all content comes from the artifact's
 * discovery records and their sources.
 */

import { useState } from 'react';
import type { Artifact, Discovery, Source } from '@echoes/shared';

interface ArtifactDnaProps {
  artifact: Artifact;
  sources: Source[];
}

export function ArtifactDna({ artifact, sources }: ArtifactDnaProps) {
  const discoveries: Discovery[] = artifact.discoveries ?? [];
  const [activeId, setActiveId] = useState<string | null>(
    discoveries.length > 0 ? discoveries[0].id : null,
  );

  const sourcesById = new Map(sources.map((s) => [s.id, s]));
  const active = discoveries.find((d) => d.id === activeId) ?? null;

  if (discoveries.length === 0) {
    return (
      <section className="dna" aria-label="Artifact DNA — hardware exploration">
        <h2 className="dna-title">Artifact DNA: {artifact.name}</h2>
        <p className="dna-empty">
          No hardware components are documented for this artifact in the
          verified record.
        </p>
      </section>
    );
  }

  return (
    <section className="dna" aria-label="Artifact DNA — hardware exploration">
      <div className="dna-header">
        <h2 className="dna-title">Artifact DNA: {artifact.name}</h2>
        <p className="dna-subtitle">
          Explore the hardware that made this mission possible. Each component
          below is documented in the verified artifact record.
        </p>
      </div>

      <div className="dna-component-list">
        {discoveries.map((d) => (
          <button
            key={d.id}
            type="button"
            className={`dna-component ${
              activeId === d.id ? 'dna-component--active' : ''
            }`}
            onClick={() => setActiveId(d.id)}
            aria-pressed={activeId === d.id}
          >
            <span className="dna-component-number" aria-hidden="true">
              {discoveries.indexOf(d) + 1}
            </span>
            <span className="dna-component-name">{d.hardware}</span>
          </button>
        ))}
      </div>

      {active && (
        <div className="dna-detail">
          <div className="dna-detail-header">
            <h3 className="dna-detail-name">{active.hardware}</h3>
            <span className="dna-detail-source-tag">Verified hardware record</span>
          </div>

          <div className="dna-detail-grid">
            <div className="dna-detail-card">
              <h4 className="dna-detail-label">What it is</h4>
              <p className="dna-detail-text">{active.hardware}</p>
            </div>

            <div className="dna-detail-card">
              <h4 className="dna-detail-label">What it observed</h4>
              <p className="dna-detail-text">{active.observation}</p>
            </div>

            <div className="dna-detail-card">
              <h4 className="dna-detail-label">Scientific result</h4>
              <p className="dna-detail-text">{active.scientificResult}</p>
            </div>

            <div className="dna-detail-card">
              <h4 className="dna-detail-label">Why the mission needed it</h4>
              <p className="dna-detail-text">
                {active.simpleExplanation}
              </p>
            </div>

            <div className="dna-detail-card">
              <h4 className="dna-detail-label">Engineering role</h4>
              <p className="dna-detail-text">{active.detailedExplanation}</p>
            </div>
          </div>

          {active.sourceIds.length > 0 && (
            <div className="dna-sources">
              <h4 className="dna-source-title">Supporting sources</h4>
              <ul className="dna-source-list">
                {active.sourceIds.map((id) => {
                  const source = sourcesById.get(id);
                  return (
                    <li key={id} className="dna-source-item">
                      {source ? (
                        <>
                          <span className="dna-source-mark" aria-hidden="true">
                            ↗
                          </span>
                          <div>
                            <span className="dna-source-title">{source.title}</span>
                            <small className="dna-source-org">{source.organization}</small>
                          </div>
                          <a
                            href={source.url}
                            target="_blank"
                            rel="noreferrer noopener"
                            className="dna-source-link"
                          >
                            Open NSSDCA record
                          </a>
                        </>
                      ) : (
                        <span className="dna-source-missing">
                          Source record {id} not found.
                        </span>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
