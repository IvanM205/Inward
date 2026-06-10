# 04 — Scoring Specification (The Extraction Index)

Pure-function module `core/scoring`. 100% unit-test coverage required. All constants
in one config file so editors can tune without code changes.

## 1. Per-channel raw capture

For each channel `c`:

```
raw_capture(c) = 0.35 * time_score(c)
              + 0.40 * pull_score(c)
              + 0.25 * displacement_score(c)        // all 0–100
```

### 1.1 time_score
- Source: intake self-report hours/week; for digital channels, replaced by observed
  screen-time average when permission granted (observed wins over self-report).
- Mapping: piecewise-linear per channel against thresholds
  `T0 (→0), T40, T70, Tsat (→100)`; defaults for `feeds`: 2 h→0, 7 h→40, 14 h→70,
  25 h→100. Each channel has its own thresholds in config.

### 1.2 pull_score
- Five Likert items per channel (0–4: never→always), plainly worded:
  1. reach without deciding; 2. tried to stop/cut down and failed; 3. continue despite
  a nameable cost; 4. restless/irritable when stopping; 5. hide or understate it.
- `pull_self = sum / 20 * 100`.
- Behavioral modifier (digital channels, permissioned only):
  `pull = clamp(pull_self + 0.5*pickup_z + 0.5*night_z + 0.5*overrun_z, 0, 100)` where
  each z-term contributes −10..+10 based on banded thresholds in config.

### 1.3 displacement_score
- Casualty checklist per channel: sleep (25), close relationship (25), finances (20),
  skill/craft (10), body/outdoors (10), meals with people (10). Sum of named
  casualties, capped 100.

## 2. Journal evidence offset

```
evidence_offset(c) = clamp( Σ counted_entry_weight(e, c) over trailing 28 days, 0, 10 )
effective(c) = max(0, smoothed(raw_capture(c)) − evidence_offset(c))
```

### 2.1 Entry weights
| entry type | base weight | channel mapping |
|---|---|---|
| kindness | 0.8 | `relationships` full; all others ×0.25 |
| care | 0.6 | `feeds, substances, porn` full; others ×0.25 |
| aliveness | 0.6 | channels tagged on entry (auto-suggest active thread) |
| dare_done | 1.0 | the dare's thread channel |
| craving_decoded (action_taken) | 0.5 | the craving's channel |
| gratitude / path_reflection | 0.3 | active thread channel |

### 2.2 Counting rules (must all pass for `counted = true`)
- **Specificity rule**: entry must be concrete (≥ 1 of: named person/place/object/event;
  heuristic: contains a non-stopword noun phrase + past-tense verb, min 4 words).
  Non-counted entries are still saved and shown — copy: "written for the soul, not
  the score."
- **Daily cap**: max 3 counted entries/day, max 1 per manual type (kindness/care/aliveness).
- **Diminishing returns**: cosine-similarity (on-device embedding or token Jaccard ≥ 0.7)
  vs entries from last 14 days ⇒ weight × 0.5^n for nth repeat.

### 2.3 Smoothing
`smoothed(x)` = mean of weekly `raw_capture` over trailing 4 weeks (min 1 week).

## 3. Bands & headline level

```
band: 0–25 free · 26–60 leaking · 61–100 caught
extraction_level = Σ effective(c)·effective(c) / Σ effective(c)   // score-weighted mean
```
(Deepest captures dominate the headline. If all zero ⇒ level 0.)

## 4. Recalculation triggers

- Weekly job at the user's Realignment time (default Sunday evening, local).
- On season boundary: Pull items for the active thread are re-asked (short re-intake,
  ≤ 10 questions); full re-measure on demand from the Mirror.
- Never recalculated silently in the background more than 1×/week.

## 5. Display rules

- Bands always; raw numbers available behind one tap, never pushed (no deltas in
  notifications — INV-4 limits content to neutral morning/evening lines anyway).
- Every band must render its `explanation_refs`: "tap any band → see which of your own
  answers built it."
- The Needle is the ONLY data visualization in the app: a drifting compass needle over
  the 90-day mean of `Reflection.direction`. No bar charts, rings, or comparisons.

## 6. Anti-gaming guarantees (testable)

- `evidence_offset ≤ 10` per channel — unit test.
- Index is never rendered in any shareable artifact except the channel-free
  "How farmed is your attention?" funnel quiz output (separate, coarse, opt-in).
- No feature, content, or pricing depends on any score — integration test: flipping all
  scores must not change feature availability.

## 7. Reference pseudocode

```python
def weekly_recalc(now):
    for c in CHANNELS:
        t = time_score(c)          # observed wins over self-report
        p = pull_score(c)
        d = displacement_score(c)
        raw = 0.35*t + 0.40*p + 0.25*d
        store_weekly(c, raw)
        ev = min(10.0, sum(w for e in journal.counted(c, days=28) for w in [e.weight]))
        eff = max(0.0, mean(last_weeks(c, 4)) - ev)
        save(ChannelScore(c, t, p, d, raw, ev, eff, band(eff), refs(c)))
    save(ExtractionLevel(weighted_mean_by_self([s.effective for s in scores])))
```

## 8. Worked example (regression fixture)

"M., 29", channel `feeds`: week 0 → Time 84, Pull 81, Displacement 62 ⇒ raw 77.85 ≈ 78
(caught). Week 8 → observed time ↓ (14 h ⇒ Time 70→? recompute: 70), re-asked Pull 52,
Displacement 38 ⇒ raw ≈ 58; evidence_offset 7 (18 counted entries w/ diminishing
returns + dares) ⇒ effective ≈ 51 (leaking). Encode as a fixture test.
