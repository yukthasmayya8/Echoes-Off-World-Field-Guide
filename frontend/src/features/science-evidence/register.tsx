/**
 * Science evidence and mission debrief registrations.
 *
 * One folder, two keys: the evidence reveal panel and the artifact quiz.
 * Answer evaluation always goes through the parent-owned service, so the
 * correct answer never ships to the client.
 */
import { useCallback, useMemo } from 'react';
import { artifactService } from '../../services/artifactService';
import { MissionDebriefFeature } from './MissionDebriefFeature';
import { ScienceEvidenceFeature } from './ScienceEvidenceFeature';
import { defineFeature } from '../integration/featureTypes';
import type {
  MissionDebriefFeatureProps,
  ScienceEvidenceFeatureProps,
} from '../integration/featureTypes';
import {
  correctOptionIndexFor,
  openSharedSource,
  toLegacyArtifact,
  toLegacyQuiz,
} from '../integration/legacyAdapters';

function EvidenceRevealFeature({ artifact, onOpenSource }: ScienceEvidenceFeatureProps) {
  return (
    <ScienceEvidenceFeature
      artifact={toLegacyArtifact(artifact)}
      onOpenSource={(sourceId) => openSharedSource(artifact, sourceId, onOpenSource)}
    />
  );
}

function MissionDebriefAdapter({ quiz, artifact, onOpenSource }: MissionDebriefFeatureProps) {
  const legacyQuiz = useMemo(() => toLegacyQuiz(quiz), [quiz]);

  const evaluateAnswer = useCallback(
    async (artifactSlug: string, questionId: string, optionIndex: number) => {
      const question = quiz.questions.find((candidate) => candidate.id === questionId);
      const option = question?.options[optionIndex];
      if (!question || !option) {
        throw new Error('That answer is not part of this debrief.');
      }

      const result = await artifactService.submitQuizAnswer(
        artifactSlug,
        option.id,
        questionId,
      );

      return {
        correct: result.data.correct,
        correctOptionIndex: correctOptionIndexFor(question, result.data.correctOptionId),
        explanation: result.data.explanation,
      };
    },
    [quiz],
  );

  return (
    <MissionDebriefFeature
      quiz={legacyQuiz}
      onOpenSource={(sourceId) => openSharedSource(artifact, sourceId, onOpenSource)}
      evaluateAnswer={evaluateAnswer}
    />
  );
}

export default [
  defineFeature({ key: 'scienceEvidence', component: EvidenceRevealFeature }),
  defineFeature({ key: 'missionDebrief', component: MissionDebriefAdapter }),
];
