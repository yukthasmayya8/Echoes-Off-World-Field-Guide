import { useEffect, useState } from 'react';
import type { Artifact, Discovery, Source } from '../../types';

export interface ScienceEvidenceFeatureProps {
  artifact: Artifact | null;
  onOpenSource: (sourceId: string) => void;
}

const CSS = `
.sci-root { color: #e8ecf4; background: #0b1530; padding: 1.5rem; border-radius: 12px; max-width: 860px; margin: 0 auto; font-family: system-ui, sans-serif; line-height: 1.6; }
.sci-title { font-size: 1.6rem; margin: 0 0 .5rem; }
.sci-subtitle { font-size: 1.1rem; margin: 1.25rem 0 .5rem; }
.sci-intro, .sci-meta { color: #a9b4cc; margin: 0 0 1rem; }
.sci-empty { color: #a9b4cc; padding: 1rem; }

.sci-tabs { display: flex; gap: .5rem; flex-wrap: wrap; margin-bottom: 1rem; }
.sci-tab, .sci-tabActive, .sci-chip, .sci-toggleOn, .sci-toggleOff {
  font: inherit; cursor: pointer; border-radius: 8px; padding: .5rem .9rem; border: 1px solid #3a4a75; background: transparent; color: inherit;
}
.sci-tabActive, .sci-toggleOn { background: #1d2c57; border-color: #e0a84f; }
.sci-chip { font-size: .85rem; padding: .25rem .7rem; }
button:focus-visible, a:focus-visible, summary:focus-visible { outline: 3px solid #e0a84f; outline-offset: 2px; }

.sci-panel { border-left: 3px solid #e0a84f; padding-left: 1rem; }
.sci-chain { list-style: none; padding: 0; margin: 0 0 1rem; display: grid; gap: .75rem; grid-template-columns: repeat(auto-fit, minmax(190px, 1fr)); }
.sci-stage { background: #13224a; border-radius: 8px; padding: .75rem; }
.sci-stage p { margin: .25rem 0 0; }
.sci-stageLabel { font-weight: 700; color: #e0a84f; }
.sci-toggle { display: inline-flex; gap: .5rem; }
.sci-explain { margin: .75rem 0; max-width: 70ch; }
.sci-sourceRow { display: flex; gap: .5rem; flex-wrap: wrap; align-items: center; margin-top: .75rem; }

.sci-source { background: #13224a; border-radius: 8px; padding: .6rem .9rem; margin-bottom: .5rem; }
.sci-source summary { cursor: pointer; }
.sci-source dt { font-weight: 700; margin-top: .5rem; }
.sci-source dd { margin: 0; color: #c9d2e6; }
.sci-quote { font-style: italic; }
.sci-actions { display: flex; gap: 1rem; align-items: center; margin-top: .75rem; }
.sci-actions a { color: #e0a84f; }



@media (max-width: 600px) { .sci-root { padding: 1rem; } }
@media (prefers-reduced-motion: no-preference) { .sci-tab, .sci-tabActive, .sci-chip { transition: background .15s; } }
`;

const UNKNOWN = 'Not listed in verified sources';

export function ScienceEvidenceFeature({ artifact, onOpenSource }: ScienceEvidenceFeatureProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [deep, setDeep] = useState(false);

  // Reset when the artifact changes so no stale discovery is shown.
  useEffect(() => {
    setActiveId(artifact?.discoveries?.[0]?.id ?? null);
    setDeep(false);
  }, [artifact?.id]);

  if (!artifact) {
    return (<div><style>{CSS}</style><p className="sci-empty">Select an artifact in the Atlas to see the science behind it.</p></div>);
  }

  const discoveries: Discovery[] = artifact.discoveries ?? [];
  const sources: Source[] = artifact.sources ?? [];
  const active = discoveries.find((d) => d.id === activeId) ?? null;

  if (discoveries.length === 0) {
    return (
      <section className="sci-root" aria-labelledby="sci-title"><style>{CSS}</style>
        <h2 id="sci-title" className={"sci-title"}>Science behind {artifact.name}</h2>
        <p className={"sci-empty"}>No verified discoveries are listed for this artifact yet.</p>
      </section>
    );
  }

  const stages = active
    ? [
        { label: 'Hardware', text: active.instrument },
        { label: 'Measurement', text: active.measurement },
        { label: 'Observation', text: active.observation },
        { label: 'Scientific result', text: active.scientificResult },
      ]
    : [];

  return (
    <section className="sci-root" aria-labelledby="sci-title"><style>{CSS}</style>
      <h2 id="sci-title" className={"sci-title"}>Science behind {artifact.name}</h2>
      <p className={"sci-intro"}>
        Follow each result from the instrument to the conclusion. A measurement is what the
        hardware recorded; a result is what researchers concluded from it.
      </p>

      <div className={"sci-tabs"} role="tablist" aria-label="Discoveries">
        {discoveries.map((d) => (
          <button
            key={d.id}
            role="tab"
            aria-selected={d.id === activeId}
            className={d.id === activeId ? "sci-tabActive" : "sci-tab"}
            onClick={() => { setActiveId(d.id); setDeep(false); }}
          >
            {d.title}
          </button>
        ))}
      </div>

      {active && (
        <div className={"sci-panel"} role="tabpanel">
          <ol className={"sci-chain"}>
            {stages.map((s) => (
              <li key={s.label} className={"sci-stage"}>
                <span className={"sci-stageLabel"}>{s.label}</span>
                <p>{s.text || UNKNOWN}</p>
              </li>
            ))}
          </ol>

          <div className={"sci-toggle"} role="group" aria-label="Explanation depth">
            <button aria-pressed={!deep} className={!deep ? "sci-toggleOn" : "sci-toggleOff"} onClick={() => setDeep(false)}>
              Simple
            </button>
            <button aria-pressed={deep} className={deep ? "sci-toggleOn" : "sci-toggleOff"} onClick={() => setDeep(true)}>
              Deeper
            </button>
          </div>
          <p className={"sci-explain"}>
            {(deep ? active.technicalExplanation : active.simpleExplanation) || UNKNOWN}
          </p>

          <div className={"sci-sourceRow"}>
            <span>Supported by</span>
            {active.sourceIds.length === 0 && <em>{UNKNOWN}</em>}
            {active.sourceIds.map((id) => (
              <button key={id} className={"sci-chip"} onClick={() => onOpenSource(id)}>
                {sources.find((s) => s.id === id)?.organization ?? id}
              </button>
            ))}
          </div>
        </div>
      )}

      <h3 className={"sci-subtitle"}>Evidence and sources</h3>
      {sources.length === 0 && <p className={"sci-empty"}>No sources listed.</p>}
      {sources.map((s) => {
        const supports = discoveries.filter((d) => d.sourceIds.includes(s.id));
        return (
          <details key={s.id} className={"sci-source"}>
            <summary>
              <strong>{s.organization}</strong>: {s.title}
            </summary>
            <dl>
              <dt>Source type</dt>
              <dd>{s.sourceType || UNKNOWN}</dd>
              {s.excerpt && (<><dt>Original wording</dt><dd className={"sci-quote"}>{s.excerpt}</dd></>)}
              {s.simplifiedExplanation && (<><dt>In plain words</dt><dd>{s.simplifiedExplanation}</dd></>)}
              <dt>Claims supported</dt>
              <dd>{supports.length ? supports.map((d) => d.title).join(', ') : UNKNOWN}</dd>
              <dt>Checked</dt>
              <dd>{s.dateAccessed || UNKNOWN}</dd>
            </dl>
            <div className={"sci-actions"}>
              <a href={s.url} target="_blank" rel="noopener noreferrer">Open source page</a>
              <button className={"sci-chip"} onClick={() => onOpenSource(s.id)}>View in drawer</button>
            </div>
          </details>
        );
      })}
    </section>
  );
}
