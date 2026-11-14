# Echoes — Off-World Field Guide

Echoes is a NASA Space Apps Challenge 2026 project about the machines left on
the Moon and Mars. It combines a verified NSSDCA-based archive, a typed
Express API, and a React field guide with an offline demo mode.

## What is included

- **Archive API** — validated artifact, route, source, and quiz data.
- **React field guide** — catalog search, artifact selection, story and evidence
  panels, guided routes, and mission debriefs.
- **Shared contracts** — TypeScript types, Zod schemas, catalog helpers, and
  quiz evaluation shared by the API and frontend.
- **Offline fallback** — the frontend can use the verified local dataset when
  the API is unavailable.

## Quick start

Requirements: Node.js 20 or newer.

```bash
npm install
npm run dev
```

Open <http://localhost:5173>. The API runs at
<http://localhost:4000/api/v1>.

Useful commands:

```bash
npm run dev:frontend
npm run dev:backend
npm run build
npm run typecheck
npm test
node scripts/smoke.mjs
npm start
```

To use a different API host, copy `frontend/.env.example` to
`frontend/.env` and set `VITE_API_BASE_URL`.

## Repository structure

The top-level folders are intentional workspace boundaries:

```text
backend/                    Express API, services, routes, and API tests
data/                       Verified archive JSON consumed by API and fallback
frontend/                   React/Vite application and frontend tests
scripts/                    Development runner and live API smoke test
shared/                     Contracts, schemas, catalog helpers, and quiz logic
```

Important frontend locations:

```text
frontend/src/
  app/                      Application state and selection flows
  features/                 Feature components and integration registry
  services/                 API client and verified offline fallback
  styles.css                Global application styles
```

`shared/` is not an empty or unused folder: both `backend/` and `frontend/`
consume `@echoes/shared`. `data/` is the source archive, and `scripts/` contains
the commands used to run and verify the application.

## Frontend features

Feature components live under `frontend/src/features/`:

- `atlas/` — NSSDCA archive browser.
- `story/` — five-chapter artifact story.
- `afterlife/` — mission timeline and final disposition.
- `science-evidence/` — discovery evidence and mission debrief.
- `integration/` — typed contracts, fallbacks, and lazy registration.

The parent application owns loading, selection, errors, source navigation, and
API calls. Feature components remain presentational. To register a feature,
add a `register.tsx` file in its feature folder:

```tsx
import { defineFeature } from '../integration/featureTypes';
import { AtlasFeature } from './AtlasFeature';

export default defineFeature({
  key: 'atlas',
  component: AtlasFeature,
});
```

The registry discovers registrations automatically. If a feature is not
registered or fails to load, its typed fallback remains visible.

## API

All responses use a consistent success or error envelope.

| Method | Endpoint | Purpose |
| --- | --- | --- |
| GET | `/api/v1/health` | Service status and dataset counts |
| GET | `/api/v1/catalog/search?q=&body=` | Search verified archive records |
| GET | `/api/v1/artifacts` | Filter and list artifacts |
| GET | `/api/v1/artifacts/:slug` | Retrieve one verified artifact |
| GET | `/api/v1/routes` | List curated routes |
| GET | `/api/v1/routes/:slug` | Retrieve an ordered route |
| GET | `/api/v1/quizzes/:artifactSlug` | Retrieve a public quiz without answer keys |
| POST | `/api/v1/quizzes/:artifactSlug/answer` | Evaluate a submitted answer |

Unverified records are excluded from normal search, detail, routes, and quizzes.
Startup validation checks schemas, source references, parent/child links,
NSSDCA identifiers, route ordering, and quiz integrity.

## Data and evidence rules

- NSSDCA master-catalog records are the archive source of truth.
- Original wording and plain-language explanations are stored together.
- Claims, story chapters, timeline events, discoveries, and quiz explanations
  retain source IDs.
- Location precision is never inferred beyond the source record.
- The frontend visibly labels offline operation as **DEMO MODE**.

## Testing

Run the complete checks with:

```bash
npm run typecheck
npm test
npm run build
```

The backend tests cover validation, routes, filtering, error envelopes, source
integrity, and quiz behavior. Frontend tests cover the API client, offline
fallback, integration contracts, and mission debrief accessibility.
