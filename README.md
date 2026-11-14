# Echoes — Off-World Field Guide

Backend and frontend integration foundation for the NASA Space Apps Challenge 2026
challenge **“Abandoned but not Forgotten — Storytelling about NASA's Discarded
Equipment on the Moon and Mars.”**

The repository contains a working Express + TypeScript API over a validated JSON
archive, shared data contracts, a typed React API client, a verified offline demo
fallback, and safe integration slots for the six teammate-built feature interfaces.

> The six visual feature interfaces are **not** implemented here. The registry
> renders typed developer placeholders until a teammate registers a component.

## Quick start

```bash
npm install
npm run dev          # builds shared, then runs API :4000 + Vite :5173
```

Open <http://localhost:5173>. The API is at <http://localhost:4000/api/v1>.

Individual scripts:

```bash
npm run dev:backend
npm run dev:frontend
npm run build
npm run test
npm run typecheck
npm start            # builds and serves the compiled API
```

To point a deployment at another API host, copy `frontend/.env.example` to
`frontend/.env` and set `VITE_API_BASE_URL`.

## Repository layout

```
data/                         validated JSON store
  artifacts.json              5 records (4 verified, 1 needs_review)
  guided-routes.json          2 curated routes
  quizzes.json                4 answer-keyed debriefs (public payloads are stripped)

shared/src/
  types.ts                    all shared interfaces
  schemas.ts                  Zod schemas + compile-time type assertions
  constants.ts                enums, limits, NSSDCA URL rule
  catalog.ts                  pure search/filter helpers (API + demo parity)
  quiz.ts                     public-quiz projection + answer evaluation

backend/src/
  app.ts                      Express app factory (injectable dataset)
  server.ts                   startup, readable dataset-validation failures
  data.ts                     JSON loader + cross-record integrity validator
  routes/                     health, catalog, artifacts, routes, quizzes
  services/                   catalog, artifact, route, quiz data access
  middleware/                 consistent 404 + error envelope
  utils/                      response envelope + AppError helpers
backend/tests/                Vitest + Supertest suites

frontend/src/
  services/api.ts             the only fetch client (timeout + typed errors)
  services/localFallback.ts   verified offline dataset + local quiz evaluation
  services/artifactService.ts API-first gateway with visible demo fallback
  app/useEchoesApp.ts         parent-owned application state
  features/integration/       featureTypes, FeatureRegistry, FeatureFallbacks
  App.tsx                     integration shell and source drawer
```

## API

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/api/v1/health` | Status, version, timestamp, dataset counts |
| GET | `/api/v1/catalog/search?q=&body=` | Verified-only search across name, aliases, mission, NSSDCA ID and body |
| GET | `/api/v1/artifacts?body=&type=&status=&q=` | Combined listing; `status=verified` by default |
| GET | `/api/v1/artifacts/:slug` | Full artifact; `needs_review` slugs return 404 |
| GET | `/api/v1/routes` | Curated guided routes |
| GET | `/api/v1/routes/:slug` | One route with ordered artifact slugs and progress IDs |
| GET | `/api/v1/quizzes/:artifactSlug` | Public quiz; no `correctOptionId` or explanation |
| POST | `/api/v1/quizzes/:artifactSlug/answer` | `{ optionId, questionId? }` → correctness, explanation, sources |

All responses use `{ success, data, meta }` or
`{ success: false, error: { code, message, details? }, meta }`.
Stack traces are never sent to clients.

## Data policy

- NSSDCA master-catalog records are the archive source of truth.
- Original archive wording and simplified educational wording are stored side by side.
- Every chapter, timeline event, discovery and quiz explanation references source IDs.
- `verificationStatus` is authored, never inferred. `needs_review` records are hidden
  from search, detail, routes and quizzes by default and are never auto-promoted.
- Coordinates are included only when the NSSDCA record states them; the location
  confidence explains what the coordinate does and does not represent.
- Startup validation checks schemas, duplicate IDs/slugs, parent-child symmetry,
  NSSDCA URL/ID agreement, image credits, claim sources, route ordering and quiz keys.

## Registering a teammate feature

Create a module such as `frontend/src/features/atlas/register.tsx`:

```tsx
import { defineFeature } from '../integration/featureTypes';
import { AtlasFeature } from './AtlasFeature';

export default defineFeature({
  key: 'atlas',
  component: AtlasFeature,
});
```

`FeatureRegistry.tsx` discovers `features/*/register.tsx` automatically. No shared
file needs editing. If the module is absent or throws while loading, the typed
placeholder stays in place and the rest of the app keeps working.

The available keys and exact props are in
`frontend/src/features/integration/featureTypes.ts`:

`atlas`, `moonStories`, `marsStories`, `afterlife`, `scienceEvidence`,
`missionDebrief`, `guidedRoute`.

## DEMO MODE

If the API is unreachable, times out, or returns a 5xx/invalid envelope,
`artifactService` falls back to the same verified JSON files. The UI shows a
visible **DEMO MODE** banner, and local quiz evaluation is labelled
`evaluatedBy: 'local'`. A genuine 404 or invalid answer does **not** trigger the
fallback. Unverified records are never shown.

## Tests

- Backend: health, search by name/alias/NSSDCA ID/body, combined filters,
  detail/404, `needs_review` exclusion, routes, quiz retrieval without answer keys,
  answer evaluation, invalid answers, malformed JSON, broken source refs,
  parent-child integrity, duplicate IDs/slugs, empty verified dataset.
- Frontend: API client (URLs, envelopes, POST body, 404, timeout, network error),
  local fallback (verified-only search/detail/routes/quiz/local answer),
  gateway fallback policy, feature prop compatibility, registry placeholders.

---

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
