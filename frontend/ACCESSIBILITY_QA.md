# Accessibility QA – Mission Debrief

Target: WCAG 2.2 Level AA. Run `npm test` (automated), then the manual checks below
and record results in the table. Repeat for every new feature merged into the shell.

## Built-in behaviours (what the code does)
- Native `fieldset`/`legend` + radio inputs: arrow keys, Space, screen-reader group names for free.
- Submit is never silently disabled; an empty submit shows a `role="alert"` message.
- Focus moves only after a user action: to feedback after submit, to the question heading after "Next", to the results heading at the end. Never on first load.
- Correct/incorrect is shown by text ("Correct", "Not quite", "Correct answer", "Your answer"), not by colour alone.
- Targets ≥ 44 px, 3 px high-contrast focus ring, `prefers-reduced-motion`, `forced-colors`, reflows to 320 px.
- Loading = `role="status"`, errors = `role="alert"`, no raw stack traces.
- Switching artifact remounts the debrief (`key={artifactSlug}`) so no stale score/answer remains.

## Automated (Vitest + vitest-axe)
Covers: axe on question and feedback views, labelled radio group, arrow-key selection,
focus management, empty/loading/error/demo states, evaluator failure, stale-state reset.
**Add to the shell's integration tests:** run `axe` on the full page (landing → atlas → debrief) because
page-level rules (landmarks, one `h1`, skip link, heading order) can't be checked on a single feature.

## Manual checklist
| # | Check | WCAG | Pass? |
|---|-------|------|-------|
| 1 | Complete the whole debrief with keyboard only (Tab, arrows, Space, Enter) | 2.1.1 | |
| 2 | Focus ring visible on every control, never hidden by sticky headers/drawers | 2.4.7, 2.4.11 | |
| 3 | Tab order follows visual order; opening the Source drawer returns focus to the "View source" button on close | 2.4.3 | |
| 4 | NVDA + Firefox/Chrome (Win): question group name, selected state, feedback read once, score announced | 4.1.2, 4.1.3 | |
| 5 | VoiceOver + Safari (macOS/iOS): same as above; TalkBack on Android | 4.1.2 | |
| 6 | Zoom 200% and 400% / 320 px width: no horizontal scroll, nothing clipped | 1.4.10 | |
| 7 | Text spacing override (line 1.5, paragraph 2×, letter 0.12em, word 0.16em): nothing lost | 1.4.12 | |
| 8 | Contrast: text ≥ 4.5:1, UI borders/focus ≥ 3:1 (check with real Echoes theme tokens) | 1.4.3, 1.4.11 | |
| 9 | Windows High Contrast / forced colors: options, feedback, buttons still distinguishable | 1.4.11 | |
| 10 | OS "reduce motion" on: no animation anywhere in the feature | 2.3.3 | |
| 11 | Touch targets ≥ 24 px (we use 44 px) on a phone, no hover-only info | 2.5.8 | |
| 12 | Backend down → DEMO MODE text visible and announced in reading order | 3.3.1 | |
| 13 | Wrong answer: feedback states the right answer and explanation in text | 3.3.1 | |
| 14 | Language attribute `lang="en"` set by the shell; sources with other languages marked | 3.1.1, 3.1.2 | |

## Known limits / handoff to Member 1
- Page-level landmarks, skip link and `h1` belong to the app shell.
- The Source drawer must trap/restore focus (owned by `components/SourceDrawer`).
- jsdom can't compute colour contrast; item 8 must be verified in a real browser (axe DevTools / Lighthouse).
