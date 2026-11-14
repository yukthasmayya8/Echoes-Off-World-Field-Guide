/**
 * Teacher Mode — optional classroom kit generated from the selected verified
 * record. It does not change the normal visitor experience.
 */

import type { Artifact } from '@echoes/shared';

interface TeacherModeProps {
  artifact: Artifact | null;
  artifacts: Artifact[];
  onSelectArtifact: (slug: string) => void;
  onNavigate: (view: 'story' | 'evidence' | 'archaeologist' | 'resources' | 'atlas') => void;
}

const VOCABULARY: Array<{ term: string; definition: string }> = [
  { term: 'Artifact', definition: 'A human-made object left at a mission site. In ECHOES it means documented hardware, not a natural rock.' },
  { term: 'Archive record', definition: 'A structured historical record, such as an NSSDCA mission entry, used as evidence.' },
  { term: 'Location confidence', definition: 'How precisely the record locates an object: exact, approximate or unknown.' },
  { term: 'Primary source', definition: 'The original record or dataset that supports a claim, rather than a summary of it.' },
  { term: 'Disposition', definition: 'What happened to the hardware at the end of the mission, as far as the record documents.' },
  { term: 'Thematic comparison', definition: 'A comparison of similar science or engineering that does not claim one mission caused another.' },
];

export function TeacherMode({ artifact, artifacts, onSelectArtifact, onNavigate }: TeacherModeProps) {
  const target = artifact ?? artifacts[0] ?? null;

  if (!target) {
    return (
      <section className="teacher" aria-label="Teacher mode">
        <h2>Teacher Mode</h2>
        <p>No verified artifact is loaded.</p>
      </section>
    );
  }

  const hardware = target.discoveries.map((entry) => entry.hardware);

  return (
    <section className="teacher" aria-label="Teacher mode">
      <header className="module-header">
        <p className="eyebrow">OPTIONAL CLASSROOM KIT</p>
        <h2>Teacher Mode</h2>
        <p>
          A short, printable lesson built around one verified artifact. Use it as
          a 45–60 minute investigation. It is optional and does not alter the main
          visitor experience.
        </p>
      </header>

      <div className="teacher-toolbar">
        <label>
          Lesson artifact
          <select value={target.slug} onChange={(event) => onSelectArtifact(event.target.value)}>
            {artifacts.map((entry) => (
              <option key={entry.slug} value={entry.slug}>{entry.name}</option>
            ))}
          </select>
        </label>
        <button type="button" className="button button--ghost" onClick={() => window.print()}>
          Print lesson
        </button>
        <button type="button" className="button" onClick={() => onNavigate('archaeologist')}>
          Open investigation
        </button>
      </div>

      <div className="teacher-sheet">
        <header className="teacher-sheet__head">
          <p className="eyebrow">ECHOES LESSON · {target.body === 'moon' ? 'MOON' : 'MARS'}</p>
          <h3>{target.name}: reading a mission record</h3>
          <p>
            Mission: {target.missionName} · Artifact type: {target.artifactType.replace(/-/g, ' ')} ·
            Location: {target.location.label} ({target.location.confidence} confidence)
          </p>
        </header>

        <section className="teacher-block">
          <h4>Learning objectives</h4>
          <ul>
            <li>Explain what the artifact is and which mission left it behind.</li>
            <li>Distinguish a documented fact from an interpretation or an unknown.</li>
            <li>Use a primary source to check a claim about the mission.</li>
            <li>Describe one scientific or engineering contribution of the hardware.</li>
          </ul>
        </section>

        <section className="teacher-block">
          <h4>Short lesson summary</h4>
          <p>{target.summary}</p>
          <p>
            <strong>Why it was sent:</strong> {target.mission.objective}
          </p>
          <p>
            <strong>What remains:</strong> {target.mission.finalDisposition}
          </p>
        </section>

        <section className="teacher-block">
          <h4>Scientific vocabulary</h4>
          <dl className="vocab-list">
            {VOCABULARY.map((entry) => (
              <div key={entry.term}>
                <dt>{entry.term}</dt>
                <dd>{entry.definition}</dd>
              </div>
            ))}
            {hardware.map((item) => (
              <div key={item}>
                <dt>{item}</dt>
                <dd>Hardware named in the verified record for this artifact. Ask students to find what it observed and what result it produced.</dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="teacher-block">
          <h4>Discussion questions</h4>
          <ol>
            <li>What is the difference between “the mission ended” and “we lost contact”?</li>
            <li>Why does the location confidence matter when we describe where the hardware is?</li>
            <li>Which claim in this record is best supported, and which is the weakest? What evidence would strengthen it?</li>
            <li>If a future mission landed nearby, what could it disturb, and what could it learn?</li>
          </ol>
        </section>

        <section className="teacher-block">
          <h4>Classroom investigation</h4>
          <ol>
            <li>Open the Atlas and locate this artifact. Record its coordinates and confidence level.</li>
            <li>Read the Storybook chapters and list three facts, one interpretation and one unknown.</li>
            <li>Complete the Evidence Detective challenge and explain why the correct verdict fits the source.</li>
            <li>Compare this artifact with one from the other destination using the Compare module.</li>
            <li>Write a 100-word museum label that does not overstate the evidence.</li>
          </ol>
          <div className="teacher-actions">
            <button type="button" className="button" onClick={() => onNavigate('story')}>Storybook</button>
            <button type="button" className="button button--ghost" onClick={() => onNavigate('evidence')}>Evidence Detective</button>
            <button type="button" className="button button--ghost" onClick={() => onNavigate('atlas')}>Atlas</button>
            <button type="button" className="button button--ghost" onClick={() => onNavigate('resources')}>NASA Resources</button>
          </div>
        </section>

        <section className="teacher-block">
          <h4>Assessment prompt</h4>
          <p>
            “Explain how we know where this artifact is, what it did, and what the
            record does not establish. Use at least two source references.”
          </p>
        </section>

        <footer className="teacher-sheet__foot">
          <p>
            Sources: {target.sources.map((source) => `${source.title} (${source.organization}, checked ${source.accessedOn})`).join('; ')}.
          </p>
          <p>
            ECHOES is an educational project. It is not an official NASA
            curriculum and does not imply NASA endorsement.
          </p>
        </footer>
      </div>
    </section>
  );
}
