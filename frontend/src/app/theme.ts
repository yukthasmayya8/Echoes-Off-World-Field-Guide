/**
 * Theme system for Echoes — Off-World Field Guide.
 *
 * Each theme is a set of CSS custom property overrides. The active theme is
 * stored in localStorage so it persists across sessions. No personal data is
 * collected — only the theme name is persisted.
 */

export type ThemeId = 'lunar-night' | 'martian-dawn' | 'space-observatory' | 'mission-control';

export interface ThemeDefinition {
  id: ThemeId;
  name: string;
  description: string;
  accent: string;
  accentSoft: string;
  surface: string;
  surfaceSoft: string;
  border: string;
  text: string;
  muted: string;
  warn: string;
  danger: string;
  success: string;
}

const THEMES: Record<ThemeId, ThemeDefinition> = {
  'lunar-night': {
    id: 'lunar-night',
    name: 'Lunar Night',
    description: 'Deep space dark with cool blue accents',
    accent: '#6ea8fe',
    accentSoft: 'rgba(110, 168, 254, 0.14)',
    surface: '#0b1220',
    surfaceSoft: '#0e1524',
    border: '#263450',
    text: '#e8eefb',
    muted: '#9aabc7',
    warn: '#f5c16c',
    danger: '#ff8f8f',
    success: '#8de2c0',
  },
  'martian-dawn': {
    id: 'martian-dawn',
    name: 'Martian Dawn',
    description: 'Warm rust-orange inspired by the Red Planet',
    accent: '#e88a3d',
    accentSoft: 'rgba(232, 138, 61, 0.14)',
    surface: '#1a0f0a',
    surfaceSoft: '#221610',
    border: '#4a3226',
    text: '#fbeee7',
    muted: '#cfa88e',
    warn: '#f5c16c',
    danger: '#ff8f8f',
    success: '#8de2c0',
  },
  'space-observatory': {
    id: 'space-observatory',
    name: 'Space Observatory',
    description: 'Dark teal and slate for late-night exploration',
    accent: '#7fd3c4',
    accentSoft: 'rgba(127, 211, 196, 0.14)',
    surface: '#0a121a',
    surfaceSoft: '#0e1822',
    border: '#2a3a46',
    text: '#e6f2ee',
    muted: '#8fb0a8',
    warn: '#f5c16c',
    danger: '#ff8f8f',
    success: '#7fd3c4',
  },
  'mission-control': {
    id: 'mission-control',
    description: 'Amber-on-black retro NASA mission control aesthetic',
    name: 'Mission Control',
    accent: '#ffcc33',
    accentSoft: 'rgba(255, 204, 51, 0.14)',
    surface: '#0a0a05',
    surfaceSoft: '#12120a',
    border: '#3d3a20',
    text: '#e6e6cc',
    muted: '#a6a26e',
    warn: '#f5c16c',
    danger: '#ff8f8f',
    success: '#8de2c0',
  },
} as const;

export function getTheme(themeId: ThemeId): ThemeDefinition {
  return THEMES[themeId];
}

export function getAllThemes(): ThemeDefinition[] {
  return Object.values(THEMES);
}

export const DEFAULT_THEME: ThemeId = 'lunar-night';

export function loadThemeFromStorage(): ThemeId {
  if (typeof window === 'undefined') return DEFAULT_THEME;
  try {
    const stored = window.localStorage.getItem('echoes-theme');
    if (stored && stored in THEMES) return stored as ThemeId;
  } catch {
    /* storage unavailable */
  }
  return DEFAULT_THEME;
}

export function saveThemeToStorage(themeId: ThemeId): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem('echoes-theme', themeId);
  } catch {
    /* storage unavailable */
  }
}
