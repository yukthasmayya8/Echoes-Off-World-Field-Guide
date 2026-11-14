/**
 * Quiz helpers shared by the server evaluator and the offline demo evaluator.
 * Answer keys never leave this module in the public quiz payload.
 */
import type {
  Quiz,
  QuizDefinition,
  QuizOption,
  QuizQuestionDefinition,
} from './types';

export type QuizEvaluationFailureReason = 'QUESTION_NOT_FOUND' | 'OPTION_NOT_FOUND';

export type QuizEvaluationOutcome =
  | {
      ok: true;
      question: QuizQuestionDefinition;
      selectedOption: QuizOption;
      correct: boolean;
      correctOptionId: string;
      explanation: string;
      sourceIds: string[];
    }
  | {
      ok: false;
      reason: QuizEvaluationFailureReason;
      message: string;
    };

/** Strip answer keys and explanations before sending a quiz to a visitor. */
export function toPublicQuiz(definition: QuizDefinition): Quiz {
  return {
    artifactSlug: definition.artifactSlug,
    title: definition.title,
    questions: definition.questions.map((question) => ({
      id: question.id,
      prompt: question.prompt,
      options: question.options.map((option) => ({ ...option })),
      sourceIds: [...question.sourceIds],
    })),
  };
}

export function evaluateQuizOption(
  definition: QuizDefinition,
  optionId: string,
  questionId?: string,
): QuizEvaluationOutcome {
  const question = questionId
    ? definition.questions.find((candidate) => candidate.id === questionId)
    : definition.questions[0];

  if (!question) {
    return {
      ok: false,
      reason: 'QUESTION_NOT_FOUND',
      message: `No question "${questionId ?? ''}" exists in the debrief for "${definition.artifactSlug}".`,
    };
  }

  const selectedOption = question.options.find((option) => option.id === optionId);
  if (!selectedOption) {
    return {
      ok: false,
      reason: 'OPTION_NOT_FOUND',
      message: `Option "${optionId}" is not part of question "${question.id}".`,
    };
  }

  return {
    ok: true,
    question,
    selectedOption,
    correct: selectedOption.id === question.correctOptionId,
    correctOptionId: question.correctOptionId,
    explanation: question.explanation,
    sourceIds: [...question.sourceIds],
  };
}
