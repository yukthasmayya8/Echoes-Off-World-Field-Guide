import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'vitest-axe';
import { vi } from 'vitest';
import { MissionDebriefFeature } from '../MissionDebriefFeature';
import { sampleQuiz } from '../../../dev/sampleQuiz';
import type { Quiz } from '../../../types';

const setup = (props: Partial<Parameters<typeof MissionDebriefFeature>[0]> = {}) => {
  const onOpenSource = vi.fn();
  const user = userEvent.setup();
  const utils = render(
    <MissionDebriefFeature quiz={sampleQuiz} onOpenSource={onOpenSource} {...props} />,
  );
  return { user, onOpenSource, ...utils };
};

describe('MissionDebriefFeature – states', () => {
  it('shows an empty state when there is no quiz', () => {
    setup({ quiz: null });
    expect(screen.getByText(/no debrief questions are available/i)).toBeInTheDocument();
  });
  it('announces loading politely', () => {
    setup({ isLoading: true });
    expect(screen.getByRole('status')).toHaveTextContent(/loading/i);
  });
  it('announces errors as alerts', () => {
    setup({ errorMessage: 'Could not load.' });
    expect(screen.getByRole('alert')).toHaveTextContent('Could not load.');
  });
  it('shows the DEMO MODE indicator in text', () => {
    setup({ isDemoMode: true });
    expect(screen.getByText(/DEMO MODE/)).toBeInTheDocument();
  });
});

describe('MissionDebriefFeature – accessibility (axe)', () => {
  it('has no violations: question view', async () => {
    const { container } = setup({ isDemoMode: true });
    expect((await axe(container)).violations).toEqual([]);
  });
  it('has no violations: feedback view', async () => {
    const { container, user } = setup();
    await user.click(screen.getByRole('radio', { name: /^Sojourner/ }));
    await user.click(screen.getByRole('button', { name: /submit answer/i }));
    await screen.findByTestId('debrief-feedback');
    expect((await axe(container)).violations).toEqual([]);
  });
  it('exposes the question as a labelled radio group', () => {
    setup();
    expect(screen.getByRole('group', { name: /which object is the rover/i })).toBeInTheDocument();
    expect(screen.getAllByRole('radio')).toHaveLength(4);
  });
});

describe('MissionDebriefFeature – keyboard and focus', () => {
  it('lets arrow keys move between options', async () => {
    const { user } = setup();
    screen.getAllByRole('radio')[0].focus();
    await user.keyboard('{ArrowDown}');
    expect(screen.getAllByRole('radio')[1]).toBeChecked();
  });
  it('moves focus to the feedback after submitting, then to the next question', async () => {
    const { user } = setup();
    await user.click(screen.getByRole('radio', { name: /^Sojourner/ }));
    await user.click(screen.getByRole('button', { name: /submit answer/i }));
    await waitFor(() => expect(screen.getByTestId('debrief-feedback')).toHaveFocus());
    await user.click(screen.getByRole('button', { name: /next question/i }));
    await waitFor(() =>
      expect(screen.getByRole('heading', { name: /question 2 of 3/i })).toHaveFocus(),
    );
  });
  it('does not steal focus on first render', () => {
    setup();
    expect(document.body).toHaveFocus();
  });
  it('asks for an answer instead of silently disabling submit', async () => {
    const { user } = setup();
    await user.click(screen.getByRole('button', { name: /submit answer/i }));
    expect(screen.getByRole('alert')).toHaveTextContent(/choose an answer/i);
  });
});

describe('MissionDebriefFeature – behaviour', () => {
  it('states correct/incorrect in text, not just colour', async () => {
    const { user } = setup();
    await user.click(screen.getByRole('radio', { name: /Mars Pathfinder lander/ }));
    await user.click(screen.getByRole('button', { name: /submit answer/i }));
    expect(await screen.findByRole('heading', { name: 'Not quite' })).toBeInTheDocument();
    expect(screen.getByText('Your answer')).toBeInTheDocument();
    expect(screen.getByText('Correct answer')).toBeInTheDocument();
  });
  it('opens sources from feedback', async () => {
    const { user, onOpenSource } = setup();
    await user.click(screen.getByRole('radio', { name: /^Sojourner/ }));
    await user.click(screen.getByRole('button', { name: /submit answer/i }));
    await user.click(await screen.findByRole('button', { name: /open source 1/i }));
    expect(onOpenSource).toHaveBeenCalledWith('src-nssdca-sojourner');
  });
  it('completes, reports the score, stores best locally and allows retry', async () => {
    const onComplete = vi.fn();
    const { user } = setup({ onComplete });
    const picks = [/^Sojourner/, /Its physical disposition/, /NSSDCA/];
    for (let i = 0; i < picks.length; i++) {
      await user.click(screen.getByRole('radio', { name: picks[i] }));
      await user.click(screen.getByRole('button', { name: /submit answer/i }));
      await user.click(await screen.findByRole('button', { name: i === 2 ? /see debrief results/i : /next question/i }));
    }
    expect(screen.getByRole('heading', { name: /3 of 3 correct/i })).toBeInTheDocument();
    expect(onComplete).toHaveBeenCalledWith({ score: 3, total: 3 });
    expect(window.localStorage.getItem('echoes:debrief:best:sojourner')).toBe('3');
    await user.click(screen.getByRole('button', { name: /try the debrief again/i }));
    expect(screen.getByRole('heading', { name: /question 1 of 3/i })).toBeInTheDocument();
  });
  it('uses the backend evaluator when provided', async () => {
    const evaluateAnswer = vi.fn().mockResolvedValue({ correct: true, correctOptionIndex: 2, explanation: 'Server says so.' });
    const quiz: Quiz = {
      artifactSlug: 'x',
      questions: [{ id: 'a', question: 'Q?', options: ['A', 'B', 'C'], sourceIds: [] }],
    };
    const { user } = setup({ quiz, evaluateAnswer });
    await user.click(screen.getByRole('radio', { name: 'C' }));
    await user.click(screen.getByRole('button', { name: /submit answer/i }));
    expect(await screen.findByText('Server says so.')).toBeInTheDocument();
    expect(evaluateAnswer).toHaveBeenCalledWith('x', 'a', 2);
  });
  it('shows an understandable error when evaluation fails and allows retry', async () => {
    const evaluateAnswer = vi.fn().mockRejectedValue(new Error('500 stack trace'));
    const { user } = setup({ evaluateAnswer });
    await user.click(screen.getByRole('radio', { name: /^Sojourner/ }));
    await user.click(screen.getByRole('button', { name: /submit answer/i }));
    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent(/could not check that answer/i);
    expect(alert).not.toHaveTextContent(/stack trace/i);
    expect(screen.getByRole('button', { name: /submit answer/i })).toBeEnabled();
  });
  it('resets completely when the artifact changes (no stale state)', async () => {
    const { user, rerender, onOpenSource } = setup();
    await user.click(screen.getByRole('radio', { name: /^Sojourner/ }));
    await user.click(screen.getByRole('button', { name: /submit answer/i }));
    await screen.findByTestId('debrief-feedback');
    const other: Quiz = {
      artifactSlug: 'other',
      artifactName: 'Other',
      questions: [{ id: 'z', question: 'Different?', options: ['Yes', 'No'], sourceIds: [], correctOptionIndex: 0, explanation: 'e' }],
    };
    rerender(<MissionDebriefFeature quiz={other} onOpenSource={onOpenSource} />);
    expect(screen.queryByTestId('debrief-feedback')).not.toBeInTheDocument();
    expect(screen.getByRole('group', { name: 'Different?' })).toBeInTheDocument();
    expect(screen.getByText(/score so far: 0 of 1/i)).toBeInTheDocument();
  });
});
