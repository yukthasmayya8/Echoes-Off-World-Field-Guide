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

export type NarrationSceneId =
  | 'purpose'
  | 'hardware'
  | 'science'
  | 'mission-end'
  | 'legacy';

export interface NarrationScene {
  id: NarrationSceneId;
  chapterNumber: number;
  title: string;
  caption: string;
}

const SCENES_BY_CHAPTER_KEY: Record<string, Omit<NarrationScene, 'chapterNumber'>> = {
  'why-sent': {
    id: 'purpose',
    title: 'Why it was sent',
    caption: 'This scene introduces the mission purpose recorded for the spacecraft.',
  },
  carried: {
    id: 'hardware',
    title: 'The hardware that carried the mission',
    caption: 'This scene follows the spacecraft design and the recorded journey.',
  },
  found: {
    id: 'science',
    title: 'What the mission investigated',
    caption: 'This scene follows the instruments, experiments and observations.',
  },
  ended: {
    id: 'mission-end',
    title: 'How the mission ended',
    caption: 'This scene covers the documented end of mission operations.',
  },
  remains: {
    id: 'legacy',
    title: 'What remains today',
    caption: 'This scene covers what the record documents about what remains.',
  },
};

export const SCENE_BY_KEY: Record<string, NarrationScene> = Object.fromEntries(
  Object.entries(SCENES_BY_CHAPTER_KEY).map(([key, scene]) => [
    key,
    { ...scene, chapterNumber: 1 },
  ]),
);

export function sceneForChapter(chapter: StoryChapter | undefined): NarrationScene {
  const fallback = chapter ?? ({ number: 1 } as StoryChapter);
  const scene = SCENES_BY_CHAPTER_KEY[
    (['why-sent', 'carried', 'found', 'ended', 'remains'] as const)[
      Math.min(Math.max(fallback.number, 1), 5) - 1
    ]
  ];
  return scene
    ? { ...scene, chapterNumber: fallback.number }
    : {
        id: 'purpose' as NarrationSceneId,
        chapterNumber: fallback.number,
        title: fallback.title,
        caption: fallback.simplifiedWording,
      };
}

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
  // The visual scene that should accompany this narration segment.
  sceneId: NarrationSceneId;
  sceneTitle: string;
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
    sceneId: 'purpose',
    sceneTitle: sceneForChapter(chapters[0] ?? ({} as StoryChapter)).title,
    isArchiveQuote: false,
  });

  for (const chapter of chapters) {
    const scene = sceneForChapter(chapter);
    const parts = splitIntoSentences(chapter.simplifiedWording);
    for (const [partIndex, part] of parts.entries()) {
      sentences.push({
        id: `doc-${chapter.id}-${partIndex}`,
        text: part,
        chapterNumber: chapter.number,
        chapterTitle: chapter.title,
        sceneId: scene.id,
        sceneTitle: scene.title,
        isArchiveQuote: false,
      });
    }
    sentences.push({
      id: `doc-transition-${chapter.number}`,
      text: `That was chapter ${chapter.number}. On to the next moment in the story.`,
      chapterNumber: chapter.number,
      chapterTitle: chapter.title,
      sceneId: scene.id,
      sceneTitle: scene.title,
      isArchiveQuote: false,
    });
  }

  const lastChapter = chapters[chapters.length - 1];
  sentences.push({
    id: 'doc-conclusion',
    text: `These machines may be silent now, but their discoveries still speak to us. The story of off-world exploration continues — and you are part of it.`,
    chapterNumber: lastChapter?.number ?? 5,
    chapterTitle: lastChapter?.title ?? 'The Legacy',
    sceneId: sceneForChapter(lastChapter ?? ({} as StoryChapter)).id,
    sceneTitle: sceneForChapter(lastChapter ?? ({} as StoryChapter)).title,
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
    sceneId: 'purpose',
    sceneTitle: sceneForChapter(chapters[0] ?? ({} as StoryChapter)).title,
    isArchiveQuote: false,
  });

  for (const chapter of chapters) {
    const scene = sceneForChapter(chapter);
    const parts = splitIntoSentences(chapter.simplifiedWording);
    for (const [partIndex, part] of parts.entries()) {
      sentences.push({
        id: `ye-${chapter.id}-${partIndex}`,
        text: part,
        chapterNumber: chapter.number,
        chapterTitle: chapter.title,
        sceneId: scene.id,
        sceneTitle: scene.title,
        isArchiveQuote: false,
      });
    }
    sentences.push({
      id: `ye-transition-${chapter.number}`,
      text: `Great job! You just learned about ${chapter.title}.`,
      chapterNumber: chapter.number,
      chapterTitle: chapter.title,
      sceneId: scene.id,
      sceneTitle: scene.title,
      isArchiveQuote: false,
    });
  }

  const lastChapter = chapters[chapters.length - 1];
  sentences.push({
    id: 'ye-conclusion',
    text: `You did it! You explored the story of this amazing machine. Keep asking questions about space.`,
    chapterNumber: lastChapter?.number ?? 5,
    chapterTitle: lastChapter?.title ?? 'The Legacy',
    sceneId: sceneForChapter(lastChapter ?? ({} as StoryChapter)).id,
    sceneTitle: sceneForChapter(lastChapter ?? ({} as StoryChapter)).title,
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
    sceneId: 'purpose',
    sceneTitle: sceneForChapter(chapters[0] ?? ({} as StoryChapter)).title,
    isArchiveQuote: false,
  });

  for (const chapter of chapters) {
    const scene = sceneForChapter(chapter);
    const parts = splitIntoSentences(chapter.originalWording);
    for (const [partIndex, part] of parts.entries()) {
      sentences.push({
        id: `sd-${chapter.id}-${partIndex}`,
        text: part,
        chapterNumber: chapter.number,
        chapterTitle: chapter.title,
        sceneId: scene.id,
        sceneTitle: scene.title,
        sourceRef: chapter.originalWording,
        isArchiveQuote: true,
      });
    }
    sentences.push({
      id: `sd-deeper-${chapter.number}`,
      text: `For more detail, see the expanded archived wording for chapter ${chapter.number}.`,
      chapterNumber: chapter.number,
      chapterTitle: chapter.title,
      sceneId: scene.id,
      sceneTitle: scene.title,
      isArchiveQuote: false,
    });
  }

  const lastChapter = chapters[chapters.length - 1];
  sentences.push({
    id: 'sd-conclusion',
    text: `Deep dive complete. Every fact above is supported by archived mission records.`,
    chapterNumber: lastChapter?.number ?? 5,
    chapterTitle: lastChapter?.title ?? 'The Legacy',
    sceneId: sceneForChapter(lastChapter ?? ({} as StoryChapter)).id,
    sceneTitle: sceneForChapter(lastChapter ?? ({} as StoryChapter)).title,
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
