import { useEffect, useId, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import type {
  AnswerResult,
  MissionDebriefFeatureProps,
  Quiz,
  QuizQuestion,
} from '../legacyTypes';
import { readBestScore, saveBestScore } from './debriefStorage';
import styles from './MissionDebriefFeature.module.css';

type FocusTarget = 'question' | 'feedback' | 'summary';

export function MissionDebriefFeature(props: MissionDebriefFeatureProps) {
  const { quiz, isLoading, errorMessage } = props;

  if (isLoading) {
    return (
      <section className={styles.root} aria-label="Mission debrief" aria-busy="true">
        <p role="status" className={styles.state}>
          Loading the mission debrief…
        </p>
      </section>
    );
  }
  if (errorMessage) {
    return (
      <section className={styles.root} aria-label="Mission debrief">
        <p role="alert" className={styles.state}>
          {errorMessage}
        </p>
      </section>
    );
  }
  if (!quiz || quiz.questions.length === 0) {
    return (
      <section className={styles.root} aria-label="Mission debrief">
        <h2 className={styles.title}>Mission debrief</h2>
        <p className={styles.state}>
          No debrief questions are available for this artifact yet. Pick another
          artifact in the Atlas, or come back later.
        </p>
      </section>
    );
  }
  // key = artifact slug: switching artifacts always starts a fresh session,
  // so no stale question, answer or score can survive the switch.
  return <DebriefSession key={quiz.artifactSlug} {...props} quiz={quiz} />;
}

interface SessionProps extends MissionDebriefFeatureProps {
  quiz: Quiz;
}

function DebriefSession({
  quiz,
  onOpenSource,
  evaluateAnswer,
  isDemoMode,
  onComplete,
}: SessionProps) {
  const total = quiz.questions.length;
  const uid = useId();

  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [result, setResult] = useState<AnswerResult | null>(null);
  const [score, setScore] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [finished, setFinished] = useState(false);
  const [best, setBest] = useState<number | null>(() => readBestScore(quiz.artifactSlug));

  const questionRef = useRef<HTMLHeadingElement>(null);
  const feedbackRef = useRef<HTMLDivElement>(null);
  const summaryRef = useRef<HTMLHeadingElement>(null);
  const focusTarget = useRef<FocusTarget | null>(null);

  // Move focus only after a user action (never on first mount).
  useEffect(() => {
    const target = focusTarget.current;
    if (!target) return;
    focusTarget.current = null;
    const el =
      target === 'question'
        ? questionRef.current
        : target === 'feedback'
          ? feedbackRef.current
          : summaryRef.current;
    el?.focus();
  });

  const question: QuizQuestion = quiz.questions[index];
  const groupName = `${uid}-q-${question.id}`;

  async function evaluate(q: QuizQuestion, optionIndex: number): Promise<AnswerResult> {
    if (evaluateAnswer) return evaluateAnswer(quiz.artifactSlug, q.id, optionIndex);
    if (typeof q.correctOptionIndex === 'number' && q.explanation) {
      return {
        correct: optionIndex === q.correctOptionIndex,
        correctOptionIndex: q.correctOptionIndex,
        explanation: q.explanation,
      };
    }
    throw new Error('No answer evaluator available');
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (submitting || result) return;
    if (selected === null) {
      setMessage('Choose an answer before you submit.');
      return;
    }
    setSubmitting(true);
    setMessage(null);
    try {
      const r = await evaluate(question, selected);
      if (r.correct) setScore((s) => s + 1);
      focusTarget.current = 'feedback';
      setResult(r);
    } catch {
      setMessage('We could not check that answer. Check your connection and submit again.');
    } finally {
      setSubmitting(false);
    }
  }

  function handleNext() {
    if (index + 1 >= total) {
      setBest(saveBestScore(quiz.artifactSlug, score));
      focusTarget.current = 'summary';
      setFinished(true);
      onComplete?.({ score, total });
      return;
    }
    focusTarget.current = 'question';
    setIndex((i) => i + 1);
    setSelected(null);
    setResult(null);
    setMessage(null);
  }

  function handleRetry() {
    focusTarget.current = 'question';
    setIndex(0);
    setSelected(null);
    setResult(null);
    setScore(0);
    setMessage(null);
    setFinished(false);
  }

  const titleId = `${uid}-title`;

  return (
    <section className={styles.root} aria-labelledby={titleId}>
      <header className={styles.header}>
        <h2 id={titleId} className={styles.title}>
          Mission debrief{quiz.artifactName ? `: ${quiz.artifactName}` : ''}
        </h2>
        {isDemoMode && (
          <p className={styles.demo}>
            DEMO MODE – using local fallback data, not the live backend.
          </p>
        )}
      </header>

      {finished ? (
        <div className={styles.summary}>
          <h3 ref={summaryRef} tabIndex={-1} className={styles.summaryTitle}>
            Debrief complete: {score} of {total} correct
          </h3>
          {best !== null && (
            <p className={styles.muted}>
              Best on this device: {best} of {total}.
            </p>
          )}
          <p className={styles.muted}>
            Open the Evidence section to review the sources behind each answer.
          </p>
          <div className={styles.actions}>
            <button type="button" className={styles.primary} onClick={handleRetry}>
              Try the debrief again
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} noValidate className={styles.form}>
          <h3 ref={questionRef} tabIndex={-1} className={styles.step}>
            Question {index + 1} of {total}
          </h3>
          <progress
            className={styles.progress}
            value={index + (result ? 1 : 0)}
            max={total}
            aria-label="Debrief progress"
          />
          <p className={styles.muted}>
            Score so far: {score} of {total}
          </p>

          <fieldset className={styles.fieldset}>
            <legend className={styles.legend}>{question.question}</legend>
            <div className={styles.options}>
              {question.options.map((option, i) => {
                const isSelected = selected === i;
                const isCorrect = result !== null && i === result.correctOptionIndex;
                const isWrongPick = result !== null && isSelected && !result.correct;
                const cls = [
                  styles.option,
                  isCorrect ? styles.optionCorrect : '',
                  isWrongPick ? styles.optionIncorrect : '',
                ].join(' ');
                return (
                  <label key={i} className={cls}>
                    <input
                      type="radio"
                      name={groupName}
                      value={i}
                      checked={isSelected}
                      onChange={() => {
                        setSelected(i);
                        setMessage(null);
                      }}
                      disabled={result !== null || submitting}
                    />
                    <span className={styles.optionText}>{option}</span>
                    {isCorrect && (
                      <span className={styles.tag}>
                        {isSelected ? 'Your answer · Correct answer' : 'Correct answer'}
                      </span>
                    )}
                    {isWrongPick && <span className={styles.tag}>Your answer</span>}
                  </label>
                );
              })}
            </div>
          </fieldset>

          {message && (
            <p role="alert" className={styles.error}>
              {message}
            </p>
          )}

          {!result && (
            <div className={styles.actions}>
              <button type="submit" className={styles.primary} disabled={submitting}>
                {submitting ? 'Checking…' : 'Submit answer'}
              </button>
            </div>
          )}

          {result && (
            <div
              ref={feedbackRef}
              tabIndex={-1}
              role="group"
              aria-labelledby={`${uid}-fb`}
              data-testid="debrief-feedback"
              className={`${styles.feedback} ${result.correct ? styles.feedbackCorrect : styles.feedbackIncorrect}`}
            >
              <h4 id={`${uid}-fb`} className={styles.feedbackTitle}>
                {result.correct ? 'Correct' : 'Not quite'}
              </h4>
              {!result.correct && (
                <p>
                  The correct answer is: <strong>{question.options[result.correctOptionIndex]}</strong>
                </p>
              )}
              <p>{result.explanation}</p>
              {question.sourceIds.length > 0 && (
                <ul className={styles.sources} aria-label="Sources for this answer">
                  {question.sourceIds.map((sid, n) => (
                    <li key={sid}>
                      <button
                        type="button"
                        className={styles.secondary}
                        onClick={() => onOpenSource(sid)}
                        aria-label={`Open source ${n + 1} for this answer (${sid})`}
                      >
                        View source {n + 1}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              <div className={styles.actions}>
                <button type="button" className={styles.primary} onClick={handleNext}>
                  {index + 1 >= total ? 'See debrief results' : 'Next question'}
                </button>
              </div>
            </div>
          )}
        </form>
      )}
    </section>
  );
}
