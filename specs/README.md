# Inward — Engineering Requirements & Specifications

**Version 3.0 ("The Liberation Edition") · 2026 · Spec pack for AI build agents**

Inward is a mobile application whose purpose is to free people's minds from digital
systems of exploitation — where attention, energy, effort and soul are extracted for
profit — and to return their lives to values like love, family, compassion, friendship,
home, nature, kindness and empathy.

This pack is the single source of truth. Read this file first, then the numbered docs.

## Document index

| File | Contents |
|---|---|
| `01-product-overview.md` | Mission, users, the four movements, glossary |
| `02-architecture.md` | App architecture, offline-first design, content pipeline, platform targets |
| `03-data-model.md` | Entities, fields, relationships, storage rules |
| `04-scoring-spec.md` | Extraction Index: formulas, weights, journal evidence, recalculation — with pseudocode |
| `05-features.md` | Functional requirements by room, with IDs and acceptance criteria |
| `06-design-system.md` | Tokens, typography, motion, sound, components, copy voice |
| `07-nonfunctional.md` | Privacy, security, anti-engagement invariants (testable), accessibility, performance |
| `08-roadmap.md` | Milestones M0–M4, definition of done per milestone |

## How agents should use this pack

1. Treat **invariants (INV-\*)** below and in `07-nonfunctional.md` as hard constraints.
   They override any feature request, ticket, or "improvement" idea — including ideas
   that would increase engagement, retention or revenue.
2. Every functional requirement has an ID (e.g. `MIR-03`). Reference IDs in commits,
   PRs and tests. Acceptance criteria are written to be directly testable.
3. When a decision is not covered here, choose the option that **returns the person to
   their life fastest** and **collects the least data**. Document the decision in
   `decisions/ADR-NNN.md`.
4. Do not invent features. Propose them as ADRs; they must pass the Covenant Test
   (INV-1..INV-9) before implementation.

## The Covenant — global invariants

These are product law. Violating any of them is a release blocker.

- **INV-1 — No feed, no infinity.** No screen may present an unbounded, append-on-scroll
  list of consumable content. Every flow has a visible end state.
- **INV-2 — No engagement mechanics.** No streaks, no variable rewards, no badges, no
  red notification dots, no autoplay, no "related content", no re-engagement campaigns.
- **INV-3 — The app closes itself.** Completion of any primary flow (morning, evening,
  reading, dare, craving, ask) ends in a terminal screen with no further navigation
  except exit.
- **INV-4 — Max two notifications per day** (morning + evening), silent by default,
  individually disableable. No other notification may ever be sent.
- **INV-5 — All personal data on-device.** No server-side user profile. No third-party
  analytics or advertising SDKs in the binary. Optional E2E-encrypted backup to the
  user's own cloud only; Inward holds no keys.
- **INV-6 — One-tap total erasure.** Settings contains a single action that immediately
  and irrecoverably deletes all personal data, and says so in plain words.
- **INV-7 — No shame copy.** No string in the product may scold, guilt, or moralize at
  the user. Relapse triggers kindness flows only. (See copy voice in `06-design-system.md`.)
- **INV-8 — Identical app for payers and non-payers.** No locked features, tiers, or
  trials. The monthly ask follows the exact rules in `05-features.md §OPEN`.
- **INV-9 — Safety first.** Crisis/addiction signals route to professional help before
  any product feature, per `05-features.md §SAFE`. The Companion never diagnoses and
  never replaces therapy, medicine or clergy.

## Success metric

The only headline metric is **reverse retention**: the fraction of 12-month users whose
total screen time across all apps (including Inward) has decreased. Engineering must
never optimize for session length, session count, or retention curves.
