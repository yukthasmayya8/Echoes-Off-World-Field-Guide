const key = (slug: string) => `echoes:debrief:best:${slug}`;

/** Best score for an artifact, kept in the browser only. Never throws. */
export function readBestScore(slug: string): number | null {
  try {
    const raw = window.localStorage.getItem(key(slug));
    if (raw === null) return null;
    const n = Number(raw);
    return Number.isInteger(n) && n >= 0 ? n : null;
  } catch {
    return null;
  }
}

export function saveBestScore(slug: string, score: number): number {
  const previous = readBestScore(slug);
  const best = previous === null ? score : Math.max(previous, score);
  try {
    window.localStorage.setItem(key(slug), String(best));
  } catch {
    /* storage unavailable (private mode, quota) – progress is optional */
  }
  return best;
}
