/**
 * Discovery Passport persistence.
 *
 * Only anonymous learning progress is stored (artifact slugs and a timestamp).
 * No account, name, email or device identifier is collected. The store is
 * exposed through `useSyncExternalStore` so every module sees the same state.
 */

import { useSyncExternalStore } from 'react';

const STORAGE_KEY = 'echoes-discovery-passport-v1';

export interface PassportState {
  explored: string[];
  stories: string[];
  evidence: string[];
  investigations: string[];
  saved: string[];
  lastSlug: string | null;
  updatedAt: string | null;
}

const EMPTY: PassportState = {
  explored: [],
  stories: [],
  evidence: [],
  investigations: [],
  saved: [],
  lastSlug: null,
  updatedAt: null,
};

function unique(values: string[]): string[] {
  return [...new Set(values)];
}

function read(): PassportState {
  if (typeof window === 'undefined') return EMPTY;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY;
    const parsed = JSON.parse(raw) as Partial<PassportState>;
    return {
      explored: unique(parsed.explored ?? []),
      stories: unique(parsed.stories ?? []),
      evidence: unique(parsed.evidence ?? []),
      investigations: unique(parsed.investigations ?? []),
      saved: unique(parsed.saved ?? []),
      lastSlug: typeof parsed.lastSlug === 'string' ? parsed.lastSlug : null,
      updatedAt: typeof parsed.updatedAt === 'string' ? parsed.updatedAt : null,
    };
  } catch {
    return EMPTY;
  }
}

let state: PassportState = read();
const listeners = new Set<() => void>();

function emit(): void {
  for (const listener of listeners) listener();
}

function persist(next: PassportState): void {
  state = { ...next, updatedAt: new Date().toISOString() };
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* storage unavailable: progress stays in memory for this session */
    }
  }
  emit();
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function snapshot(): PassportState {
  return state;
}

export function usePassport(): PassportState {
  return useSyncExternalStore(subscribe, snapshot, snapshot);
}

export function markExplored(slug: string): void {
  if (state.explored.includes(slug) && state.lastSlug === slug) return;
  persist({
    ...state,
    explored: unique([...state.explored, slug]),
    lastSlug: slug,
  });
}

export function markStoryComplete(slug: string): void {
  persist({ ...state, stories: unique([...state.stories, slug]) });
}

export function markEvidenceComplete(slug: string): void {
  persist({ ...state, evidence: unique([...state.evidence, slug]) });
}

export function markInvestigationComplete(slug: string): void {
  persist({
    ...state,
    investigations: unique([...state.investigations, slug]),
    explored: unique([...state.explored, slug]),
  });
}

export function toggleSaved(slug: string): void {
  const saved = state.saved.includes(slug)
    ? state.saved.filter((entry) => entry !== slug)
    : [...state.saved, slug];
  persist({ ...state, saved });
}

export function resetPassport(): void {
  state = EMPTY;
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* storage unavailable */
    }
  }
  emit();
}

export interface PassportBadge {
  id: string;
  label: string;
  description: string;
  earned: boolean;
}

export function buildBadges(passport: PassportState): PassportBadge[] {
  return [
    {
      id: 'first-discovery',
      label: 'First Discovery',
      description: 'Open your first verified artifact record.',
      earned: passport.explored.length >= 1,
    },
    {
      id: 'storyteller',
      label: 'Storyteller',
      description: 'Complete three narrated storybooks.',
      earned: passport.stories.length >= 3,
    },
    {
      id: 'evidence-detective',
      label: 'Evidence Detective',
      description: 'Finish an evidence challenge for any artifact.',
      earned: passport.evidence.length >= 1,
    },
    {
      id: 'space-archaeologist',
      label: 'Space Archaeologist',
      description: 'Complete a guided investigation.',
      earned: passport.investigations.length >= 1,
    },
    {
      id: 'surveyor',
      label: 'Surveyor',
      description: 'Explore every verified artifact in the archive.',
      earned: passport.explored.length >= 4,
    },
    {
      id: 'curator',
      label: 'Curator',
      description: 'Save at least two artifacts to your passport.',
      earned: passport.saved.length >= 2,
    },
  ];
}
