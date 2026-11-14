import { useState } from 'react';
import { MissionDebriefFeature } from './MissionDebriefFeature';
import { sampleQuiz } from '../../dev/sampleQuiz';

/** Standalone harness. In the real app the parent (Member 1) passes the quiz via props. */
export function DebriefPreview() {
  const [state, setState] = useState<'quiz' | 'empty' | 'loading' | 'error'>('quiz');
  const [lastSource, setLastSource] = useState<string | null>(null);

  return (
    <main style={{ padding: '1rem', background: '#050b1c', minHeight: '100vh' }}>
      <label style={{ color: '#eef2fb', display: 'block', marginBottom: '1rem' }}>
        Preview state{' '}
        <select value={state} onChange={(e) => setState(e.target.value as typeof state)}>
          <option value="quiz">Quiz loaded</option>
          <option value="empty">No quiz</option>
          <option value="loading">Loading</option>
          <option value="error">Error</option>
        </select>
      </label>
      <MissionDebriefFeature
        quiz={state === 'quiz' ? sampleQuiz : null}
        isLoading={state === 'loading'}
        errorMessage={state === 'error' ? 'The debrief could not be loaded. Try again in a moment.' : null}
        isDemoMode
        onOpenSource={setLastSource}
      />
      {lastSource && (
        <p style={{ color: '#bcc7e0', textAlign: 'center' }}>Source drawer would open: {lastSource}</p>
      )}
    </main>
  );
}
