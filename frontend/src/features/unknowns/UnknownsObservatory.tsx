/**
 * Unknowns Observatory.
 *
 * Important honesty rule: an item appears here only when the ingested record
 * explicitly marks something as unknown/assumed, or when a field is simply
 * absent from the dataset. The UI labels dataset gaps separately from
 * documented scientific uncertainty so a missing field is never presented as a
 * scientific mystery.
 */

import { useMemo, useState } from 'react';
import type { Artifact, Source } from '@echoes/shared';

export type UnknownKind = 'Documented uncertainty' | 'Dataset gap' | 'Open question';

export interface UnknownItem {
  id: string;
  artifactSlug: string;
  artifactName: string;
  kind: UnknownKind;
  what: string;
  why: string;
  sourceIds: string[];
}

const UNCERTAINTY_SIGNALS = /not known|does not give|does not report|assumed|unknown reasons|unconfirmed|not confirmed/i;

export function buildUnknowns(artifact: Artifact): UnknownItem[] {
  const primary = artifact.sources[0]?.id;
  const base = { artifactSlug: artifact.slug, artifactName: artifact.name };
  const items: UnknownItem[] = [];
  const disposition = artifact.mission.finalDisposition;

  if (artifact.location.confidence !== 'exact') {
    items.push({
      ...base,
      id: `${artifact.slug}-location`,
      kind: 'Dataset gap',
      what: `The ingested record does not publish a surveyed final position; it gives the ${artifact.location.confidence} landing-site location “${artifact.location.label}”.`,
      why: 'A landing-site coordinate is not the same as a measured position for every piece of hardware. Treating the two as identical would add precision the source does not provide.',
      sourceIds: primary ? [primary] : [],
    });
  } else {
    items.push({
      ...base,
      id: `${artifact.slug}-condition`,
      kind: 'Dataset gap',
      what: 'The ingested record gives coordinates but does not include a current physical-condition assessment of the hardware.',
      why: 'A location fix tells you where an object was recorded, not whether every component is intact. Images and coordinates answer different questions.',
      sourceIds: primary ? [primary] : [],
    });
  }

  if (UNCERTAINTY_SIGNALS.test(disposition)) {
    items.push({
      ...base,
      id: `${artifact.slug}-disposition`,
      kind: 'Documented uncertainty',
      what: `The archive itself flags uncertainty in the final disposition: ${disposition}`,
      why: 'This is the archive speaking, not the project speculating. Keeping the wording visible prevents an assumption from being repeated as a fact.',
      sourceIds: primary ? [primary] : [],
    });
  }

  const hasEnd = artifact.timeline.some(
    (event) => event.eventType === 'end-of-mission' || event.eventType === 'afterlife',
  );
  if (!hasEnd) {
    items.push({
      ...base,
      id: `${artifact.slug}-end`,
      kind: 'Dataset gap',
      what: 'The ingested timeline does not contain a separate end-of-mission or last-communication event.',
      why: 'Mission completion and loss of communication are not the same event. Without a recorded event, this project does not invent one.',
      sourceIds: primary ? [primary] : [],
    });
  }

  const hasAfterlife = artifact.timeline.some((event) => event.eventType === 'afterlife');
  if (!hasAfterlife) {
    items.push({
      ...base,
      id: `${artifact.slug}-later`,
      kind: 'Dataset gap',
      what: 'No later observation or revisit is included in the ingested record.',
      why: 'Later observations can change what we know about an object’s condition. Their absence from this dataset is not evidence that none exist.',
      sourceIds: primary ? [primary] : [],
    });
  }

  items.push({
    ...base,
    id: `${artifact.slug}-engineering`,
    kind: 'Open question',
    what: 'Component-level internal specifications are not established by the mission-summary record used here.',
    why: 'The archive summary names hardware and results, but it is not an engineering parts list. A reconstruction would need to be labelled as an illustration, not presented as documented structure.',
    sourceIds: primary ? [primary] : [],
  });

  return items;
}

interface UnknownsProps {
  artifacts: Artifact[];
  onOpenSource: (source: Source) => void;
}

export function UnknownsObservatory({ artifacts, onOpenSource }: UnknownsProps) {
  const [slug, setSlug] = useState(artifacts[0]?.slug ?? '');
  const active = artifacts.find((artifact) => artifact.slug === slug) ?? artifacts[0];

  const sourcesById = useMemo(() => {
    const map = new Map<string, Source>();
    for (const artifact of artifacts) {
      for (const source of artifact.sources) map.set(source.id, source);
    }
    return map;
  }, [artifacts]);

  const items = active ? buildUnknowns(active) : [];

  return (
    <section className="unknowns" aria-label="Unknowns Observatory">
      <header className="module-header">
        <p className="eyebrow">WHAT WE DO NOT KNOW</p>
        <h2>Unknowns Observatory</h2>
        <p>
          Good science keeps the boundary between evidence and assumption visible.
          These items separate documented uncertainty from fields the dataset
          simply does not contain.
        </p>
      </header>

      <div className="artifact-tabs" role="tablist" aria-label="Choose an artifact">
        {artifacts.map((artifact) => (
          <button
            key={artifact.slug}
            type="button"
            role="tab"
            aria-selected={artifact.slug === active?.slug}
            className={artifact.slug === active?.slug ? 'artifact-tab artifact-tab--active' : 'artifact-tab'}
            onClick={() => setSlug(artifact.slug)}
          >
            <span aria-hidden="true">{artifact.body === 'moon' ? '☾' : '♂'}</span>
            {artifact.name}
          </button>
        ))}
      </div>

      {active ? (
        <>
          <div className="unknowns-summary">
            <div>
              <h3>{active.name}</h3>
              <p>{active.summary}</p>
            </div>
            <div className="unknowns-summary__meta">
              <span className="badge">{active.body === 'moon' ? 'Moon' : 'Mars'}</span>
              <span className="badge">{active.location.confidence} location</span>
              <span className="badge">{active.nssdca.recordId}</span>
            </div>
          </div>

          <div className="unknown-grid">
            {items.map((item) => (
              <article key={item.id} className={`unknown-card unknown-card--${item.kind.toLowerCase().replace(/\s+/g, '-')}`}>
                <span className="unknown-kind">{item.kind}</span>
                <h4>{item.what}</h4>
                <p><strong>Why it matters:</strong> {item.why}</p>
                <div className="unknown-sources">
                  {item.sourceIds.map((id) => {
                    const source = sourcesById.get(id);
                    return source ? (
                      <button key={id} type="button" className="source-chip" onClick={() => onOpenSource(source)}>
                        {source.title}
                      </button>
                    ) : (
                      <span key={id} className="source-chip source-chip--missing">{id}</span>
                    );
                  })}
                </div>
              </article>
            ))}
          </div>

          <div className="unknowns-note">
            <strong>Why this distinction matters.</strong> “Not in this dataset” is
            not the same as “not known to science”, and “documented uncertainty”
            is not a guess. ECHOES keeps those categories separate so students can
            see how evidence is evaluated.
          </div>
        </>
      ) : (
        <p>No verified artifact is loaded.</p>
      )}
    </section>
  );
}
