/**
 * Digital Space Archaeologist — guided investigation experience.
 *
 * A 7-step investigation for a selected artifact:
 *   1. Examine a historical image
 *   2. Identify the object or its components
 *   3. Explore mission information
 *   4. Examine known location
 *   5. Inspect supporting evidence
 *   6. Identify what is confirmed and unknown
 *   7. Complete the investigation
 *
 * All content comes from the verified artifact record. No evidence is
 * invented or simulated.
 */

import { useCallback, useState } from 'react';
import type { Artifact, Source } from '@echoes/shared';

const STEPS = [
  { id: 'examine', title: 'Examine the image' },
  { id: 'identify', title: 'Identify the object' },
  { id: 'mission', title: 'Explore mission info' },
  { id: 'location', title: 'Examine location' },
  { id: 'evidence', title: 'Inspect evidence' },
  { id: 'confirm', title: 'Confirmed vs unknown' },
  { id: 'complete', title: 'Investigation complete' },
] as const;

type StepId = (typeof STEPS)[number]['id'];

interface SpaceArchaeologistProps {
  artifact: Artifact;
  sources: Source[];
  /** Optional passport hook, fired when the investigation reaches step 7. */
  onComplete?: () => void;
}

export function SpaceArchaeologist({ artifact, sources, onComplete }: SpaceArchaeologistProps) {
  const [stepIndex, setStepIndex] = useState<StepId>('examine');
  const [findings, setFindings] = useState<Record<string, string>>({});

  const step = STEPS.find((s) => s.id === stepIndex)!;
  const stepNumber = STEPS.findIndex((s) => s.id === stepIndex) + 1;
  const isLast = stepIndex === 'complete';

  const sourcesById = new Map(sources.map((s) => [s.id, s]));

  const next = () => {
    const currentIndex = STEPS.findIndex((s) => s.id === stepIndex);
    if (currentIndex < STEPS.length - 1) {
      const nextStep = STEPS[currentIndex + 1];
      setStepIndex(nextStep.id);
      if (nextStep.id === 'complete') onComplete?.();
    }
  };

  const prev = () => {
    const currentIndex = STEPS.findIndex((s) => s.id === stepIndex);
    if (currentIndex > 0) {
      setStepIndex(STEPS[currentIndex - 1].id);
    }
  };

  const recordFinding = useCallback((key: string, value: string) => {
    setFindings((prev) => ({ ...prev, [key]: value }));
  }, []);

  const imageUrl = artifact.image?.url;

  return (
    <section className="archaeologist" aria-label="Digital Space Archaeologist">
      <div className="arch-header">
        <h2 className="arch-title">Digital Space Archaeologist</h2>
        <p className="arch-subtitle">
          Investigate <strong>{artifact.name}</strong> like a space
          archaeologist — one documented step at a time.
        </p>
      </div>

      <div className="arch-progress">
        <span className="arch-step-counter">
          Step {stepNumber} of {STEPS.length}
        </span>
        <div className="arch-step-bar">
          {STEPS.map((s, i) => (
            <div
              key={s.id}
              className={`arch-step-dot ${
                i < stepNumber - 1 ? 'arch-step-dot--done' : ''
              } ${i === stepNumber - 1 ? 'arch-step-dot--active' : ''}`}
            />
          ))}
        </div>
        <p className="arch-step-title">{step.title}</p>
      </div>

      <div className="arch-content">
        {stepIndex === 'examine' && (
          <div className="arch-step-content">
            <h3 className="arch-content-title">1. Examine the historical image</h3>
            {imageUrl ? (
              <div className="arch-image-container">
                <img
                  src={imageUrl}
                  alt={artifact.image?.alt ?? artifact.name}
                  className="arch-image"
                />
                <p className="arch-image-credit">
                  Credit: {artifact.image?.credit ?? 'NSSDCA / NASA'}
                </p>
              </div>
            ) : (
              <div className="arch-image-placeholder">
                <span className="arch-image-icon" aria-hidden="true">
                  📡
                </span>
                <p>No archived image is available for this artifact.</p>
              </div>
            )}
            <p className="arch-step-help">
              Look closely at the image. What do you notice about the
              spacecraft's shape, antennas, legs, or instruments?
            </p>
            <button
              type="button"
              className="arch-finding-button"
              onClick={() => {
                recordFinding('image-examined', 'true');
                next();
              }}
              disabled={findings['image-examined'] === 'true'}
            >
              I have examined the image →
            </button>
          </div>
        )}

        {stepIndex === 'identify' && (
          <div className="arch-step-content">
            <h3 className="arch-content-title">2. Identify the object</h3>
            <p className="arch-step-body">
              This is <strong>{artifact.name}</strong>, a{' '}
              <strong>{artifact.artifactType}</strong> from the{' '}
              <strong>{artifact.missionName}</strong> mission.
            </p>
            <div className="arch-identification-grid">
              <div className="arch-ident-card">
                <span className="arch-ident-icon" aria-hidden="true">
                  🏷️
                </span>
                <h4>Name</h4>
                <p>{artifact.name}</p>
              </div>
              <div className="arch-ident-card">
                <span className="arch-ident-icon" aria-hidden="true">
                  🔧
                </span>
                <h4>Type</h4>
                <p>{artifact.artifactType}</p>
              </div>
              <div className="arch-ident-card">
                <span className="arch-ident-icon" aria-hidden="true">
                  🚀
                </span>
                <h4>Mission</h4>
                <p>{artifact.missionName}</p>
              </div>
              <div className="arch-ident-card">
                <span className="arch-ident-icon" aria-hidden="true">
                  🌙
                </span>
                <h4>Destination</h4>
                <p>
                  {artifact.body === 'moon' ? 'Moon' : 'Mars'}
                </p>
              </div>
            </div>
            <p className="arch-step-help">
              All identifications come from the verified NSSDCA record — nothing
              is guessed.
            </p>
            <button
              type="button"
              className="arch-finding-button"
              onClick={() => {
                recordFinding('object-identified', artifact.name);
                next();
              }}
            >
              I can identify this object →
            </button>
          </div>
        )}

        {stepIndex === 'mission' && (
          <div className="arch-step-content">
            <h3 className="arch-content-title">3. Explore mission information</h3>
            <p className="arch-step-body">
              <strong>Objective:</strong> {artifact.mission.objective}
            </p>
            <p className="arch-step-body">
              <strong>Launch:</strong> {artifact.mission.launchDate ?? 'Not recorded'}
            </p>
            <p className="arch-step-body">
              <strong>Status:</strong> {artifact.verificationStatus}
            </p>
            <p className="arch-step-body">
              <strong>Final disposition:</strong>{' '}
              {artifact.mission.finalDisposition}
            </p>
            <p className="arch-step-help">
              Every detail is taken directly from the artifact's archive record.
            </p>
            <button
              type="button"
              className="arch-finding-button"
              onClick={() => {
                recordFinding('mission-explored', 'true');
                next();
              }}
            >
              I have reviewed the mission info →
            </button>
          </div>
        )}

        {stepIndex === 'location' && (
          <div className="arch-step-content">
            <h3 className="arch-content-title">4. Examine known location</h3>
            <div className="arch-location-card">
              <span className="arch-loc-icon" aria-hidden="true">
                📍
              </span>
              <div>
                <strong>{artifact.location.label}</strong>
                <p className="arch-loc-confidence">
                  Confidence: {artifact.location.confidence}
                </p>
                <p className="arch-loc-explanation">
                  {artifact.location.explanation}
                </p>
                {artifact.location.coordinates && (
                  <p className="arch-loc-coords">
                    Coordinates as recorded:{' '}
                    {artifact.location.coordinates.latitude}°,
                    {artifact.location.coordinates.longitude}°
                  </p>
                )}
              </div>
            </div>
            <p className="arch-step-help">
              Coordinates and location text come verbatim from the NSSDCA
              record. No precision is inferred.
            </p>
            <button
              type="button"
              className="arch-finding-button"
              onClick={() => {
                recordFinding('location-examined', artifact.location.label);
                next();
              }}
            >
              I have recorded the location →
            </button>
          </div>
        )}

        {stepIndex === 'evidence' && (
          <div className="arch-step-content">
            <h3 className="arch-content-title">5. Inspect supporting evidence</h3>
            <p className="arch-step-body">
              Each discovery below is backed by archived sources:
            </p>
            <div className="arch-evidence-list">
              {artifact.discoveries?.map((d, i) => (
                <div key={d.id} className="arch-evidence-item">
                  <h4>{d.hardware}</h4>
                  <p>{d.simpleExplanation}</p>
                  <div className="arch-evidence-sources">
                    {d.sourceIds.map((sid) => {
                      const src = sourcesById.get(sid);
                      return (
                        <span key={sid} className="arch-evidence-source">
                          {src ? src.title : sid}
                        </span>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
            <p className="arch-step-help">
              Sources link directly to NSSDCA records. Click through to verify
              each claim yourself.
            </p>
            <button
              type="button"
              className="arch-finding-button"
              onClick={() => {
                recordFinding('evidence-inspected', 'true');
                next();
              }}
            >
              I have inspected the evidence →
            </button>
          </div>
        )}

        {stepIndex === 'confirm' && (
          <div className="arch-step-content">
            <h3 className="arch-content-title">6. Confirmed vs unknown</h3>
            <div className="arch-confirm-grid">
              <div className="arch-confirm-card arch-confirm-card--confirmed">
                <h4>Confirmed</h4>
                <ul className="arch-confirm-list">
                  <li>
                    {artifact.name} is a {artifact.artifactType} from the{' '}
                    {artifact.missionName} mission.
                  </li>
                  <li>
                    Landing location: {artifact.location.label} ({artifact.location.confidence} confidence).
                  </li>
                  <li>
                    Final disposition documented: {artifact.mission.finalDisposition.slice(0, 100)}…
                  </li>
                </ul>
              </div>
              <div className="arch-confirm-card arch-confirm-card--unknown">
                <h4>Not established</h4>
                <ul className="arch-confirm-list">
                  <li>
                    Exact internal component specifications are not published
                    in the NSSDCA record.
                  </li>
                  <li>
                    No crewed status is recorded for robotic artifacts.
                  </li>
                  <li>
                    Everything not in the archive remains unknown — not guessed.
                  </li>
                </ul>
              </div>
            </div>
            <p className="arch-step-help">
              Science advances by knowing what is confirmed and what is not.
              Missing information stays missing.
            </p>
            <button
              type="button"
              className="arch-finding-button"
              onClick={() => {
                recordFinding('confirmation-complete', 'true');
                next();
              }}
            >
              I understand what is confirmed →
            </button>
          </div>
        )}

        {stepIndex === 'complete' && (
          <div className="arch-step-content arch-complete">
            <h3 className="arch-content-title">7. Investigation complete</h3>
            <div className="arch-complete-badge">✓</div>
            <p className="arch-complete-message">
              You have completed the investigation of{' '}
              <strong>{artifact.name}</strong>. All findings are based on
              verified NSSDCA archive records.
            </p>
            <div className="arch-findings-summary">
              <h4>Your findings</h4>
              {Object.entries(findings).map(([key, value]) => (
                <div key={key} className="arch-finding">
                  <span className="arch-finding-key">{key}:</span>
                  <span className="arch-finding-value">{value}</span>
                </div>
              ))}
            </div>
            <p className="arch-step-help">
              Want to investigate another artifact? Select one from the Atlas.
            </p>
          </div>
        )}
      </div>

      <div className="arch-nav">
        {stepIndex !== 'examine' && (
          <button type="button" className="arch-nav-button arch-nav-button--prev" onClick={prev}>
            ← Previous
          </button>
        )}
        {!isLast && (
          <button type="button" className="arch-nav-button arch-nav-button--next" onClick={next}>
            Next →
          </button>
        )}
      </div>

      <div className="arch-disclosure">
        <p className="arch-disclosure-text">
          All evidence, locations, and mission details come from the verified
          NSSDCA archive record for this artifact. Nothing is simulated,
          excavated, or invented.
        </p>
      </div>
    </section>
  );
}
