# Echoes – Mission Debrief + Accessibility QA (Member 6)

Frontend for the **Mission Debrief quiz** (`MissionDebriefFeature`) with a built-in accessibility test suite.

## Run
```bash
npm install
npm run dev        # standalone preview with sample (demo) data
npm test           # unit + axe accessibility tests
npm run build      # typecheck + build
```

## Drop into the Echoes repo
Copy into `frontend/src/`:
- `features/science-evidence/MissionDebriefFeature.tsx`, `.module.css`, `debriefStorage.ts`, `__tests__/`
- Merge `types/index.ts` into the shared types file (Member 1 owns it).
- Dev-only: `dev/sampleQuiz.ts` (used by tests) – delete once the backend quiz is wired.
- Add dev dependencies `vitest`, `jsdom`, `@testing-library/*`, `vitest-axe` (needs team approval) and `test/setup.ts`.

## Contract
```ts
MissionDebriefFeature({ quiz, onOpenSource })            // agreed contract
// optional extras – need Member 1's approval:
//   evaluateAnswer(slug, questionId, optionIndex) -> Promise<AnswerResult>   (wrap POST /quizzes/:slug/answer)
//   isDemoMode, isLoading, errorMessage, onComplete
```
- The component never fetches. Without `evaluateAnswer`, it evaluates locally **only** if the question carries
  `correctOptionIndex` + `explanation` (local fallback / demo mode). The backend must not send those in public responses.
- Best score is stored in `localStorage` (`echoes:debrief:best:<slug>`), failing silently if storage is blocked.
- `src/dev/sampleQuiz.ts` is placeholder content: replace with verified questions from `quizzes.json`.

See `ACCESSIBILITY_QA.md` for the manual QA checklist.
