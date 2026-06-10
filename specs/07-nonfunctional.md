# 07 — Non-Functional Requirements

## Privacy & security (extends INV-5/6)

- **NFR-P1** No server-side user profile; the only backend endpoints in v1:
  (a) content bundle CDN (public, signed), (b) anonymous supporter count (OPEN-04),
  (c) payment provider, (d) optional Companion LLM gateway (02 §gateway),
  (e) optional Circle ciphertext relay (ADR-002).
- **NFR-P2** DB encrypted (SQLCipher); key in Keychain/Keystore; backups E2E-encrypted
  to user's own cloud; Inward holds no keys.
- **NFR-P3** Dependency lint in CI rejects analytics/ads/tracking SDKs by denylist +
  manual allowlist for every new dependency.
- **NFR-P4** `eraseAll()` per 03 §Erasure; verified by integration test that re-launch
  equals true first-run.
- **NFR-P5** "How the score works" settings page discloses formulas, weights, caps,
  and all data signals in plain language (the published-persuasion covenant). Every
  notification string and ask string lives in a public `persuasion/` directory in the
  repo.
- **NFR-P6** Threat model doc required before M2 (theft of device, malicious bundle,
  relay compromise).

## Anti-engagement invariants (testable forms of INV-1..4)

- **NFR-A1** Static check: no `ListView`/scroll component bound to an unbounded,
  growing collection of consumable content.
- **NFR-A2** Notification scheduler API surface allows exactly two schedules; CI test
  asserts no other `schedule()` call sites.
- **NFR-A3** Every primary flow's last route is `TerminalScreen`; route-graph test.
- **NFR-A4** Grep-gate in CI for forbidden mechanics keywords in code/strings
  (`streak`, `badge`, `reward`, `autoplay`, `recommended for you`) with allowlist.
- **NFR-A5** Session-length and open-count must not appear as inputs to any product
  logic except the user's own Ledger display.

## Performance

- **NFR-F1** Cold start ≤ 1.5 s on mid-range device; breath screen renders < 300 ms.
- **NFR-F2** All daily flows fully offline (airplane-mode E2E test).
- **NFR-F3** Battery: no wakelocks; background work limited per 02 §Background.
- **NFR-F4** App size ≤ 60 MB installed (excl. on-device ML if used; budget that
  separately, ≤ +40 MB).

## Reliability

- **NFR-R1** Scoring engine: pure, deterministic, 100% unit coverage, fixture test for
  the worked example (04 §8).
- **NFR-R2** Content bundle: signature verified; malformed bundle → fallback bundle,
  never a crash.
- **NFR-R3** Crash-free sessions ≥ 99.8% (measured only via opt-in crash reporting).

## Accessibility & localization

- **NFR-X1** WCAG 2.2 AA equivalent; see 06 §Accessibility.
- **NFR-X2** All strings externalized; EN + SK at launch; RTL-safe layouts.

## Compliance

- **NFR-C1** GDPR: on-device architecture minimizes scope; still provide privacy
  policy, data-subject rights page (trivially satisfied by INV-6), age gate 16+.
- **NFR-C2** Helpline/resource lists (SAFE-02) reviewed and versioned per locale;
  update path via content bundle within 24 h.
- **NFR-C3** Store compliance: health/wellbeing category rules; no medical claims
  anywhere in copy.
