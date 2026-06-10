# 02 — Architecture

## Platform targets

- **iOS 16+** and **Android 10+**, feature-identical.
- Home-screen and lock-screen **widgets** on both platforms: (a) Craving Button,
  (b) today's one line, (c) Quiet switch. The widget is the product's true front door.
- **Offline-first**: every daily flow (morning, evening, Opening, Craving Button,
  journal, reading already synced, Quiet) must work in airplane mode.

## Recommended stack (agents may propose alternatives via ADR)

- Cross-platform UI: **Flutter** or **React Native** (one codebase, native widgets via
  platform channels). Native Swift/Kotlin acceptable if the team splits.
- Local persistence: **SQLite** (via Drift/Room/GRDB equivalent) with **SQLCipher**
  encryption; key held in Keychain/Keystore.
- State: unidirectional (Riverpod/Redux/Bloc — pick one, document in ADR-001).
- The Companion: on-device-first design; if a remote LLM is used, see §Companion
  privacy gateway below.

## High-level modules

```
app/
  threshold/        # home, morning & evening compass, today's opening
  mirror/           # intake (quiz + companion mode), index engine, portrait
  plan/             # threads, habit loops, dare ladder, craving button, build-one-thing
  library/          # readings, paths, e-book, quizzes (content-driven)
  companion/        # chat UI, session manager, safety router
  journal/          # living journal (kindness/care/aliveness + auto entries)
  quiet/            # unplug, detox, stillness switch, sleep wind-down
  realign/          # weekly ledger, values comparison, circle reflection
  openhand/         # monthly ask
core/
  scoring/          # extraction index engine (pure functions, fully unit-tested)
  content/          # versioned content store + OTA sync
  storage/          # encrypted DB, backup/restore, one-tap erasure
  notifications/    # scheduler enforcing INV-4
  design/           # tokens, components (see 06)
  safety/           # crisis detection & routing
```

## Content pipeline

- All Library content (readings, Paths, quizzes, intake question bank, dare templates,
  values copy) ships as **versioned, editor-curated JSON bundles**, signed and fetched
  over the air. No algorithmic recommendation anywhere in the pipeline.
- App embeds a fallback bundle so first run works offline.
- Bundle schema documented in `03-data-model.md §Content`.
- Localization: bundle-level; strings file per locale. Launch locales: EN + SK
  (Slovak), architecture must support arbitrary locales.

## Companion privacy gateway (if remote LLM is used)

- Requests are stateless: the device composes the prompt (persona + safety rules +
  minimal needed context, e.g. quoted journal lines the user opted to include).
- No user identifier beyond an ephemeral request ID; no server-side conversation
  storage; TLS pinned.
- Transcripts stored on-device only; included in one-tap erasure (INV-6).
- A local on-device safety classifier pre-screens for crisis language and routes to
  the help screen *before* any remote call when triggered (see `05-features.md §SAFE`).

## Background behavior

- No background fetch except: (a) content bundle check ≤ 1×/day on Wi-Fi,
  (b) scheduled local notifications (INV-4), (c) optional screen-time read at the
  weekly Realignment moment.
- No silent pushes, no remote push infrastructure at all in v1 (local notifications
  only).

## Screen-time signals

- iOS: Screen Time / DeviceActivity APIs (user-permissioned). Android:
  UsageStatsManager (user-permissioned).
- Signals collected (only if granted): per-category foreground time, pickups/day,
  night-time use (00:00–05:00), intended-vs-actual session length where measurable.
- Processed and stored **on-device only**; revocation deletes derived data.

## Telemetry

- None by default. The only permissible telemetry is **opt-in anonymous crash
  reporting** (no user data in payloads). No analytics SDKs (INV-5) — enforce with a
  dependency lint rule in CI.
