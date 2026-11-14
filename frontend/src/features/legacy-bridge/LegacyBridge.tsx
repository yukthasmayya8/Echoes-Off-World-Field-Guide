/**
 * Legacy Bridge.
 *
 * Two kinds of connection are shown, and they are never mixed:
 *   • Documented — supported by a field in the ingested record.
 *   • Thematic — a scientific or engineering comparison only. No causal or
 *     programmatic influence is claimed.
 */

import type { Artifact, Source } from '@echoes/shared';

export type BridgeKind = 'documented' | 'thematic';

export interface BridgeLink {
  id: string;
  kind: BridgeKind;
  fromSlug: string;
  toSlug: string;
  title: string;
  explanation: string;
  evidence: string;
  sourceIds: string[];
}

export function buildBridgeLinks(artifacts: Artifact[]): BridgeLink[] {
  const bySlug = new Map(artifacts.map((artifact) => [artifact.slug, artifact]));
  const links: BridgeLink[] = [];

  for (const artifact of artifacts) {
    if (artifact.parentArtifactId) {
      const parent = bySlug.get(artifact.parentArtifactId);
      if (parent) {
        links.push({
          id: `${parent.slug}-${artifact.slug}-carried`,
          kind: 'documented',
          fromSlug: parent.slug,
          toSlug: artifact.slug,
          title: `${parent.name} carried ${artifact.name}`,
          explanation: artifact.relationshipDescription ?? `${artifact.name} is recorded as a child artifact of ${parent.name}.`,
          evidence: 'The relationship is stored in the shared artifact record (parent/child ids and relationship description).',
          sourceIds: [...new Set([...artifact.sources.map((s) => s.id), ...parent.sources.map((s) => s.id)])],
        });
      }
    }
  }

  const surveyor = bySlug.get('surveyor-3');
  const eagle = bySlug.get('apollo-11-eagle');
  if (surveyor && eagle) {
    links.push({
      id: 'surveyor-apollo-context',
      kind: 'documented',
      fromSlug: surveyor.slug,
      toSlug: eagle.slug,
      title: 'Robotic soft-landing testing before crewed landing',
      explanation:
        'The Surveyor 3 record states that its objective was to demonstrate a soft landing in the Apollo zone. The Apollo 11 record documents the first crewed landing. This is a documented program context, not a claim that Surveyor 3 alone made Apollo 11 possible.',
      evidence: `Surveyor 3 objective: “${surveyor.mission.objective}”`,
      sourceIds: [...new Set([...surveyor.sources.map((s) => s.id), ...eagle.sources.map((s) => s.id)])],
    });
  }

  const lander = bySlug.get('mars-pathfinder-lander');
  const rover = bySlug.get('sojourner');
  if (lander && rover) {
    links.push({
      id: 'pathfinder-relay',
      kind: 'documented',
      fromSlug: lander.slug,
      toSlug: rover.slug,
      title: 'Lander as rover relay and camera platform',
      explanation:
        'The shared records state that Sojourner communicated with Earth through the Pathfinder lander, and the lander imaged the rover’s surroundings. The two records describe one connected surface system.',
      evidence: `Sojourner summary: “${rover.summary}”`,
      sourceIds: [...new Set([...lander.sources.map((s) => s.id), ...rover.sources.map((s) => s.id)])],
    });
  }

  if (surveyor && lander) {
    links.push({
      id: 'surveyor-pathfinder-thematic',
      kind: 'thematic',
      fromSlug: surveyor.slug,
      toSlug: lander.slug,
      title: 'Robotic landing on two different worlds',
      explanation:
        'Surveyor 3 used retro-rockets to make a controlled lunar touchdown in 1967. Mars Pathfinder used direct entry and airbags at Mars in 1997. The engineering problems are related, but the records do not claim that one mission directly influenced the other. This is a thematic comparison.',
      evidence: 'Compared fields: mission objective, landing method and destination in the two verified records.',
      sourceIds: [...new Set([...surveyor.sources.map((s) => s.id), ...lander.sources.map((s) => s.id)])],
    });
  }

  if (eagle && rover) {
    links.push({
      id: 'crewed-robotic-thematic',
      kind: 'thematic',
      fromSlug: eagle.slug,
      toSlug: rover.slug,
      title: 'Crewed field geology versus robotic surface science',
      explanation:
        'Apollo 11 carried astronauts who collected samples directly. Sojourner carried an alpha-proton-X-ray spectrometer and cameras, with operators on Earth working through a signal delay. Both produced surface science, but through very different operational models. No direct influence is claimed.',
      evidence: 'Compared fields: artifact type, crewed/robotic operations and discovery hardware.',
      sourceIds: [...new Set([...eagle.sources.map((s) => s.id), ...rover.sources.map((s) => s.id)])],
    });
  }

  return links;
}

interface LegacyBridgeProps {
  artifacts: Artifact[];
  onOpenSource: (source: Source) => void;
  onSelectArtifact: (slug: string) => void;
}

export function LegacyBridge({ artifacts, onOpenSource, onSelectArtifact }: LegacyBridgeProps) {
  const bySlug = new Map(artifacts.map((artifact) => [artifact.slug, artifact]));
  const links = buildBridgeLinks(artifacts);
  const sourcesById = new Map<string, Source>();
  for (const artifact of artifacts) {
    for (const source of artifact.sources) sourcesById.set(source.id, source);
  }

  return (
    <section className="legacy-bridge" aria-label="Legacy Bridge">
      <header className="module-header">
        <p className="eyebrow">FROM THEN TO THE FUTURE</p>
        <h2>Legacy Bridge</h2>
        <p>
          Connect an earlier mission to a later one. Documented relationships and
          thematic comparisons are labelled separately, because a similarity is
          not the same thing as a cause.
        </p>
      </header>

      <div className="bridge-legend">
        <span className="bridge-badge bridge-badge--documented">Documented</span>
        <span>Supported by a field in the ingested record.</span>
        <span className="bridge-badge bridge-badge--thematic">Thematic comparison</span>
        <span>Similar science or engineering; no direct influence claimed.</span>
      </div>

      <div className="bridge-list">
        {links.map((link) => {
          const from = bySlug.get(link.fromSlug);
          const to = bySlug.get(link.toSlug);
          if (!from || !to) return null;
          return (
            <article key={link.id} className={`bridge-card bridge-card--${link.kind}`}>
              <div className="bridge-card__top">
                <span className={`bridge-badge bridge-badge--${link.kind}`}>
                  {link.kind === 'documented' ? 'Documented' : 'Thematic comparison'}
                </span>
                <span className="bridge-card__title">{link.title}</span>
              </div>

              <div className="bridge-flow">
                <button type="button" className="bridge-node" onClick={() => onSelectArtifact(from.slug)}>
                  <span className="bridge-node__body">{from.body === 'moon' ? 'Moon' : 'Mars'}</span>
                  <strong>{from.name}</strong>
                  <small>{from.missionName}</small>
                </button>
                <span className="bridge-arrow" aria-hidden="true">→</span>
                <button type="button" className="bridge-node" onClick={() => onSelectArtifact(to.slug)}>
                  <span className="bridge-node__body">{to.body === 'moon' ? 'Moon' : 'Mars'}</span>
                  <strong>{to.name}</strong>
                  <small>{to.missionName}</small>
                </button>
              </div>

              <p className="bridge-card__explanation">{link.explanation}</p>
              <p className="bridge-card__evidence"><strong>Evidence basis:</strong> {link.evidence}</p>

              <div className="bridge-card__sources">
                {link.sourceIds.map((id) => {
                  const source = sourcesById.get(id);
                  return source ? (
                    <button key={id} type="button" className="source-chip" onClick={() => onOpenSource(source)}>
                      {source.title}
                    </button>
                  ) : null;
                })}
              </div>
            </article>
          );
        })}
      </div>

      <div className="bridge-note">
        <strong>No causal overreach.</strong> ECHOES does not claim that an
        earlier mission directly caused a later development unless the ingested
        record supports that connection. Thematic cards exist to teach comparison,
        not to invent history.
      </div>
    </section>
  );
}
