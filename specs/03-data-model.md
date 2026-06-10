# 03 — Data Model

All tables live in the encrypted on-device DB. `id` = UUIDv4. Timestamps = ISO-8601
local with offset. **No entity is ever transmitted off-device** except via the user's
own E2E-encrypted backup.

## Entities

### Profile
| field | type | notes |
|---|---|---|
| id | uuid | singleton row |
| created_at | ts | |
| display_name | text? | optional, local only |
| chosen_values | text[] | subset of canonical values list (love, family, compassion, friendship, home, nature, kindness, empathy, craft, faith, health) |
| morning_hour / evening_hour | time | notification schedule (INV-4) |
| locale | text | |
| onboarding_state | enum | `breath_done, sentence_done, permissions_done, intake_in_progress, intake_done, portrait_seen, thread_chosen, complete` |

### Channel (static, seeded)
`key` (one of the 12 canonical keys), `name`, `order`, `mechanism_copy_id`.

### IntakeResponse
| field | type | notes |
|---|---|---|
| id, created_at | | |
| question_id | text | from content bundle question bank (~180 questions) |
| channel_key | text | exactly one channel |
| dimension | enum | `time` \| `pull` \| `displacement` |
| raw_answer | json | answer payload (scale value, hours, multi-select…) |
| normalized | real 0–100 | computed at save time |
| skipped | bool | every question skippable |

### ScreenTimeSample (optional, permissioned)
`date`, `channel_key?`, `category`, `minutes`, `pickups`, `night_minutes`.

### ChannelScore (recomputed weekly; history kept)
| field | type | notes |
|---|---|---|
| id, computed_at, week_index | | |
| channel_key | text | |
| time_score / pull_score / displacement_score | real 0–100 | |
| raw_capture | real 0–100 | formula in `04-scoring-spec.md` |
| evidence_offset | real 0–10 | journal evidence, capped |
| effective_score | real 0–100 | `max(0, raw_capture − evidence_offset)`, 4-week smoothed |
| band | enum | `free` \| `leaking` \| `caught` |
| explanation_refs | json | intake/answer ids that built the score (portrait must explain itself) |

### ExtractionLevel (headline; history kept)
`computed_at`, `level` (score-weighted mean of channel effective scores), `band`.

### Thread (the Liberation Plan)
| field | type | notes |
|---|---|---|
| id, channel_key, started_at | | exactly **one** row with status `active` |
| status | enum | `active` \| `paused` \| `graduated` \| `abandoned` |
| replacement_habit | json | `{cue, routine, reward, vow_text}` — when–then vow in user's words |
| micro_act | text | < 5 min daily act |
| weeks_held | int | consecutive weeks habit held; graduation at 4 |

### Dare
`id, thread_id, rung (1–7), text, source (template|custom|circle), status
(waiting|offered|done|skipped), offered_on, done_on, feeling_answer (text?)`.
Completion auto-creates a JournalEntry of type `dare_done`.

### CravingEvent
`id, created_at, channel_key, hunger (connection|rest|meaning|body|unsure),
action_suggested, action_taken (bool?), note (text?)`. Auto-creates JournalEntry
`craving_decoded`. Full flow < 3 min; every step skippable.

### JournalEntry (the Living Journal)
| field | type | notes |
|---|---|---|
| id, created_at | | |
| type | enum | `kindness` \| `care` \| `aliveness` \| `dare_done` \| `craving_decoded` \| `path_reflection` \| `gratitude` |
| text | text | one sentence invited; longer allowed |
| channel_keys | text[] | channels this entry weighs against (auto-suggested, editable) |
| counted | bool | passes specificity rule & daily cap (see `04`) |
| weight | real | computed; 0 if not counted |
| origin | enum | `evening` \| `widget` \| `auto` \| `companion` |

### Reading / Path / PathDay / Quiz (content-driven)
From content bundles. Local state: `ReadingLog (reading_id, read_on, revisits_today ≤ 1)`,
`PathProgress (path_id, day_index, acts_done[])`.

### Reflection (evening Compass)
`id, date, direction (real −1.0 matter … +1.0 spirit), line (text?), gratitudes (text[0–3])`.
Feeds the Needle (90-day window).

### RealignmentWeek
`id, week_start, ledger (json: hours/money by category), value_hours (json),
commitment (text), circle_reflection_id?`.

### Circle / CircleMember / CircleReflection / SharedDare
Circles are 5–8 members. v1 transport: end-to-end encrypted relay or invite-link +
manual share (decide in ADR-002; no server-side plaintext ever). Only the weekly
reflection text written *for the circle* leaves the device, E2E-encrypted.

### QuietState
`mode (none|unplug|detox|stillness), unplug_until?, detox (program: 7|14|30,
day_index, red_list: channel_keys[]), stillness (rrule, next_window)`.

### OpenHandState
`last_ask_shown_at, last_contribution_at?, declined_until?` — enforces ask rules.

### CompanionSession
`id, started_at, ended_at, transcript (encrypted blob, on-device only),
end_reason (user|soft_close|handoff|crisis_route)`.

## Content bundle schema (server-side, public)

```json
{
  "bundle_version": "2026.06.1",
  "locale": "en",
  "readings": [{"id","title","author","tradition","body_md","closing_question"}],
  "paths": [{"id","title","days":[{"reading_id","question","act"}]}],
  "intake_questions": [{"id","channel_key","dimension","type","text","scale_map"}],
  "dare_templates": [{"id","channel_key","rung","text"}],
  "quizzes": [...],
  "strings": {...}
}
```

## Erasure (INV-6)

`storage.eraseAll()` must: wipe all tables, delete the SQLCipher key, clear widgets,
cancel notifications, reset onboarding — atomically, then show plain-words
confirmation. Unit + integration tested.
