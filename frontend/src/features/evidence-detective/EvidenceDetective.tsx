/**
 * EvidenceDetective — interactive scientific reasoning challenge UI.
 *
 * Visitors evaluate a factual statement against archived evidence and choose
 * a verdict. The component explains the correct reasoning and links to the
 * original sources.
 */

import { useCallback, useState } from 'react';
import type { Artifact, Source } from '@echoes/shared';
import {
  getEvidenceChallenges,
  getSourceById,
  type EvidenceChallenge,
  type EvidenceVerdict,
  verdictColor,
} from './detectiveData';

interface EvidenceDetectiveProps {
  artifact: Artifact;
  sources: Source[];
  /** Optional passport hook, fired when every challenge has been attempted. */
  onComplete?: () => void;
}

export function EvidenceDetective({ artifact, sources, onComplete }: EvidenceDetectiveProps) {
  const challenges = getEvidenceChallenges(artifact);
  const [challengeIndex, setChallengeIndex] = useState(0);
  const [verdict, setVerdict] = useState<EvidenceVerdict | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);

  const challenge = challenges[challengeIndex];
  const isComplete = verdict !== null;

  const selectVerdict = useCallback((v: EvidenceVerdict) => {
    setVerdict(v);
    setShowExplanation(true);
    if (challengeIndex === challenges.length - 1) onComplete?.();
  }, [challengeIndex, challenges.length, onComplete]);

  const nextChallenge = useCallback(() => {
    setVerdict(null);
    setShowExplanation(false);
    setChallengeIndex((i) => (i + 1 < challenges.length ? i + 1 : i));
  }, [challenges.length]);

  const correct = challenge.correctVerdict;
  const isCorrect = verdict === correct;
  const color = verdictColor(correct);

  const resolveSource = (id: string) => getSourceById(sources, id);

  return (
    <section className="evidence-detective" aria-label="Evidence Detective">
      <div className="detective-header">
        <h2 className="detective-title">Evidence Detective</h2>
        <p className="detective-subtitle">
          Can you prove it? Evaluate the claim against the archived evidence.
        </p>
        <p className="detective-artifact">
          Artifact: <strong>{artifact.name}</strong> ({artifact.missionName})
        </p>
      </div>

      <div className="detective-progress">
        <span>
          Challenge {challengeIndex + 1} of {challenges.length}
        </span>
      </div>

      <div className="detective-statement">
        <p className="detective-question">
          <span className="detective-claim-icon" aria-hidden="true">
            🔍
          </span>
          {challenge.statement}
        </p>
      </div>

      {!isComplete ? (
        <div className="detective-options" role="radiogroup" aria-label="Select a verdict">
          {Object.entries(challenge.verdictLabels).map(([key, label]) => {
            const v = key as EvidenceVerdict;
            return (
              <button
                key={v}
                type="button"
                className="detective-option"
                onClick={() => selectVerdict(v)}
                role="radio"
                aria-checked="false"
              >
                <span className="detective-option-label">{label}</span>
              </button>
            );
          })}
        </div>
      ) : (
        <>
          <div className={`detective-verdict ${isCorrect ? 'detective-verdict--correct' : 'detective-verdict--wrong'}`}>
            <span className="detective-verdict-icon" aria-hidden="true">
              {isCorrect ? '✓' : '✗'}
            </span>
            <span className="detective-verdict-label">
              Your verdict: <strong>{challenge.verdictLabels[verdict!]}</strong>
            </span>
            {isCorrect ? (
              <span className="detective-verdict-status">Correct!</span>
            ) : (
              <span className="detective-verdict-status detective-verdict-status--wrong">
                The evidence supports:{' '}
                <strong>{challenge.verdictLabels[correct]}</strong>
              </span>
            )}
          </div>

          <div className="detective-explanation">
            <h3 className="detective-explanation-title">
              {isCorrect ? 'Why you are right' : 'Why that is not correct'}
            </h3>
            <p className="detective-explanation-text">
              {challenge.explanation}
            </p>
          </div>

          <div className="detective-sources">
            <h3 className="detective-sources-title">Supporting sources</h3>
            {challenge.sourceIds.length > 0 ? (
              <ul className="detective-source-list">
                {challenge.sourceIds.map((id) => {
                  const source = resolveSource(id);
                  return (
                    <li key={id} className="detective-source-item">
                      <span className="detective-source-mark" aria-hidden="true">
                        ↗
                      </span>
                      {source ? (
                        <>
                          <div>
                            <span className="detective-source-title">
                              {source.title}
                            </span>
                            <small className="detective-source-org">
                              {source.organization}
                            </small>
                          </div>
                          <a
                            href={source.url}
                            target="_blank"
                            rel="noreferrer noopener"
                            className="detective-source-link"
                          >
                            Open NSSDCA record
                          </a>
                          <p className="detective-source-quote">
                            “{source.originalWording.slice(0, 200)}”
                          </p>
                        </>
                      ) : (
                        <span className="detective-source-missing">
                          Source record {id} not found.
                        </span>
                      )}
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="detective-sources-empty">
                No specific sources are linked to this challenge.
              </p>
            )}
          </div>

          <div className="detective-hint">
            {isCorrect ? (
              <p className="detective-hint-text">
                {challenge.hints[correct]}
              </p>
            ) : (
              <p className="detective-hint-text">
                {challenge.hints[verdict!] ??
                  'Review the sources above and try again.'}
              </p>
            )}
          </div>

          <button
            type="button"
            className="detective-next"
            onClick={nextChallenge}
            disabled={challengeIndex >= challenges.length - 1}
          >
            {challengeIndex >= challenges.length - 1
              ? 'All challenges complete'
              : 'Next challenge →'}
          </button>
        </>
      )}

      <div className="detective-disclosure">
        <p className="detective-disclosure-text">
          Every statement, verdict, and explanation is derived from the verified
          NSSDCA archive records for this artifact. No facts are invented.
        </p>
      </div>
    </section>
  );
}
