# Echoes - Off-World Field Guide

> "The rover stopped. The discoveries kept moving."

**Live Project:** [Explore Echoes- Live Application](https://echoes-off-world-field-guide.netlify.app/)

An evidence-first, interactive field guide preserving the stories, engineering
and scientific legacy of NASA hardware remaining on the Moon and Mars.

Developed by **Team Nullorbit** for the **NASA Space Apps Challenge 2026**.

---

## 1. The Problem

Since the beginning of planetary exploration, NASA missions have left behind
spacecraft, landers, rovers, instruments, descent stages and other equipment
across extraterrestrial surfaces.

Some completed their planned missions. Others stopped communicating, while the
present physical condition of certain artifacts remains uncertain.

Yet, the end of a spacecraft's operational life does not mark the end of its
scientific or historical significance.

These artifacts represent decades of engineering decisions, scientific
experiments, technological progress and discoveries that expanded our
understanding of the Solar System.

However, their stories are often distributed across archival catalogs, mission
reports and technical documentation. Making these records understandable and
engaging for younger audiences is a challenge in itself.

The challenge is therefore not simply to identify what NASA left behind, but to
communicate:

- What was the equipment designed to accomplish?
- What engineering made its mission possible?
- What scientific knowledge did it help produce?
- What happened after its operational life ended?
- What do historical records establish, and what remains unknown?

## 2. Our Solution - Echoes

Echoes transforms archival mission records into an interactive digital field
guide for school-age space enthusiasts, educators and curious explorers.

Instead of presenting retired spacecraft as forgotten objects, Echoes treats
them as the starting point for exploring the engineering, missions, people and
scientific discoveries behind planetary exploration.

The platform combines:

- A Mission Control dashboard with daily discoveries, progress and
  recommendations.
- Geographical exploration through a Planetary Atlas.
- Source-linked, five-chapter artifact storytelling.
- Cinematic, captioned narration with selectable narration styles.
- Interactive mission timelines.
- Engineering and scientific discovery exploration.
- Evidence-based investigation activities.
- Historical afterlife and legacy documentation.
- Guided learning routes and classroom resources.

### The Echoes Learning Journey

1. **Find:** Discover spacecraft and mission artifacts through the Planetary
   Atlas and global search.
2. **Understand:** Explore mission histories through narrated stories and
   interactive timelines.
3. **Connect:** Examine how engineering systems and scientific instruments
   contributed to discoveries.
4. **Investigate:** Evaluate historical claims using source references, evidence
   activities and documented unknowns.
5. **Remember:** Explore artifact relationships, compare missions, complete
   learning activities and preserve progress through the Discovery Passport.

Our central principle is simple: storytelling should make scientific history
accessible without compromising the evidence behind it.

## 3. What Makes Echoes Different?

### Evidence-first storytelling

Echoes maintains original archival wording alongside simplified explanations,
allowing visitors to understand historical information while retaining access
to its documentary basis.

Claims, narrative chapters, timeline events and scientific discoveries are
associated with source references.

### Engineering connected to scientific discovery

Rather than stopping at mission descriptions, Echoes encourages visitors to
investigate the hardware itself, understand its purpose and connect engineering
decisions to scientific outcomes.

### Explicit uncertainty representation

Not every historical record establishes the present condition or exact location
of an artifact.

Echoes distinguishes verified information, approximate location information,
documented uncertainty and missing dataset information instead of presenting
unsupported assumptions as facts.

### Interactive learning rather than passive reading

Visitors can investigate claims, explore mission chronologies, compare
artifacts, follow curated journeys and participate in guided archaeological
investigations.

### Accessibility and educational usability

The experience incorporates browser-based narration, keyboard-friendly
interactions, responsive layouts, local progress tracking and teacher-oriented
learning resources.

## 4. Current Artifact Archive

The prototype currently contains four verified, source-linked artifact records.

| Artifact | Planetary Body | Archive Status |
| --- | --- | --- |
| Apollo 11 Lunar Module Eagle | Moon | Verified |
| Surveyor 3 | Moon | Verified |
| Mars Pathfinder Lander (Sagan Memorial Station) | Mars | Verified |
| Sojourner | Mars | Verified |

An additional record, Apollo 12 Lunar Module Intrepid, is present with
`needs_review` status. It is intentionally excluded from normal search, artifact
details, guided routes and quizzes until its review status is resolved.

We deliberately prioritise source quality and traceability over archive size.

### Curated Exploration Routes

- The Moon: What We Left Behind
- Mars: A Lander and Its Rover

The Mars route connects the Pathfinder lander and Sojourner, allowing visitors
to explore their related mission histories in sequence.

## 5. Features and Learning Modules

Echoes is organised into interconnected exploration and learning experiences.

### A. Explore and Orient

#### Mission Control Dashboard

Provides a focused starting point for exploring the archive, discovering
featured artifacts and navigating the field guide. The dashboard includes:

- Mission of the Day and Featured Discovery panels.
- Continue Exploration with the last selected artifact.
- Quick-access links to the main learning modules.
- Recently explored artifacts.
- A recommended route based on current progress.
- Discovery Passport progress, saved-artifact counts and achievement badges.

#### Planetary Atlas

An interactive Moon and Mars location explorer featuring:

- Artifact location markers.
- NASA and USGS planetary reference basemaps for the Moon and Mars.
- A documented schematic coordinate chart when imagery is unavailable.
- Location confidence indicators.
- Text-based location fallback.
- Selected-location information panel.
- Artifact search and filters for destination, equipment type and mission.
- Zoom, pan and fullscreen controls.
- Coordinate reference-frame information when it is present in the archive.

Location precision is presented according to the underlying archival information
rather than assumed accuracy.

Basemap imagery is used as a visual reference only. Marker positions come from
the verified artifact records, and each map identifies its NASA/USGS imagery
source.

#### Global Search

Allows visitors to search the verified archive using artifact names, aliases,
mission names, planetary bodies and NSSDCA identifiers.

#### Compare Artifacts

Enables side-by-side comparison of mission characteristics and artifact
afterlife information.

### B. Follow the Stories

#### Storybook

Every artifact has a five-chapter narrative experience.

It combines:

- Original archival wording.
- Plain-language explanations.
- Chapter-specific source references.
- Browser-based narration and a text-based captions alternative.

#### Narration Player

Uses the browser Web Speech API to make artifact stories accessible through
three narration styles:

- Documentary.
- Young Explorer.
- Scientific Deep Dive.

It supports voice selection, speech-rate adjustment and sentence highlighting,
subject to browser speech capabilities. The player also provides:

- Documentary, Young Explorer and Scientific Deep Dive modes.
- Current-scene display synchronized with the narrated chapter.
- Play, pause, resume, stop and sentence-level seeking.
- Previous- and next-chapter controls.
- Saved narration position per artifact and narration style.
- A graceful captions-only fallback when Web Speech is unavailable.
- Clear disclosure that generated narration is educational text, not a
  historical recording or synthesized astronaut/radio dialogue.

#### Time Machine

An interactive chronological exploration of mission events, helping visitors
understand how an artifact's operational history developed.

#### Science Reveal

Connects spacecraft hardware, experiments and observations with their resulting
scientific discoveries.

#### Afterlife and Legacy

Explores what happened after mission operations ended, including documented
final mission events, operational status and the historical significance of
what remains.

#### Guided Routes

Provides ordered, curated exploration journeys that connect related artifacts
and mission histories.

### C. Learn by Investigating

#### Artifact DNA

A hardware-focused explorer that introduces visitors to artifact components and
their engineering significance.

#### Evidence Detective

An interactive claim-evaluation activity in which visitors assess
mission-related statements and receive feedback supported by evidence.

#### Space Archaeologist

A guided, seven-step investigation encouraging visitors to examine an artifact
through its characteristics, location, mission context and historical evidence.

#### Fact Vault

A searchable collection of sourced facts with filters covering:

- Mission.
- Engineering.
- Science.
- History.
- Location.

#### Unknowns Observatory

Highlights information that historical records do not establish.

It distinguishes documented uncertainty from information that is simply absent
from the current dataset, helping prevent unsupported conclusions.

#### Explore Deeper

Provides source-grounded information retrieval over the curated artifact
records, retaining the source context for the available information.

#### Legacy Bridge

Connects related artifacts and historical developments through their documented
relationships.

#### Space Heritage

Introduces broader space-heritage considerations through educational content
and an interactive future-mission decision activity.

#### NASA Resources

Provides provenance information, source references, limitations and relevant
attribution notes.

### D. Support Learners and Educators

#### Discovery Passport

Provides anonymous, browser-local learning progress tracking.

It includes:

- Explored artifacts.
- Completed learning activities.
- Saved artifacts.
- Achievement badges.

Progress is stored using browser `localStorage`. No visitor account is required.

#### Teacher Mode

Provides educator-oriented learning material and an optional printable
classroom kit.

It helps translate artifact exploration into structured classroom activities.

#### Accessibility Support

The interface incorporates:

- Keyboard-friendly interactions.
- Screen-reader-oriented labels.
- Visible loading and error states.
- Reduced-motion support.
- Responsive layouts.
- Browser-based narration with a text-based alternative.

#### Offline Demo Mode

Echoes can continue operating when its API is unavailable by using the local
curated archive.

The interface visibly identifies this fallback experience as **DEMO MODE**,
distinguishing it from the API-backed experience.

### Implemented feature integrations

The feature integration layer is implemented and wired into the React
application. The registry discovers the following production components:

| Integration | Implementation |
| --- | --- |
| NSSDCA Archive Atlas | `frontend/src/features/atlas/AtlasFeature.tsx` |
| Moon Artifact Storybook | `frontend/src/features/story/StoryFeature.tsx` |
| Mars Artifact Storybook | `frontend/src/features/story/StoryFeature.tsx` |
| Mission Timeline & Afterlife | `frontend/src/features/afterlife/AfterlifeFeature.tsx` |
| Science-to-Discovery Reveal and Evidence | `frontend/src/features/science-evidence/ScienceEvidenceFeature.tsx` |
| Mission Debrief | `frontend/src/features/science-evidence/MissionDebriefFeature.tsx` |
| Guided Story Route | `frontend/src/features/guided-route/GuidedRouteFeature.tsx` |

These are not placeholder interfaces. Each registration is loaded through the
typed feature registry, receives shared archive data from the parent
application and has integration coverage that mounts the real component and
verifies its user-facing output. The registry's fallback components are
development-safe error states only; they are not the normal application
experience.

## 6. Evidence, Data Integrity and Scientific Responsibility

Accuracy is a core design principle of Echoes.

The platform follows these data principles:

1. NSSDCA master-catalog records serve as the archival source of truth.
2. Original archival wording and plain-language explanations are maintained
   together.
3. Claims, story chapters, timeline events, discoveries and quiz explanations
   retain source IDs.
4. NSSDCA identifiers and source URLs are validated during startup.
5. Location precision is never inferred beyond the source record.
6. Parent-child relationships and guided-route ordering are validated.
7. Quiz integrity is checked.
8. Unverified records are excluded from the normal public exploration
   experience.
9. Public quiz responses do not expose answer keys; evaluation happens through
   the API after answer submission.

### Why Uncertainty Matters

Historical documentation does not always establish the present physical
condition of equipment on the Moon or Mars.

Echoes therefore avoids treating missing information as confirmed information.

Location confidence, documented uncertainty and archive review status are
represented explicitly.

This approach allows visitors to explore space heritage while understanding the
limits of the available evidence.

## 7. Technical Architecture

Echoes is implemented as a TypeScript monorepo with a separation between the
frontend, backend, curated archive and shared contracts.

### Technology Stack

| Layer | Technologies |
| --- | --- |
| Frontend | React, TypeScript, Vite |
| Backend | Node.js, Express, TypeScript |
| Validation | Zod |
| Testing | Vitest |
| Package management | npm workspaces |
| Narration | Browser Web Speech API |
| Data storage | Curated local JSON archive |
| Progress storage | Browser `localStorage` |

### Repository Structure

```text
backend/
    Express API
    Validation
    Services
    Routes
    API tests

data/
    Source-linked artifact archive
    Guided routes
    Quiz JSON

frontend/
    React application
    Learning modules
    UI components
    Frontend tests

scripts/
    Development runner
    API smoke test

shared/
    TypeScript types
    Zod schemas
    Catalog helpers
    Quiz logic
```

### Frontend and Backend Communication

The frontend is responsible for the user experience, feature navigation,
loading states, artifact selection, error handling and source navigation.

The Express backend exposes REST endpoints for archive search, artifact
retrieval, guided routes and quiz evaluation.

Shared TypeScript contracts and Zod schemas maintain consistent data structures
and validation across the application. The frontend API client applies request
timeouts, validates success envelopes, reports typed request failures and
automatically uses the verified local archive when the API is unavailable.

### API Endpoints

All endpoints are prefixed with `/api/v1`.

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/health` | Service status and dataset counts |
| `GET` | `/catalog/search?q=&body=` | Search verified archive records |
| `GET` | `/artifacts` | Filter and list artifacts |
| `GET` | `/artifacts/:slug` | Retrieve an individual verified artifact |
| `GET` | `/routes` | List curated routes |
| `GET` | `/routes/:slug` | Retrieve an ordered route |
| `GET` | `/quizzes/:artifactSlug` | Retrieve a quiz without answer keys |
| `POST` | `/quizzes/:artifactSlug/answer` | Evaluate a submitted answer |

### Backend Reliability and Validation

The backend includes:

- Request and data validation using Zod.
- Consistent success and error response envelopes.
- Centralised error handling.
- Dataset integrity validation during startup.
- Duplicate identifier and relationship checks.
- Source-reference validation.
- Server-side quiz answer evaluation.

The application also supports an offline local-data fallback when the API is
unavailable.

## 8. How to Run the Project

### Requirements

- Node.js 20 or newer.
- npm.

### Installation

Clone the repository:

```bash
git clone https://github.com/yukthasmayya8/Echoes-Off-World-Field-Guide.git
cd Echoes-Off-World-Field-Guide
```

Install dependencies:

```bash
npm install
```

Start the application:

```bash
npm run dev
```

Open the frontend at <http://localhost:5173>.

The backend API is available at <http://localhost:4000/api/v1>.

### Environment Configuration

To configure a different API host:

```bash
cp frontend/.env.example frontend/.env
```

| Variable | Description |
| --- | --- |
| `VITE_API_BASE_URL` | API base URL, including `/api/v1` |
| `VITE_API_TIMEOUT_MS` | Request timeout in milliseconds; defaults to `8000` |

### Useful Commands

```bash
npm run dev
npm run dev:frontend
npm run dev:backend

npm run typecheck
npm test
npm run build

npm start
node scripts/smoke.mjs
```

The frontend build and integration tests cover the implemented feature
registrations, including both Storybook variants. Run `npm run build` and
`npm test` from the repository root to verify the current application.

### Production deployment on Netlify

The production frontend is hosted at
[Explore Echoes- Live Application](https://echoes-off-world-field-guide.netlify.app/).

The repository root contains a `netlify.toml` that configures the production
build:

- Build command: `npm run build`
- Publish directory: `frontend/dist`
- Node version: `20`

The production build reads `VITE_API_BASE_URL` at build time, so the deployed
backend base URL (including the `/api/v1` prefix) must be set for the live
frontend to reach the API.

- `netlify.toml` sets
  `[context.production.environment] VITE_API_BASE_URL = "https://echoes-off-world-field-guide.onrender.com/api/v1"`
  for the production build.
- If no live backend is deployed, the production build falls back to the local
  default (`http://localhost:4000/api/v1`) and the app automatically uses the
  verified local archive dataset when the API cannot be reached.

The Netlify SPA fallback is configured in `netlify.toml`:

```toml
[[redirects]]
  from = "/api/v1/*"
  to = "https://echoes-off-world-field-guide.onrender.com/api/v1/:splat"
  status = 200

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

The backend must allow the deployed frontend origin through CORS by setting
`CORS_ORIGIN` on the backend host:

- Local development: `CORS_ORIGIN=http://localhost:5173`
- Production: `CORS_ORIGIN=https://echoes-off-world-field-guide.netlify.app`

See `backend/.env.example` for the backend environment template.

## 9. Project Scope and Current Limitations

Echoes is a working prototype with an intentionally bounded archive.

The current implementation uses curated JSON records rather than a live,
continuously synchronised NASA database.

The Planetary Atlas uses the location information available in the archive and
should not be interpreted as a live planetary imaging or terrain-mapping
service.

Explore Deeper performs source-grounded retrieval over the curated records and
retains their source context.

Discovery Passport progress is stored locally in the visitor's browser rather
than in a central user database.

The archive currently contains four verified artifacts and one record awaiting
review.

These boundaries are intentional parts of the prototype's current scope.
Future development can expand the archive, improve geospatial exploration, add
educational activities and strengthen accessibility while preserving the
evidence-first approach.

## 10. Our Vision

A spacecraft may stop operating, but the knowledge produced by its mission
continues to influence exploration.

Echoes aims to preserve that connection between the machines left behind and
the scientific progress they helped make possible.

By making archival information explorable, understandable and traceable, we
hope to encourage younger audiences to see space exploration not merely as a
collection of successful missions, but as a continuing story of engineering,
scientific investigation and discovery.

The hardware may remain behind. Its legacy should move forward.

## 11. Team Nullorbit

Developed by **Team Nullorbit** for the **NASA Space Apps Challenge 2026**.

- Ankitha Shanubhogh
- Navya Poojary
- Neha H
- Sanjana Desai
- Shravya
- Yuktha S Mayya

**AI Assistance Disclosure:** AI-assisted tools, including OpenCode, GitHub Copilot, were used during development for coding, debugging, and troubleshooting. The team reviewed and integrated the generated contributions into the project.

## 12. License and Attribution

NASA data and mission information remain subject to their original source
terms.

Refer to the in-app NASA Resources module and linked archival records for
provenance, source attribution and relevant limitations.

This project is an independent educational prototype developed for the NASA
Space Apps Challenge. It is not an official NASA product or service.
