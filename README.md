# ECHOES — Member 3 Storybook feature

This package contains only the Member 3 React feature files. It follows the team's Master Technical Reference and shared `Artifact` / `Chapter` / `Source` contract.

## Files

```text
frontend/src/features/story/
  StoryFeature.tsx
  StoryFeature.module.css
```

## Integration

Copy the `story` folder into the existing frontend at `frontend/src/features/story/`.

The component imports the canonical shared types from:

```ts
../../types/artifact
```

Expected shared exports:

```ts
export type Body = 'moon' | 'mars';
export type Confidence = 'exact' | 'approximate' | 'unknown';
export type ArtifactStatus = 'active' | 'inactive' | 'ended' | 'unknown';
export type ArtifactType = 'rover' | 'lander' | 'orbiter-impactor' | 'instrument' | 'flag-or-marker' | 'other';
export interface Source { id: string; title: string; organization: string; url: string; supports?: string; }
export interface Chapter { key: 'why-sent' | 'carried' | 'found' | 'ended' | 'remains'; title: string; text: string; deeper?: string; sourceIds: string[]; dramatized?: boolean; }
export interface Artifact {
  id: string; slug: string; name: string; body: Body; missionName: string;
  artifactType: ArtifactType; status: ArtifactStatus;
  location: { label: string; confidence: Confidence; note: string; coordinates?: { lat: number; lng: number } };
  summary: string; chapters: Chapter[]; timeline: TimelineEvent[];
  discoveries: Discovery[]; sources: Source[];
  image?: { url: string; alt: string; credit: string };
}
```

Use the exact `Artifact` and `Chapter` definitions already maintained by Member 1; do not duplicate or replace them. The component is prop-driven and does not fetch data or add dependencies.

Example:

```tsx
import { StoryFeature } from './features/story/StoryFeature';

<StoryFeature
  artifact={selectedArtifact}
  activeChapterKey={selectedTimelineEvent?.chapterKey}
  onOpenSources={() => setSourcesPanelOpen(true)}
/>
```

`onOpenSources` is optional. It should open the application's existing source panel; the component itself also displays the current chapter's resolved source records.

## Data and evidence requirements

- Supply exactly five chapters in the canonical order: `why-sent`, `carried`, `found`, `ended`, `remains`.
- Every chapter's `sourceIds` must resolve to an item in the same artifact's `sources` array.
- `dramatized: true` must only be used for explicitly fictionalised first-person narration. The component displays a prominent label in that case.
- Supply image URL, meaningful alt text and credit together. Credit remains visible if the image fails.
- Use only source-supported location precision and status wording. Never infer a precise resting place from a broad region.
- Keep main chapter text to 2–4 short sentences and the whole story readable in under two minutes.
- Missing chapter content or source links are surfaced as data-quality warnings; the UI does not invent replacements.

## Implemented interactions

- Five fixed chapter tabs and Previous / Next controls with boundary protection.
- Accurate chapter progress indicator.
- Timeline-driven chapter selection through `activeChapterKey`, including reduced-motion support.
- Expand/collapse for optional deeper detail.
- Chapter-specific evidence list with title, organization, supports text and record ID.
- Safe HTTP(S)-only outbound source and image URLs.
- Image failure fallback that preserves the supplied image credit.
- Textual mission status and location-confidence explanation.
- Keyboard focus styles, semantic controls, live chapter announcement and responsive layout down to 360px.

## Verification

This deliverable has been checked for alignment with the written component contract and for TypeScript/React syntax by inspection. A full `npm run build`, unit test and browser test cannot be truthfully reported until the files are installed in the team's actual repository with its dependencies and scripts. Run the repository's existing build and test commands after integration.
