# Echoes — Off-World Field Guide

> **A story-driven, evidence-first field guide to the NASA hardware that
> remains on the Moon and Mars.**

**Echoes** is the prototype created by **Nullorbit** for the **NASA Space Apps
Challenge 2026**, Challenge 1: **“Abandoned but not Forgotten: Storytelling
about NASA’s Discarded Equipment on the Moon and Mars.”**

The project turns archival mission records into an explorable learning
experience for school-age space enthusiasts, educators, and curious explorers.
Instead of treating retired spacecraft as discarded objects, Echoes presents
them as the starting point for understanding the engineering, missions, people,
and scientific discoveries they made possible.

## The challenge

NASA has left spacecraft, landers, rovers, instruments, descent stages, and
other mission hardware across the Moon, Mars, and deep space since the 1960s.
Many completed their planned work, while others stopped communicating or have
an uncertain final status.

The challenge asks participants to tell the story of some or all of this
equipment in a way that:

- introduces young audiences to the hardware and the science behind it;
- connects engineering decisions to scientific knowledge;
- makes the stories engaging and accessible;
- remains accurate and clear about uncertainty.

## Our solution: Echoes

Echoes is an interactive digital field guide that lets visitors investigate
off-world artifacts through maps, narratives, timelines, evidence challenges,
and guided learning activities.

The experience is built around a simple journey:

1. **Find** a spacecraft or mission through the Planetary Atlas or global
   search.
2. **Understand** its mission through a narrated five-chapter story and
   interactive timeline.
3. **Connect** its hardware to the discoveries and engineering lessons it
   enabled.
4. **Investigate** claims using source trails, evidence challenges, and
   documented unknowns.
5. **Remember** the artifact through comparisons, routes, progress badges, and
   classroom activities.

This approach solves the challenge by combining emotional storytelling with
traceable evidence. A visitor can be inspired by an artifact’s story without
losing sight of what is verified, what is approximate, and what remains
unknown.

## Current archive

The prototype currently includes a verified, source-linked archive covering:

- **Apollo 11 Lunar Module Eagle** — Moon
- **Surveyor 3** — Moon
- **Mars Pathfinder Lander (Sagan Memorial Station)** — Mars
- **Sojourner** — Mars

The dataset also contains **Apollo 12 Lunar Module Intrepid** as a
`needs_review` record. It is intentionally excluded from normal search,
details, routes, and quizzes until its review status is resolved.

Curated routes currently include:

- **The Moon: What We Left Behind**
- **Mars: A Lander and Its Rover**

## Features

### Explore and orient

- **Mission Control dashboard** for a focused starting point.
- **Planetary Atlas** with Moon and Mars location views, confidence markers,
  text fallback, and a selected-location panel.
- **Global Search** across the verified archive and learning modules.
- **Compare Artifacts** for side-by-side mission and afterlife comparisons.

### Follow the stories

- **Storybook** with five chapters per artifact, narration, original archive
  wording, and plain-language explanations.
- **Time Machine** for interactive mission chronology.
- **Science Reveal** for the path from hardware and experiments to discoveries.
- **Afterlife and legacy views** that explain what happened after operations
  ended and why the site still matters.
- **Guided Routes** that connect related artifacts into ordered journeys, such
  as the Mars Pathfinder lander and Sojourner.

### Learn by investigating

- **Artifact DNA** for a hardware-focused explorer.
- **Evidence Detective** for evaluating mission claims.
- **Space Archaeologist** for a guided, seven-step investigation.
- **Fact Vault** for searchable, sourced facts.
- **Unknowns Observatory** for clearly separating documented uncertainty from
  missing dataset information.
- **Explore Deeper** for source-grounded retrieval rather than an
  unsourced generative chatbot.
- **NASA Resources** for provenance, limitations, and compliance notes.

### Support learners and educators

- **Discovery Passport** with anonymous, local progress tracking and badges.
- **Teacher Mode** with an optional printable classroom kit.
- Browser-based **Web Speech narration** in three styles.
- Keyboard-friendly interactions, visible loading and error states, reduced
  motion support, responsive layouts, and screen-reader-oriented labels.
- **Offline demo mode** so the field guide remains usable when the API is
  unavailable. The interface visibly labels this state as **DEMO MODE**.

## Evidence and data principles

Accuracy is a core product feature, not an afterthought.

- NSSDCA master-catalog records are the archive source of truth.
- Original wording and plain-language explanations are stored together.
- Claims, story chapters, timeline events, discoveries, and quiz explanations
  retain source IDs.
- NSSDCA identifiers and source URLs are validated at startup.
- Location precision is never inferred beyond the source record.
- Parent/child relationships, route ordering, and quiz integrity are checked.
- Unverified records are kept out of the normal public experience.
- Public quiz responses do not expose answer keys; answers are evaluated by the
  API after submission.

## Technical architecture

Echoes is a TypeScript monorepo with a clear separation between the archive,
API, application, and shared contracts:

```text
backend/     Express API, validation, services, routes, and API tests
data/        Source-linked archive, guided routes, and quiz JSON
frontend/    React/Vite field guide and frontend tests
scripts/     Development runner and live API smoke test
shared/      TypeScript types, Zod schemas, catalog helpers, and quiz logic
```

### Technology stack

- React and Vite
- TypeScript
- Express
- Zod validation
- Vitest
- npm workspaces
- Browser Web Speech API
- Local JSON archive with an API-backed and offline fallback experience

The parent application owns loading, selection, errors, source navigation, and
API calls. Feature components remain focused and presentational, and lazy
feature registration keeps the shell extensible.

## Quick start

### Requirements

- Node.js 20 or newer
- npm

### Run the prototype

```bash
npm install
npm run dev
```

Open <http://localhost:5173>. The API runs at
<http://localhost:4000/api/v1>.

To configure a different API host, copy the example environment file and edit
the values:

```bash
cp frontend/.env.example frontend/.env
```

Available settings:

- `VITE_API_BASE_URL` — API base URL, including `/api/v1`.
- `VITE_API_TIMEOUT_MS` — request timeout in milliseconds; defaults to `8000`.

### Useful commands

```bash
npm run dev              # Start the frontend and backend together
npm run dev:frontend     # Start only the Vite frontend
npm run dev:backend      # Start only the Express API
npm run typecheck        # Type-check shared, backend, and frontend packages
npm test                 # Run backend and frontend tests
npm run build            # Create production builds
npm start                # Start the built backend
node scripts/smoke.mjs   # Exercise the live API end to end
```

## API

All responses use a consistent success or error envelope.

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/api/v1/health` | Service status and dataset counts |
| `GET` | `/api/v1/catalog/search?q=&body=` | Search verified archive records |
| `GET` | `/api/v1/artifacts` | Filter and list artifacts |
| `GET` | `/api/v1/artifacts/:slug` | Retrieve one verified artifact |
| `GET` | `/api/v1/routes` | List curated routes |
| `GET` | `/api/v1/routes/:slug` | Retrieve an ordered route |
| `GET` | `/api/v1/quizzes/:artifactSlug` | Retrieve a quiz without answer keys |
| `POST` | `/api/v1/quizzes/:artifactSlug/answer` | Evaluate a submitted answer |

## Team Nullorbit

Echoes was created by **Nullorbit**:

- Ankitha Shanubhogh
- Navya Poojary
- Neha H
- Sanjana Desai
- Shravya
- Yuktha S Mayya

## Project status

Echoes is a working prototype for the NASA Space Apps Challenge 2026. Its
archive is intentionally bounded and evidence-led: a small number of
well-documented records are preferable to a larger collection that blurs
source quality or uncertainty.

Future expansion can add more NASA artifacts, richer geospatial data, more
classroom activities, and additional accessibility and language support while
preserving the same source-traceability rules.

## License and attribution

NASA data and mission information remain subject to their original source
terms. Consult the in-app **NASA Resources** module and the linked source
records for provenance and attribution details.
