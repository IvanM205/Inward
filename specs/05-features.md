# 05 — Functional Requirements

Format: `ID — requirement` followed by acceptance criteria (AC). All flows obey the
global invariants (README). "Terminal screen" = dark screen, one serif line, only exit.

---

## ONB — Onboarding (first launch)

- **ONB-01** First screen is a black screen with a 10-second guided breath animation;
  nothing tappable until it completes (skippable after 3 s via subtle control).
  - AC: cold start → breath screen; no permission prompts before it.
- **ONB-02** Then one sentence ("You were not made to be harvested."), then one question.
- **ONB-03** Honest permissions screen: notifications (max 2/day stated), screen-time
  access. Each individually refusable; refusal degrades nothing except the dependent
  signal. No other permission requested in v1.
- **ONB-04** Intake: ~24–40 adaptive questions (~15 min) in quiz mode or Companion
  chat mode; switchable mid-way; pausable/resumable ≤ 14 days; every question skippable.
  - AC: abandoning intake leaves app fully usable; Mirror shows "waiting" state.
- **ONB-05** No account, no email, no sign-in anywhere in v1.
- **ONB-06** Portrait shown (see MIR), then first-thread selection (see PLAN), then
  terminal screen: "That is enough for today. Go live." App closes itself (INV-3).

## THR — Threshold (home)

- **THR-01** Shows ≤ 3 elements: due Compass (morning/evening), Today's Opening, one
  quiet line. Nothing else, ever.
- **THR-02** Morning flow (user-set hour, default 07:30): one question — "What will you
  give your attention to today?" — answered in one line or one chosen word, then
  Today's Opening revealed, then terminal screen. Total target ≤ 60 s.
- **THR-03** Evening flow (user-set hour, default 21:30): direction reflection (one tap
  on a spirit↔matter spectrum, optional line), optional 0–3 gratitudes, journal prompts
  (JRN-02), the Needle, optional hand-off to wind-down. Target ≤ 60 s + journaling.
- **THR-04** Today's Opening: exactly one act/day from the active thread (swap, dare,
  practice, or person to reach); finishable today; completing it writes Evidence and
  ends in terminal screen.

## MIR — Mirror

- **MIR-01** Extraction Index per `04-scoring-spec.md`; twelve channels, bands shown,
  raw numbers behind one tap.
- **MIR-02** Portrait is a single non-scrolling page (or strictly bounded): free /
  leaking / caught groupings, one mechanism line per captured channel, one orientation
  sentence, one suggested first thread.
- **MIR-03** Explainability: tapping any band lists the user's own answers
  (`explanation_refs`) that built it.
- **MIR-04** Export: portrait → private PDF (local share sheet). The only shareable
  variant is the coarse channel-free funnel quiz result, opt-in.
- **MIR-05** Re-measure: on demand and at season boundaries (short re-intake ≤ 10
  questions for the active thread's Pull items).

## PLAN — Untangling

- **PLAN-01** Exactly one active thread; selecting a new one requires
  graduating/pausing the current.
- **PLAN-02** Thread setup wizard: map cue→routine→reward in user's words; write the
  when–then vow; pick a < 5-min micro-act; pick/edit the 7-rung dare ladder (templates
  from content bundle; custom dares via Companion).
- **PLAN-03** Phone-redesign checklist (one-time, optional): greyscale, badges off,
  feed apps off home screen, Inward widget placement. Each step is a deep link or
  instruction; completion stored, never nagged.
- **PLAN-04** Graduation at 4 consecutive `weeks_held`; celebrated by terminal screen +
  one sentence (no confetti — INV-2). Relapse resets nothing; ladder waits (copy per
  INV-7).
- **PLAN-05** Build One Thing: one named skill per season; weekly single check-in
  question ("did your hands learn something this week?"); Evidence entry; no minutes,
  levels or progress bars.

## CRAVE — Craving Button

- **CRAVE-01** Reachable from Threshold + home-screen widget + lock-screen widget.
- **CRAVE-02** Flow: 90 s paced breathing (4-6 rhythm, animation only, no text) →
  "what are you actually hungry for?" → pick hunger (connection/rest/meaning/body/
  unsure) → one concrete suggested real-world action (rule-based on hunger + time of
  day + channel) → optional one-line note → terminal screen. Whole flow < 3 min;
  every step skippable; never blocks the phone.
- **CRAVE-03** Each use writes a `craving_decoded` Evidence entry.

## LIB — Library

- **LIB-01** One Deep Thing: exactly one reading/day (2–4 min), book-like typesetting;
  ends in terminal screen "now go live it"; archive allows max one revisit/day
  (INV-1 — no binge).
- **LIB-02** Paths: 7–14 days; each day = reading + question + real-world act;
  one active Path max; completion writes `path_reflection` Evidence + unscored
  reflection.
- **LIB-03** E-book "Spirit Over Matter": chapter-per-day release rhythm; no binge
  unlock.
- **LIB-04** Quizzes: intake (ONB-04), attention-audit funnel quiz (shareable, coarse),
  values quiz (stated vs lived), end-of-Path reflections (never scored). Results
  written with mercy; end with one suggested next step, never a sales pitch.
- **LIB-05** All content from versioned bundles (02-architecture §Content); no
  recommendations, no "related readings".

## COMP — Companion

- **COMP-01** Persona: warm, slow, cross-traditional, never preachy; asks before
  advising; honest about what is contested. System prompt versioned in repo.
- **COMP-02** Powers: untangle priority conflicts; sit through cravings; design custom
  dares (writes to PLAN); reflect the user's own Evidence back (only entries the user
  opted to expose to it).
- **COMP-03** Ends conversations: soft close ~20 min or when the real move belongs in
  the world ("This sounds like something to say to your brother, not to me. Go say it.")
  → terminal screen. No conversation streaks, no nudges to return, no proactive
  messages ever.
- **COMP-04** Refusals: no diagnosis; no medical/clinical specifics ("that's a question
  for a doctor — and worth asking this week"); no replacing therapy/clergy.
- **COMP-05** Transcripts on-device only; never used for training/marketing; in
  one-tap erasure.

## SAFE — Safety routing (non-negotiable)

- **SAFE-01** On-device crisis classifier screens intake answers and Companion input.
  Triggers: self-harm/suicide signals, acute distress, addiction-severity patterns
  (substances, gambling, compulsive sexuality).
- **SAFE-02** On trigger: pause current flow → help-first screen: kind plain copy +
  region-appropriate professional resources and helplines (config per locale; for SK
  include national crisis lines; maintain a vetted, versioned resource list in the
  content bundle) → user may continue when ready.
- **SAFE-03** During intake, severity patterns gate the Portrait: help screen comes
  first (per spec "the Mirror hands you on").
- **SAFE-04** The app never claims confidentiality guarantees of third-party services
  and never withholds the help screen for any reason.

## JRN — Living Journal

- **JRN-01** Entry types & weighting per `04-scoring-spec.md §2`.
- **JRN-02** Evening fold: the three prompts (kindness / care / aliveness) appear inside
  evening flow; answer any/all/none; one sentence each invited.
- **JRN-03** In-the-moment capture: one-line aliveness entry from widget; voice input
  transcribed on-device, audio discarded.
- **JRN-04** Counting UX: non-counted entries marked gently ("written for the soul, not
  the score") with the specificity rule stated openly in Settings → "How the score
  works" page (full transparency: weights, caps, smoothing).
- **JRN-05** Journal is searchable, exportable (local), erasable (INV-6); Circles see
  only the weekly reflection written for them.

## RLG — Weekly Realignment

- **RLG-01** User-chosen weekly slot; 10-minute bounded flow: Ledger (permissioned
  screen-time + hand-tagged spending) framed as "what you treated as ultimate, in
  practice" → chosen values with hours actually received → gap shown without verdict →
  one written commitment for the week → optional Circle reflection + shared dare pick →
  terminal screen.
- **RLG-02** Triggers weekly recalculation (`04 §4`).

## QUIET — The Quiet

- **QUIET-01** Unplug Mode: one tap, 1–4 h (default 2): app dark except one line; OS
  focus-mode integration where available; ends silently.
- **QUIET-02** Dopamine Detox: 7/14/30-day programs; user-selected red list of
  channels; progressive schedule (shorter feeds first); daily one-line check-in;
  Companion support; Evidence entries; closing question "how does this feel compared
  to before?"
- **QUIET-03** Stillness Switch: weekly recurring protected window (RRULE), designed
  once, defended by the app: Inward dark except one line; monthly ask suppressed;
  wind-down extends over it.
- **QUIET-04** Sleep wind-down: screens dim, one closing line, optional breath work;
  no sleep scores or graphs.

## CIR — Circles

- **CIR-01** 5–8 members; invite link; one weekly written reflection + one shared dare.
  No likes, no follower counts, no member feeds, words only (INV-1/2).
- **CIR-02** Transport E2E-encrypted (ADR-002); server (if any) stores ciphertext only.

## OPEN — Open Hand (monetization)

- **OPEN-01** Everything free; no locked features/tiers/trials (INV-8).
- **OPEN-02** Ask shown max 1×/month, only if no contribution that month, only at a
  good moment (after completed dare or reading), never during a craving flow, the
  Quiet, or onboarding.
- **OPEN-03** Ask screen: exact copy & amounts (€3 · €8 suggested · €15 · custom ·
  "not this month"). Decline = one tap, suppress 30 days, zero guilt copy.
- **OPEN-04** Transparency line: "supported by N people this month" (server provides a
  single anonymous aggregate count — the only network counter in the app).
- **OPEN-05** Payments via platform IAP or PSP per ADR-003; no payment data stored
  locally beyond receipts.

## NTF — Notifications

- **NTF-01** Exactly two schedulable local notifications: morning line, evening line;
  silent by default; neutral copy (no deltas, no urgency); each independently
  disableable. CI test asserts no other notification code paths exist (INV-4).
