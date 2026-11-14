/**
 * Cinematic narration engine for Echoes — Off-World Field Guide.
 *
 * Uses the browser's Web Speech API to narrate artifact stories in three
 * documentary styles. All narration text comes from reviewed project content
 * only — no fabricated astronaut dialogue, radio transmissions, or historical
 * recordings are ever synthesized.
 *
 * If speech synthesis is unavailable, narration falls back to captions-only
 * mode so the experience remains fully usable.
 */

import type { StoryChapter } from '@echoes/shared';

export type NarrationMode = 'documentary' | 'young-explorer' | 'scientific-deep-dive';

export interface NarrationConfig {
  mode: NarrationMode;
  rate: number; // 0.5 to 2
  voice?: SpeechSynthesisVoice | null;
}

export interface NarrationSentence {
  id: string;
  text: string;
  // Original archive wording that this sentence is based on (if any).
  sourceRef?: string;
  // The chapter this sentence belongs to.
  chapterNumber: number;
  chapterTitle: string;
  // Whether this sentence is an authentic archive quotation vs. educational narration.
  isArchiveQuote: boolean;
}

export interface NarrationState {
  playing: boolean;
  paused: boolean;
  currentSentenceIndex: number;
  totalSentences: number;
  mode: NarrationMode;
  error: string | null;
  supported: boolean;
}

/**
 * Splits narration text into sentence-level units for synchronized highlighting.
 */
function splitIntoSentences(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

/**
 * Documentary-style narration: cinematic openings, natural storytelling,
 * meaningful pauses, engaging transitions, memorable conclusions.
 */
function documentaryNarration(chapters: StoryChapter[]): NarrationSentence[] {
  const sentences: NarrationSentence[] = [];

  sentences.push({
    id: 'doc-opening',
    text: `Before we begin, imagine this: a silent machine resting on another world, waiting decades for someone to remember its name.`,
    chapterNumber: 1,
    chapterTitle: chapters[0]?.title ?? 'The Mission',
    isArchiveQuote: false,
  });

  for (const chapter of chapters) {
    const parts = splitIntoSentences(chapter.simplifiedWording);
    for (const [partIndex, part] of parts.entries()) {
      sentences.push({
        id: `doc-${chapter.id}-${partIndex}`,
        text: part,
        chapterNumber: chapter.number,
        chapterTitle: chapter.title,
        isArchiveQuote: false,
      });
    }
    sentences.push({
      id: `doc-transition-${chapter.number}`,
      text: `That was chapter ${chapter.number}. On to the next moment in the story.`,
      chapterNumber: chapter.number,
      chapterTitle: chapter.title,
      isArchiveQuote: false,
    });
  }

  sentences.push({
    id: 'doc-conclusion',
    text: `These machines may be silent now, but their discoveries still speak to us. The story of off-world exploration continues — and you are part of it.`,
    chapterNumber: chapters.length,
    chapterTitle: chapters[chapters.length - 1]?.title ?? 'The Legacy',
    isArchiveQuote: false,
  });

  return sentences;
}

/**
 * Young Explorer Mode: simple language, friendly storytelling, short explanations,
 * easy scientific vocabulary.
 */
function youngExplorerNarration(chapters: StoryChapter[]): NarrationSentence[] {
  const sentences: NarrationSentence[] = [];

  sentences.push({
    id: 'ye-opening',
    text: `Hi there, young explorer! Let's learn about a spacecraft that traveled to another world.`,
    chapterNumber: 1,
    chapterTitle: chapters[0]?.title ?? 'The Mission',
    isArchiveQuote: false,
  });

  for (const chapter of chapters) {
    const parts = splitIntoSentences(chapter.simplifiedWording);
    for (const [partIndex, part] of parts.entries()) {
      sentences.push({
        id: `ye-${chapter.id}-${partIndex}`,
        text: part,
        chapterNumber: chapter.number,
        chapterTitle: chapter.title,
        isArchiveQuote: false,
      });
    }
    sentences.push({
      id: `ye-transition-${chapter.number}`,
      text: `Great job! You just learned about ${chapter.title}.`,
      chapterNumber: chapter.number,
      chapterTitle: chapter.title,
      isArchiveQuote: false,
    });
  }

  sentences.push({
    id: 'ye-conclusion',
    text: `You did it! You explored the story of this amazing machine. Keep asking questions about space.`,
    chapterNumber: chapters.length,
    chapterTitle: chapters[chapters.length - 1]?.title ?? 'The Legacy',
    isArchiveQuote: false,
  });

  return sentences;
}

/**
 * Scientific Deep Dive: detailed explanations, instrument descriptions,
 * mission engineering details, scientific discoveries and their significance.
 */
function scientificDeepDiveNarration(chapters: StoryChapter[]): NarrationSentence[] {
  const sentences: NarrationSentence[] = [];

  sentences.push({
    id: 'sd-opening',
    text: `Scientific deep dive: examining the engineering, instruments, and discoveries of this off-world mission.`,
    chapterNumber: 1,
    chapterTitle: chapters[0]?.title ?? 'The Mission',
    isArchiveQuote: false,
  });

  for (const chapter of chapters) {
    const parts = splitIntoSentences(chapter.originalWording);
    for (const [partIndex, part] of parts.entries()) {
      sentences.push({
        id: `sd-${chapter.id}-${partIndex}`,
        text: part,
        sourceRef: chapter.originalWording,
        chapterNumber: chapter.number,
        chapterTitle: chapter.title,
        isArchiveQuote: true,
      });
    }
    sentences.push({
      id: `sd-deeper-${chapter.number}`,
      text: `For more detail, see the expanded archived wording for chapter ${chapter.number}.`,
      chapterNumber: chapter.number,
      chapterTitle: chapter.title,
      isArchiveQuote: false,
    });
  }

  sentences.push({
    id: 'sd-conclusion',
    text: `Deep dive complete. Every fact above is supported by archived mission records.`,
    chapterNumber: chapters.length,
    chapterTitle: chapters[chapters.length - 1]?.title ?? 'The Legacy',
    isArchiveQuote: false,
  });

  return sentences;
}

export function buildNarration(
  chapters: StoryChapter[],
  mode: NarrationMode,
): NarrationSentence[] {
  switch (mode) {
    case 'documentary':
      return documentaryNarration(chapters);
    case 'young-explorer':
      return youngExplorerNarration(chapters);
    case 'scientific-deep-dive':
      return scientificDeepDiveNarration(chapters);
    default:
      return documentaryNarration(chapters);
  }
}
