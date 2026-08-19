# Take-home: Extraction Review Console

## Context

At Alma, a lot of what our users see is the output of a machine, not a human.
Documents get read by an extraction pipeline, and someone has to check the
result before it reaches a government filing. Getting a field wrong is not a
cosmetic bug — it is a rejected petition.

This exercise is that screen.

## The problem

An extraction pipeline has read two documents for one case — a passport and a
Form G-28 — and produced **34 structured fields**. Each field carries a value, a
confidence score, and a span pointing at the region of the document it came
from.

A paralegal now has to verify all 34 against the source, correct what is wrong,
and commit the result. They do this dozens of times a day, and a wrong field is
worse than a slow review.

## The goal

Build the screen they would use. In their words:

1. I see the document and the extracted fields side by side, so I can verify
   without switching windows.
2. I click a field and see exactly where in the document it came from.
3. I can tell how confident the extraction is, so I know where to spend
   attention.
4. I accept, correct, or reject each field.
5. I bulk-accept the ones above a confidence threshold, so I only hand-touch the
   uncertain ones.
6. I get through all 34 fields from the keyboard, without reaching for the
   mouse.
7. I re-run extraction when a document is re-scanned, and watch results update
   as they arrive.
8. I never silently lose a correction I already made.
9. I cannot walk away with unsaved work without being told.

That is more than fits comfortably. Deciding what to cut is part of the
exercise.

## What you are given

You should not need to write a backend, render a PDF, or style a select.

- A **mock API** with the extraction, per-field updates, a re-run endpoint that
  streams, and save. Full reference in [API.md](./API.md).
- A **`<DocumentCanvas>`** component that renders the document and draws
  highlight rects you pass it, with zoom and scroll-into-view already working.
- **UI primitives** in `lib/ui` — button, input, select, checkbox, dialog,
  popover, tooltip, toggle group, badge, separator.
- A **typed API client** with zod schemas, in `lib/api`.
- **Vitest, Testing Library and Playwright**, configured, with one green test
  each.

`app/page.tsx` loads the data and renders the document. It is a starting point,
not a foundation — delete as much of it as you like.

```bash
nvm use          # Node 20+
npm install
cp .env.example .env
npm run dev      # web on :3000, mock API on :4000
```

```bash
npm run typecheck && npm run lint && npm test
npx playwright install chromium && npm run test:e2e
```

## Deliverables

1. **The screen**, in a private GitHub repository shared with
   **shuo@tryalma.ai** and **adam.k@tryalma.ai**, with clear setup
   instructions — fix ours if they are wrong.
2. **A design doc** (~1 page). What you built, what you cut and why, and how you
   resolved the two decisions this brief does not answer: what happens when a
   streamed value lands on a field the user has already edited, and how you show
   uncertainty without overstating it.
3. **A coding-agent usage doc**: a one-page summary of how you used a coding
   agent — how you planned the work, where you steered it off a bad path, what
   you caught reviewing its output, and how you verified the result.
   Representative prompts or transcript excerpts are welcome.
4. **A recording, 5 minutes or less**, of you _using_ the thing. Narrate what we
   are looking at. Most of what matters here is behavioural and does not survive
   a static read of the diff.

## Before you send it

Play back the recording from the link you are about to share and confirm it
plays, has audio, and runs under five minutes. This is our most commonly missed
item.

Then clone your own repo into an empty directory and follow your own setup
instructions. This is the second most commonly missed item.

## Constraints

- **Scope deliberately.** Tell us what you decided was in scope, what you left
  out, and why. A documented cut reads as judgment; a silent omission does not.
- **React and TypeScript are fixed. Everything else is negotiable.** Swap
  TanStack Query, add a table library, restructure the folders — just say why.
  An unexplained swap reads as drift; a justified one reads as judgment.
- **Do not edit `fixtures/`.** Every submission works from the same data.
- Do not sink time into auth, routing, multi-document support, or a design
  system. None of it is assessed.
- We think this is about **five hours** of work. That is a guardrail for you, not
  a test — we do not measure it and we cannot see it. Split it across evenings,
  pause for your actual job. Just tell us roughly how long you spent and what
  you would do with another two hours.

## What we evaluate

Roughly in this order:

1. **State modelling.** What is server truth, what is local, and what happens
   when they disagree.
2. **Async correctness.** Cancellation, races, retries, out-of-order responses,
   in-flight work the user has moved on from.
3. **Uncertainty and provenance.** Whether the screen helps someone decide, or
   just prints the numbers it was given.
4. **Interaction quality.** Keyboard, focus, and whether a fast user can go
   faster than the mouse allows.
5. **How you drove the agent**, and what you built that we did not ask for — and
   what you deliberately left out.

Assume the code compiles and the screenshots look fine. With an agent that is
table stakes, and it is not what separates submissions.

## A note on sources

Use whatever you want online, and use your coding agent — we expect you to.
Just do not get help from another person; we are assessing your work, not
theirs.

## Ambiguity

Ambiguity in this brief is sometimes deliberate, so tell us how you resolved it.
A reasonable answer is preferred over the "right" answer here.
