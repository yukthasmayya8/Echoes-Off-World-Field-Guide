/**
 * Explore Deeper — contextual question answering over the reviewed record.
 *
 * This is deliberately a retrieval tool, not a generative chatbot. It matches
 * the visitor's words against sentences already present in the verified
 * artifact record, returns those sentences with their source ids, and says so
 * when the record does not contain an answer.
 */

import { useMemo, useState } from 'react';
import type { Artifact, Source } from '@echoes/shared';

interface RetrievalDoc {
  id: string;
  label: string;
  text: string;
  sourceIds: string[];
}

const STOPWORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'of', 'to', 'in', 'on', 'for', 'with', 'is',
  'was', 'were', 'are', 'be', 'been', 'it', 'its', 'this', 'that', 'what',
  'why', 'how', 'where', 'when', 'who', 'did', 'does', 'do', 'from', 'at',
  'by', 'as', 'about', 'can', 'could', 'you', 'tell', 'me', 'please', 'there',
  'their', 'they', 'we', 'our', 'which', 'had', 'has', 'have',
]);

function tokens(value: string): string[] {
  return value
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length > 2 && !STOPWORDS.has(token));
}

export function buildDocs(artifact: Artifact): RetrievalDoc[] {
  const docs: RetrievalDoc[] = [];
  const primary = artifact.sources.map((source) => source.id);

  docs.push({
    id: `${artifact.slug}-summary`,
    label: 'Field summary',
    text: artifact.summary,
    sourceIds: primary,
  });
  docs.push({
    id: `${artifact.slug}-objective`,
    label: 'Mission objective',
    text: artifact.mission.objective,
    sourceIds: primary,
  });
  docs.push({
    id: `${artifact.slug}-status`,
    label: 'Archived operational status',
    text: `${artifact.mission.originalOperationalStatus} ${artifact.mission.simplifiedOperationalStatus}`,
    sourceIds: primary,
  });
  docs.push({
    id: `${artifact.slug}-disposition`,
    label: 'Final disposition',
    text: artifact.mission.finalDisposition,
    sourceIds: primary,
  });
  docs.push({
    id: `${artifact.slug}-location`,
    label: 'Recorded location',
    text: `${artifact.location.label}. ${artifact.location.explanation}`,
    sourceIds: artifact.location.coordinates?.sourceId
      ? [artifact.location.coordinates.sourceId]
      : primary,
  });

  for (const event of artifact.timeline) {
    docs.push({
      id: `${artifact.slug}-event-${event.id}`,
      label: `Timeline · ${event.date}`,
      text: `${event.title}. ${event.description}`,
      sourceIds: event.sourceIds,
    });
  }
  for (const discovery of artifact.discoveries) {
    docs.push({
      id: `${artifact.slug}-disc-${discovery.id}`,
      label: `Hardware · ${discovery.hardware}`,
      text: `${discovery.observation} ${discovery.scientificResult} ${discovery.simpleExplanation}`,
      sourceIds: discovery.sourceIds,
    });
  }
  for (const chapter of artifact.story.chapters) {
    docs.push({
      id: `${artifact.slug}-chapter-${chapter.id}`,
      label: `Story chapter ${chapter.number} · ${chapter.title}`,
      text: `${chapter.simplifiedWording} ${chapter.originalWording}`,
      sourceIds: chapter.sourceIds,
    });
  }
  for (const source of artifact.sources) {
    docs.push({
      id: `${artifact.slug}-source-${source.id}`,
      label: `Source · ${source.title}`,
      text: `${source.simplifiedExplanation} ${source.originalWording}`,
      sourceIds: [source.id],
    });
  }

  return docs;
}

export interface RetrievedAnswer {
  question: string;
  matches: RetrievalDoc[];
  insufficient: boolean;
}

export function retrieveAnswer(artifact: Artifact, question: string): RetrievedAnswer {
  const queryTokens = tokens(question);
  if (queryTokens.length === 0) {
    return { question, matches: [], insufficient: true };
  }

  const docs = buildDocs(artifact);
  const scored = docs
    .map((doc) => {
      const haystack = tokens(`${doc.label} ${doc.text}`);
      const haystackSet = new Set(haystack);
      const score = queryTokens.reduce(
        (total, token) => total + (haystackSet.has(token) ? 1 : 0),
        0,
      );
      return { doc, score };
    })
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 4)
    .map((entry) => entry.doc);

  return {
    question,
    matches: scored,
    insufficient: scored.length === 0,
  };
}

interface ExploreDeeperProps {
  artifact: Artifact | null;
  artifacts: Artifact[];
  onOpenSource: (source: Source) => void;
  onSelectArtifact: (slug: string) => void;
}

const SUGGESTIONS = [
  'Why was it sent?',
  'What did it carry?',
  'Where is it now?',
  'How did the mission end?',
  'What is still unknown?',
];

export function ExploreDeeper({
  artifact,
  artifacts,
  onOpenSource,
  onSelectArtifact,
}: ExploreDeeperProps) {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState<RetrievedAnswer | null>(null);

  const sourcesById = useMemo(() => {
    const map = new Map<string, Source>();
    for (const entry of artifacts) {
      for (const source of entry.sources) map.set(source.id, source);
    }
    return map;
  }, [artifacts]);

  if (!artifact) {
    return (
      <section className="deeper" aria-label="Explore Deeper">
        <header className="module-header">
          <p className="eyebrow">SOURCE-BASED QUESTIONS</p>
          <h2>Explore Deeper</h2>
          <p>Select an artifact first, then ask a question about its reviewed record.</p>
        </header>
        <div className="empty-card">
          <strong>No artifact selected.</strong>
          <p>Open the Atlas and choose a verified record.</p>
        </div>
      </section>
    );
  }

  const ask = (value: string) => {
    setQuestion(value);
    setAnswer(retrieveAnswer(artifact, value));
  };

  return (
    <section className="deeper" aria-label="Explore Deeper">
      <header className="module-header">
        <p className="eyebrow">ASK ABOUT THIS ARTIFACT</p>
        <h2>Explore Deeper: {artifact.name}</h2>
        <p>
          This is a retrieval tool over the reviewed record, not an unrestricted
          chatbot. It returns sentences that already exist in the sources and
          says when it cannot answer.
        </p>
      </header>

      <div className="deeper-context">
        <div>
          <span className="badge">{artifact.body === 'moon' ? 'Moon' : 'Mars'}</span>
          <span className="badge">{artifact.missionName}</span>
          <span className="badge">{artifact.nssdca.recordId}</span>
        </div>
        <label>
          Switch artifact
          <select
            value={artifact.slug}
            onChange={(event) => {
              onSelectArtifact(event.target.value);
              setAnswer(null);
              setQuestion('');
            }}
          >
            {artifacts.map((entry) => (
              <option key={entry.slug} value={entry.slug}>{entry.name}</option>
            ))}
          </select>
        </label>
      </div>

      <form
        className="deeper-form"
        onSubmit={(event) => {
          event.preventDefault();
          ask(question);
        }}
      >
        <label htmlFor="deeper-question">Your question</label>
        <div className="deeper-form__row">
          <input
            id="deeper-question"
            type="search"
            value={question}
            placeholder="e.g. What did the surface sampler do?"
            onChange={(event) => setQuestion(event.target.value)}
          />
          <button type="submit" className="button">Search the record</button>
        </div>
      </form>

      <div className="deeper-suggestions">
        <span>Try:</span>
        {SUGGESTIONS.map((suggestion) => (
          <button key={suggestion} type="button" className="source-chip" onClick={() => ask(suggestion)}>
            {suggestion}
          </button>
        ))}
      </div>

      {answer ? (
        answer.insufficient ? (
          <div className="deeper-answer deeper-answer--empty" role="status">
            <h3>The reviewed record does not contain an answer to that question.</h3>
            <p>
              ECHOES will not invent a NASA fact to fill the gap. The full source
              list for this artifact is below so you can explore further.
            </p>
            <div className="deeper-sources">
              {artifact.sources.map((source) => (
                <button key={source.id} type="button" className="source-chip" onClick={() => onOpenSource(source)}>
                  {source.title}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="deeper-answer" role="status">
            <h3>What the reviewed record says</h3>
            <p className="deeper-answer__note">
              Retrieved passages for “{answer.question}”. Each passage is quoted or
              paraphrased from the record; no new facts were generated.
            </p>
            <ul className="deeper-matches">
              {answer.matches.map((match) => (
                <li key={match.id}>
                  <span className="deeper-match__label">{match.label}</span>
                  <p>{match.text}</p>
                  <div className="deeper-sources">
                    {match.sourceIds.map((id) => {
                      const source = sourcesById.get(id);
                      return source ? (
                        <button key={id} type="button" className="source-chip" onClick={() => onOpenSource(source)}>
                          {source.title}
                        </button>
                      ) : null;
                    })}
                  </div>
                </li>
              ))}
            </ul>
            <p className="deeper-disclaimer">
              If these passages do not answer the question, the record does not
              establish it. Try the Unknowns Observatory for an explicit list of
              gaps.
            </p>
          </div>
        )
      ) : (
        <div className="deeper-idle">
          <p>
            Ask about the mission, hardware, location, timeline or sources. Answers
            are limited to the reviewed record for this artifact.
          </p>
        </div>
      )}
    </section>
  );
}
