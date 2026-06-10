# 06 — Design System

Principle: **beauty is an argument**. Silence, space, completion. The app must be the
most beautiful thing on the person's phone — and the calmest.

## Tokens

### Color
| token | hex | use |
|---|---|---|
| `paper` | `#F7F3EC` | ground/background (light) |
| `ink` | `#1D1A16` | primary text — near-black, never pure #000 on paper |
| `stone` | `#56504A` | secondary text, quiet UI |
| `mist` | `#D9D2C5` | hairlines, dividers, borders |
| `bronze` | `#9A7748` | the single accent — **max one use per screen** |
| `night` | `#0E0C0A` | Quiet, wind-down, terminal screens |
| `night_text` | `#C9C2B4` | text on night |

No other colors. No success-green/error-red semantics; errors are written in words.

### Typography
- **Serif (the soul voice)**: humanist serif (license-cleared; e.g. Source Serif 4 or
  equivalent) — readings, questions, reflections, Companion text, all long-form.
- **Sans (the interface voice)**: quiet geometric/neo-grotesque sans (e.g. Inter) —
  labels only, letter-spaced uppercase at small sizes (tracking +8–12%).
- Body on device: 18–21 pt serif, line-height ≥ 1.6, generous margins (≥ 24 dp).
- Max two type styles per screen. No bold walls, no colored text.

### Spacing & layout
- 8-dp grid; screen max 3 elements (THR-01 generalizes: target ≤ 3 content blocks
  everywhere); one primary action per screen.
- Every screen has a visible end (no content below the fold by design where possible).

## Motion
- All transitions 300–600 ms, ease-in-out, breath-paced. Nothing snaps, bounces, or
  celebrates (no confetti — INV-2).
- Brand gesture: **fade to night** — every completed flow ends in a near-black terminal
  screen with one serif line.
- Breathing animation: 4 s in / 6 s out radial pulse; used in ONB-01 and CRAVE-02.
- Reduced-motion mode: replace fades with stillness (instant, no parallax).

## Sound
- Silence by default. One optional sound in the entire product: a single struck-bowl
  tone for morning/evening notifications. Nothing else may emit audio.

## Components (build these; nothing else)
- `TerminalScreen(line)` — night bg, one serif line, exits app or pops to root.
- `QuestionCard` — one serif question, one input (line / word-pick / spectrum).
- `SpectrumSlider` — spirit↔matter one-tap spectrum (evening reflection).
- `NeedleView` — the only data viz: drifting compass needle over 90-day mean.
- `BandRow` — channel band display (free/leaking/caught), tappable → explanation.
- `DareCard` — rung number, text, single "done — how did it feel?" affordance.
- `JournalPrompt` — prompt + one-line input + mic; "counted" state shown gently.
- `AskScreen` — Open Hand, exact copy per OPEN-03; "not this month" visually equal.
- `QuietVeil` — full-night overlay with one line (Unplug/Stillness).
- Buttons: primary = bronze **text** button (never a filled attention block);
  "not now"/"skip" always equal size to "yes".

## Iconography
Thin single-weight line icons, one motif family: compass, door, thread, flame, leaf,
moon. No emoji in UI chrome.

## Copy voice (string review checklist — enforce in PR review)
- Kind, plain, unhurried; second person; no exclamation marks; no urgency words
  (now!, don't miss, last chance); no shame or moralizing (INV-7); no productivity
  jargon (optimize, crush, streak).
- Mercy framing for relapse: "the ladder waits where you left it."
- The system is named plainly: farming, extraction, harvest.
- Every terminal line points outward: "now go live it", "go say it", "that is enough
  for today."

## Accessibility
- Full screen-reader labels; dynamic type to largest OS sizes without truncation;
- contrast: ink-on-paper ≥ 7:1, stone-on-paper ≥ 4.5:1;
- all timed elements (breath) skippable; reduced-motion supported (above);
- touch targets ≥ 44 pt.
