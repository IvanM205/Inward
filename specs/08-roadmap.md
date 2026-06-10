# 08 — Roadmap & Milestones

Each milestone ships a usable, covenant-compliant app. Definition of done includes:
all referenced requirement IDs implemented with passing ACs, invariants tests green
(NFR-A1..A5), accessibility pass, copy review against 06 §Copy voice.

## M0 — Skeleton & covenant rails (2–3 wks)
- Project setup, CI with dependency lint (NFR-P3) and grep-gates (NFR-A4).
- Encrypted storage + `eraseAll()` (NFR-P4); design tokens + core components
  (`TerminalScreen`, `QuestionCard`, buttons).
- Notification scheduler with hard 2-slot limit (NTF-01, NFR-A2).
- Route-graph terminal-screen test harness (NFR-A3).

## M1 — The daily spine (3–4 wks)
- ONB-01..03, ONB-05 (breath, sentence, permissions; no intake yet).
- Threshold + morning/evening flows (THR-01..03), Reflection storage, NeedleView.
- Living Journal core: manual entries, evening fold, widget capture
  (JRN-01..03, JRN-05 minus circles).
- Quiet: Unplug Mode (QUIET-01), sleep wind-down (QUIET-04).
- **Exit criteria**: a person can live the 3-touch day fully offline.

## M2 — The Mirror & the score (3–4 wks)
- Intake quiz mode (ONB-04 quiz path), question bank bundle, scoring engine
  (04 complete, fixture test 04 §8), ChannelScore/ExtractionLevel, Portrait
  (MIR-01..05), explanation refs.
- Safety: crisis classifier + help-first routing for intake (SAFE-01..04).
- Journal evidence offset wired into weekly recalc; "How the score works" page (NFR-P5).
- Threat model (NFR-P6).

## M3 — The Untangling & the Library (4 wks)
- Threads, vow wizard, micro-acts, dare ladder, graduation, relapse mercy
  (PLAN-01..04); Build One Thing (PLAN-05).
- Craving Button full flow + widgets (CRAVE-01..03).
- Library: One Deep Thing, Paths, e-book rhythm, quizzes (LIB-01..05); content
  pipeline with signed OTA bundles (02 §Content, NFR-R2).
- Weekly Realignment with Ledger (RLG-01..02; screen-time integration).
- Dopamine Detox + Stillness Switch (QUIET-02..03).

## M4 — Companion, Circles, Open Hand (4–5 wks)
- Companion with privacy gateway, persona, session ending, Evidence reflection,
  refusals, safety routing (COMP-01..05; intake chat mode of ONB-04).
- Circles E2E (CIR-01..02; ADR-002 decided in M2).
- Open Hand ask + payments + supporter count (OPEN-01..05).
- Localization SK; accessibility audit; store submission.

## Post-launch (not in scope for agents now)
Reverse-retention report pipeline (privacy-preserving, opt-in aggregate), Torch
referral program, printed-book milestone rewards, ambassador program.

## Working agreements for agents
- One PR per requirement ID where feasible; PR description: ID, AC checklist, screenshots.
- New ideas → `decisions/ADR-NNN.md` with a Covenant Test section (INV-1..9 walk-through).
- Copy changes require the 06 §Copy voice checklist in the PR.
- Never merge with a red invariant test. There are no exceptions, including demos.
