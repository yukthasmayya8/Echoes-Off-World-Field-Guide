/**
 * Fact Vault — every fact below is copied or directly paraphrased from the
 * verified artifact record. Each card carries the source ids that support it.
 */

import { useMemo, useState } from 'react';
import type { Artifact, Body, Source } from '@echoes/shared';

export type FactCategory =
  | 'Mission'
  | 'Engineering'
  | 'Science'
  | 'History'
  | 'Location';

export interface VaultFact {
  id: string;
  artifactSlug: string;
  artifactName: string;
  body: Body;
  category: FactCategory;
  statement: string;
  sourceIds: string[];
}

export function buildFacts(artifact: Artifact): VaultFact[] {
  const primary = artifact.sources[0]?.id;
  const base = {
    artifactSlug: artifact.slug,
    artifactName: artifact.name,
    body: artifact.body,
  };
  const facts: VaultFact[] = [
    {
      ...base,
      id: `${artifact.slug}-identity`,
      category: 'Mission',
      statement: `${artifact.name} is a ${artifact.artifactType.replace(/-/g, ' ')} from the ${artifact.missionName} mission.`,
      sourceIds: primary ? [primary] : [],
    },
    {
      ...base,
      id: `${artifact.slug}-objective`,
      category: 'Mission',
      statement: `Mission objective: ${artifact.mission.objective}`,
      sourceIds: primary ? [primary] : [],
    },
    {
      ...base,
      id: `${artifact.slug}-location`,
      category: 'Location',
      statement: `Recorded location: ${artifact.location.label}. Location confidence is ${artifact.location.confidence}. ${artifact.location.explanation}`,
      sourceIds: artifact.location.coordinates?.sourceId
        ? [artifact.location.coordinates.sourceId]
        : primary
          ? [primary]
          : [],
    },
    {
      ...base,
      id: `${artifact.slug}-disposition`,
      category: 'History',
      statement: `Final disposition: ${artifact.mission.finalDisposition}`,
      sourceIds: primary ? [primary] : [],
    },
  ];

  if (artifact.mission.launchDate) {
    facts.push({
      ...base,
      id: `${artifact.slug}-launch`,
      category: 'History',
      statement: `Launch date recorded in the archive: ${artifact.mission.launchDate}.`,
      sourceIds: primary ? [primary] : [],
    });
  }
  if (artifact.mission.arrivalDate) {
    facts.push({
      ...base,
      id: `${artifact.slug}-arrival`,
      category: 'History',
      statement: `Arrival or landing date recorded in the archive: ${artifact.mission.arrivalDate}.`,
      sourceIds: primary ? [primary] : [],
    });
  }

  for (const discovery of artifact.discoveries) {
    facts.push({
      ...base,
      id: `${artifact.slug}-disc-${discovery.id}`,
      category: 'Engineering',
      statement: `${discovery.hardware}: ${discovery.observation}`,
      sourceIds: [...discovery.sourceIds],
    });
    facts.push({
      ...base,
      id: `${artifact.slug}-result-${discovery.id}`,
      category: 'Science',
      statement: `Scientific result: ${discovery.scientificResult}`,
      sourceIds: [...discovery.sourceIds],
    });
  }

  for (const event of artifact.timeline) {
    facts.push({
      ...base,
      id: `${artifact.slug}-event-${event.id}`,
      category: 'History',
      statement: `${event.date} — ${event.title}: ${event.description}`,
      sourceIds: [...event.sourceIds],
    });
  }

  return facts;
}

interface FactVaultProps {
  artifacts: Artifact[];
  onOpenSource: (source: Source) => void;
}

export function FactVault({ artifacts, onOpenSource }: FactVaultProps) {
  const [query, setQuery] = useState('');
  const [body, setBody] = useState<'all' | Body>('all');
  const [category, setCategory] = useState<'all' | FactCategory>('all');

  const allFacts = useMemo(
    () => artifacts.flatMap((artifact) => buildFacts(artifact)),
    [artifacts],
  );

  const sourcesById = useMemo(() => {
    const map = new Map<string, Source>();
    for (const artifact of artifacts) {
      for (const source of artifact.sources) map.set(source.id, source);
    }
    return map;
  }, [artifacts]);

  const filtered = allFacts.filter((fact) => {
    const needle = query.trim().toLowerCase();
    const matchesQuery =
      !needle ||
      fact.statement.toLowerCase().includes(needle) ||
      fact.artifactName.toLowerCase().includes(needle) ||
      fact.category.toLowerCase().includes(needle);
    const matchesBody = body === 'all' || fact.body === body;
    const matchesCategory = category === 'all' || fact.category === category;
    return matchesQuery && matchesBody && matchesCategory;
  });

  const categories: FactCategory[] = ['Mission', 'Engineering', 'Science', 'History', 'Location'];

  return (
    <section className="fact-vault" aria-label="Fact Vault">
      <header className="module-header">
        <p className="eyebrow">WHAT WE KNOW</p>
        <h2>Fact Vault</h2>
        <p>
          Search every fact that the verified records support. Each card links
          to the archive source that carries it. Nothing here is generated.
        </p>
      </header>

      <div className="vault-controls">
        <label>
          Search facts
          <input
            type="search"
            value={query}
            placeholder="Try “seismometer”, “Ares Vallis” or “1969”"
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>
        <label>
          Destination
          <select value={body} onChange={(event) => setBody(event.target.value as 'all' | Body)}>
            <option value="all">Moon and Mars</option>
            <option value="moon">Moon</option>
            <option value="mars">Mars</option>
          </select>
        </label>
        <label>
          Category
          <select
            value={category}
            onChange={(event) => setCategory(event.target.value as 'all' | FactCategory)}
          >
            <option value="all">All categories</option>
            {categories.map((entry) => (
              <option key={entry} value={entry}>
                {entry}
              </option>
            ))}
          </select>
        </label>
      </div>

      <p className="result-count" aria-live="polite">
        {filtered.length} sourced fact{filtered.length === 1 ? '' : 's'} in view
      </p>

      <div className="fact-grid">
        {filtered.map((fact) => (
          <article key={fact.id} className="fact-card">
            <div className="fact-card__top">
              <span className={`fact-category fact-category--${fact.category.toLowerCase()}`}>
                {fact.category}
              </span>
              <span className="fact-card__artifact">
                {fact.body === 'moon' ? '☾' : '♂'} {fact.artifactName}
              </span>
            </div>
            <p className="fact-card__statement">{fact.statement}</p>
            <div className="fact-card__sources">
              <span className="fact-card__source-label">How we know</span>
              {fact.sourceIds.length > 0 ? (
                fact.sourceIds.map((id) => {
                  const source = sourcesById.get(id);
                  return source ? (
                    <button
                      key={id}
                      type="button"
                      className="source-chip"
                      onClick={() => onOpenSource(source)}
                    >
                      {source.title}
                    </button>
                  ) : (
                    <span key={id} className="source-chip source-chip--missing">
                      {id} (not linked)
                    </span>
                  );
                })
              ) : (
                <span className="source-chip source-chip--missing">
                  No source id recorded
                </span>
              )}
            </div>
          </article>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="empty-card">
          <strong>No facts match those filters.</strong>
          <p>Clear the search or choose “Moon and Mars” to see the full vault.</p>
        </div>
      ) : null}
    </section>
  );
}
