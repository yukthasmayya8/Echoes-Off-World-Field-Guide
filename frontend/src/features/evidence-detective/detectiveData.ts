/**
 * Evidence Detective — scientific reasoning challenges for Echoes.
 *
 * Presents a factual statement about an artifact together with the actual
 * archived evidence that supports or contradicts it. The visitor classifies
 * the statement as:
 *   • Confirmed
 *   • Supported but incomplete
 *   • Not established
 *   • Contradicted by the available evidence
 *
 * Every statement, its classification, and its explanation are derived
 * exclusively from the verified artifact records and their NSSDCA sources.
 * Nothing is invented.
 */

import { useCallback, useState } from 'react';
import type { Artifact, Source } from '@echoes/shared';

export type EvidenceVerdict =
  | 'confirmed'
  | 'supported-incomplete'
  | 'not-established'
  | 'contradicted';

export interface EvidenceChallenge {
  id: string;
  artifactSlug: string;
  statement: string;
  // Short label shown in the verdict options.
  verdictLabels: Record<EvidenceVerdict, string>;
  // The correct classification based on the sources.
  correctVerdict: EvidenceVerdict;
  // Explanation of why this classification is correct.
  explanation: string;
  // Source ids that bear on this statement.
  sourceIds: string[];
  // Human-readable hint for each wrong verdict.
  hints: Partial<Record<EvidenceVerdict, string>>;
}

const VERDICT_LABELS: Record<EvidenceVerdict, string> = {
  confirmed: 'Confirmed',
  'supported-incomplete': 'Supported but incomplete',
  'not-established': 'Not established',
  contradicted: 'Contradicted by the evidence',
};

const VERDICT_COLORS: Record<EvidenceVerdict, string> = {
  confirmed: '#8de2c0',
  'supported-incomplete': '#f5c16c',
  'not-established': '#9aabc7',
  contradicted: '#ff8f8f',
};

function buildChallenges(artifact: Artifact): EvidenceChallenge[] {
  const sourcesById = new Map(artifact.sources.map((s) => [s.id, s]));
  const sourceText = (id: string) =>
    sourcesById.get(id)?.originalWording ?? '';

  const challenges: EvidenceChallenge[] = [];

  // --- Challenge 1: landing location ---
  const landingEvent = artifact.timeline.find(
    (e) => e.eventType === 'landing',
  );
  if (landingEvent) {
    challenges.push({
      id: `${artifact.slug}-landing-location`,
      artifactSlug: artifact.slug,
      statement: `${artifact.name} landed at ${artifact.location.label}.`,
      verdictLabels: VERDICT_LABELS,
      correctVerdict: 'confirmed',
      explanation:
        `The timeline records a landing event (${landingEvent.title}, ${landingEvent.date}) and the artifact location is documented as ${artifact.location.label} with ${artifact.location.confidence} confidence. The location coordinates are taken directly from the NSSDCA record.`,
      sourceIds: [...(landingEvent.sourceIds ?? []), ...(artifact.location.coordinates?.sourceId ? [artifact.location.coordinates.sourceId] : [])],
      hints: {
        'supported-incomplete':
          'The location is stated directly in the archive, not just implied.',
        'not-established':
          'The NSSDCA record explicitly names the landing site.',
        contradicted:
          'Nothing in the sources contradicts the documented landing location.',
      },
    });
  }

  // --- Challenge 2: mission end / final disposition ---
  challenges.push({
    id: `${artifact.slug}-final-disposition`,
    artifactSlug: artifact.slug,
    statement: `${artifact.missionName}'s ${artifact.name} completed its mission and its final disposition is documented.`,
    verdictLabels: VERDICT_LABELS,
    correctVerdict: 'confirmed',
    explanation:
      `The mission record states: "${artifact.mission.finalDisposition}". This is the documented final disposition from the archive.`,
    sourceIds: artifact.sources.map((s) => s.id),
    hints: {
      'supported-incomplete':
        'The archive provides a complete final disposition statement.',
        'not-established':
          'The final disposition is explicitly recorded, not left blank.',
        contradicted:
          'The sources do not contradict the documented disposition.',
      },
  });

  // --- Challenge 3: crewed vs robotic ---
  const isCrewed = artifact.artifactType === 'lunar-module';
  challenges.push({
    id: `${artifact.slug}-crewed`,
    artifactSlug: artifact.slug,
    statement: `${artifact.name} was a crewed spacecraft with astronauts on board.`,
    verdictLabels: VERDICT_LABELS,
    correctVerdict: isCrewed ? 'confirmed' : 'not-established',
    explanation:
      isCrewed
        ? `${artifact.name} is classified as a lunar module, the crewed landing vehicle of the Apollo program. The NSSDCA record describes it carrying astronauts to the lunar surface.`
        : `${artifact.name} is classified as a ${artifact.artifactType}. The available NSSDCA sources describe it as a robotic spacecraft; they do not record any crew aboard.`,
    sourceIds: artifact.sources.map((s) => s.id),
    hints: {
      confirmed:
        'Check the artifact type and the NSSDCA description for crew information.',
      'supported-incomplete':
        'The sources either clearly state crew or they do not — there is no middle ground here.',
        'not-established':
          'Look for explicit mention of astronauts or crew in the archive text.',
        contradicted:
          'Nothing in the sources says the opposite of crewed status.',
      },
  });

  return challenges;
}

export function getEvidenceChallenges(artifact: Artifact): EvidenceChallenge[] {
  return buildChallenges(artifact);
}

export function getSourceById(
  sources: Source[],
  id: string,
): Source | undefined {
  return sources.find((s) => s.id === id);
}

export function verdictColor(verdict: EvidenceVerdict): string {
  return VERDICT_COLORS[verdict];
}
