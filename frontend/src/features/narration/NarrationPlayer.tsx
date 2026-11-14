/**
 * NarrationPlayer — cinematic story narration UI.
 *
 * Play, pause, resume, stop; adjustable playback speed; voice selection;
 * sentence-level highlighting; synchronized chapters; captions; narration
 * progress; mobile-compatible; no automatic audio playback; graceful fallback
 * when speech synthesis is unavailable.
 *
 * All narration text is educational narration built from reviewed project
 * content. It is clearly distinguished from authentic archive quotations
 * (shown in Scientific Deep Dive mode as original archived wording).
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import type { StoryChapter } from '@echoes/shared';
import { buildNarration, type NarrationMode, type NarrationSentence, type NarrationState } from './narrationEngine';

interface NarrationPlayerProps {
  chapters: StoryChapter[];
  artifactName: string;
  mode?: NarrationMode;
}

const MODE_LABELS: Record<NarrationMode, string> = {
  documentary: 'Documentary',
  'young-explorer': 'Young Explorer',
  'scientific-deep-dive': 'Scientific Deep Dive',
};

const MODE_DESCRIPTIONS: Record<NarrationMode, string> = {
  documentary: 'Cinematic storytelling with pauses and transitions.',
  'young-explorer': 'Simple, friendly language for young explorers.',
  'scientific-deep-dive': 'Detailed engineering and science from archived records.',
};

export function NarrationPlayer({ chapters, artifactName, mode: initialMode = 'documentary' }: NarrationPlayerProps) {
  const [mode, setMode] = useState<NarrationMode>(initialMode);
  const [rate, setRate] = useState(1);
  const [sentences, setSentences] = useState<NarrationSentence[]>(() =>
    buildNarration(chapters, initialMode),
  );
  const [state, setState] = useState<NarrationState>({
    playing: false,
    paused: false,
    currentSentenceIndex: 0,
    totalSentences: sentences.length,
    mode: initialMode,
    error: null,
    supported: typeof window !== 'undefined' && 'speechSynthesis' in window,
  });

  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const currentIndexRef = useRef(0);
  const isInterruptedRef = useRef(false);

  const [voice, setVoice] = useState<SpeechSynthesisVoice | undefined>(undefined);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);

  useEffect(() => {
    setSentences(buildNarration(chapters, mode));
    setState((prev) => ({ ...prev, mode, currentSentenceIndex: 0, totalSentences: sentences.length }));
    stopNarration();
  }, [chapters, mode]);

  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    const loadVoices = () => {
      const available = window.speechSynthesis.getVoices();
      setVoices(available);
      if (!voice && available.length > 0) {
        setVoice(available[0]);
      }
    };

    loadVoices();
    if (typeof window.speechSynthesis.onvoiceschanged !== 'undefined') {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, [voice]);

  const speak = useCallback(
    (text: string) => {
      if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.rate = rate;
      u.voice = voice ?? null;
      u.onend = () => {
        if (!isInterruptedRef.current) {
          advance();
        }
      };
      u.onerror = () => {
        setState((prev) => ({ ...prev, error: 'Speech synthesis error.' }));
        advance();
      };
      utteranceRef.current = u;
      window.speechSynthesis.speak(u);
    },
    [rate, voice],
  );

  const advance = useCallback(() => {
    currentIndexRef.current += 1;
    setState((prev: NarrationState) => ({ ...prev, currentSentenceIndex: currentIndexRef.current }));
    const next = sentences[currentIndexRef.current];
    if (next) {
      speak(next.text);
    } else {
      setState((prev: NarrationState) => ({ ...prev, playing: false, paused: false }));
      utteranceRef.current = null;
    }
  }, [sentences, speak]);

  const startNarration = useCallback(() => {
    if (!state.supported) {
      setState((prev: NarrationState) => ({ ...prev, error: 'Speech synthesis is not available in this browser.' }));
      return;
    }
    isInterruptedRef.current = false;
    if (currentIndexRef.current >= sentences.length) {
      currentIndexRef.current = 0;
    }
    setState((prev: NarrationState) => ({ ...prev, playing: true, paused: false, error: null }));
    const current = sentences[currentIndexRef.current];
    if (current) {
      speak(current.text);
    }
  }, [sentences, state.supported, speak]);

  const pauseNarration = useCallback(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    window.speechSynthesis.pause();
    setState((prev: NarrationState) => ({ ...prev, paused: true, playing: false }));
  }, []);

  const resumeNarration = useCallback(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    window.speechSynthesis.resume();
    setState((prev: NarrationState) => ({ ...prev, paused: false, playing: true }));
  }, []);

  const stopNarration = useCallback(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    isInterruptedRef.current = true;
    window.speechSynthesis.cancel();
    currentIndexRef.current = 0;
    setState((prev: NarrationState) => ({ ...prev, playing: false, paused: false, currentSentenceIndex: 0 }));
    utteranceRef.current = null;
  }, []);

  const handleSkip = useCallback((index: number) => {
    stopNarration();
    currentIndexRef.current = index;
    setState((prev: NarrationState) => ({ ...prev, currentSentenceIndex: index, playing: true, paused: false, error: null }));
    const target = sentences[index];
    if (target) {
      speak(target.text);
    }
  }, [sentences, stopNarration, speak]);

  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const currentSentence = sentences[currentIndexRef.current];
  const progress = sentences.length ? (currentIndexRef.current / sentences.length) * 100 : 0;

  const progressPercent = Math.min(100, Math.max(0, progress));

  return (
    <section className="narration-player" aria-label="Story narration">
      <div className="narration-header">
        <h2 className="narration-title">Narrated Story: {artifactName}</h2>
        <p className="narration-subtitle">{MODE_DESCRIPTIONS[mode]}</p>
      </div>

      {!state.supported && (
        <div className="narration-fallback">
          <p>
            Speech synthesis is not available in this browser. You can still read
            the full story below in captions mode.
          </p>
        </div>
      )}

      {state.error && (
        <div className="narration-error" role="alert">
          {state.error}
        </div>
      )}

      <div className="narration-controls">
        <select
          className="narration-select"
          value={mode}
          onChange={(e) => setMode(e.target as unknown as NarrationMode)}
          aria-label="Narration style"
        >
          {Object.entries(MODE_LABELS).map(([key, label]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </select>

        <button
          type="button"
          className={`narration-button narration-button--${state.playing ? 'pause' : 'play'}`}
          onClick={state.playing ? pauseNarration : startNarration}
          disabled={!state.supported}
          aria-pressed={state.playing}
        >
          {state.paused ? 'Resume' : state.playing ? 'Pause' : 'Play'}
        </button>

        <button type="button" className="narration-button narration-button--stop" onClick={stopNarration} disabled={!state.supported}>
          Stop
        </button>

        <label className="narration-speed">
          Speed
          <input
            type="range"
            min="0.5"
            max="2"
            step="0.1"
            value={rate}
            onChange={(e) => setRate(parseFloat(e.target.value))}
            aria-label="Playback speed"
          />
          <span className="narration-speed-value">{rate}</span>
        </label>

        <label className="narration-voice">
          Voice
          <select
            className="narration-select"
            value={voice?.name ?? 'default'}
            onChange={(e) => {
              const selected = voices.find((v) => v.name === e.target.value) ?? undefined;
              setVoice(selected);
            }}
            disabled={voices.length === 0 || !state.supported}
            aria-label="Voice selection"
          >
            <option value="default">Default voice</option>
            {voices.map((v) => (
              <option key={v.voiceURI} value={v.name}>
                {v.name} ({v.lang})
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="narration-progress">
        <div className="narration-progress-label">
          <span>Narration progress</span>
          <span>{currentIndexRef.current + 1} of {sentences.length}</span>
        </div>
        <progress
          className="narration-progress-bar"
          value={currentIndexRef.current + 1}
          max={sentences.length}
          aria-valuenow={currentIndexRef.current + 1}
          aria-valuemin={1}
          aria-valuemax={sentences.length}
          aria-label="Narration progress"
        />
      </div>

      <div className="narration-captions" aria-live="polite">
        {sentences.map((sentence, index) => {
          const isCurrent = index === currentIndexRef.current;
          const isArchive = sentence.isArchiveQuote;
          return (
            <div
              key={sentence.id}
              className={`narration-sentence ${
                isCurrent ? 'narration-sentence--current' : ''
              } ${isArchive ? 'narration-sentence--archive' : ''}`}
              role={isCurrent ? 'heading' : undefined}
              aria-level={isCurrent ? 3 : undefined}
              aria-live="off"
            >
              <span className="narration-sentence-number">{index + 1}</span>
              <span className="narration-sentence-text">{sentence.text}</span>
              {isArchive && (
                <span className="narration-archive-tag">Archived record wording</span>
              )}
              {!isCurrent && sentence.sourceRef && isArchive ? (
                <button
                  type="button"
                  className="narration-jump-button"
                  onClick={() => handleSkip(index)}
                  aria-label={`Jump to sentence ${index + 1}: ${sentence.text.slice(0, 40)}`}
                >
                  Read this part
                </button>
              ) : null}
            </div>
          );
        })}
      </div>

      <div className="narration-disclosure">
        <p className="narration-disclosure-text">
          All narration is original educational narration written for this
          project. It is not a historical recording, and no astronaut dialogue,
          radio transmissions, or archived quotations are synthesized as audio.
          Authentic archive wording appears only as text in Scientific Deep Dive
          mode and is labeled accordingly.
        </p>
      </div>
    </section>
  );
}
