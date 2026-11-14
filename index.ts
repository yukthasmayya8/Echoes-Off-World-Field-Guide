/**
 * Debrief-related contracts.
 * MEMBER 1: merge these into the shared types file. Only the optional props
 * on MissionDebriefFeatureProps go beyond the agreed contract
 * ({ quiz, onOpenSource }) and need your approval.
 */

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  sourceIds: string[];
  /**
   * Present ONLY in local fallback / demo mode. The backend must not send
   * these in the public question response (answers are evaluated server-side).
   */
  correctOptionIndex?: number;
  explanation?: string;
}

export interface Quiz {
  artifactSlug: string;
  artifactName?: string;
  questions: QuizQuestion[];
}

/** Response of POST /api/v1/quizzes/:artifactSlug/answer */
export interface AnswerResult {
  correct: boolean;
  correctOptionIndex: number;
  explanation: string;
}

/** Provided by the parent app (wraps quizService). Features never fetch on their own. */
export type EvaluateAnswer = (
  artifactSlug: string,
  questionId: string,
  optionIndex: number,
) => Promise<AnswerResult>;

export interface MissionDebriefFeatureProps {
  quiz: Quiz | null;
  onOpenSource: (sourceId: string) => void;
  /** Optional: backend evaluation. If omitted, demo-mode data on the question is used. */
  evaluateAnswer?: EvaluateAnswer;
  /** Show the visible DEMO MODE indicator (local fallback data). */
  isDemoMode?: boolean;
  isLoading?: boolean;
  errorMessage?: string | null;
  onComplete?: (result: { score: number; total: number }) => void;
}
