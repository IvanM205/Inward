# Inward — Threat Model (NFR-P6)

**Version 1.0 · 2026-06-12 · required before M2 (07-nonfunctional)**

Inward's privacy posture is structural: there is no server-side user data to
breach (INV-5, NFR-P1). What remains to protect is the device, the content
pipeline, and the few optional network paths. This document covers the three
scenarios NFR-P6 names — device theft, malicious bundle, relay compromise —
plus the adjacent ones they imply.

## Assets

| Asset | Sensitivity |
|---|---|
| Intake responses (per-channel hours, pull, casualties) | High — admissions about addiction-shaped behavior, incl. substances/betting/pornography |
| Living Journal & evening reflections | High — private writing |
| ChannelScore / ExtractionLevel history | High — derived profile of capture |
| Companion transcripts (M4) | High |
| SQLCipher key | Critical — unlocks all of the above |
| Content bundle channel | Medium — integrity, not confidentiality |

## T1 — Theft or loss of the device

**Adversary:** thief, acquaintance, or abusive partner with physical access.

- DB is SQLCipher-encrypted; the key lives in Keychain/Keystore with
  `AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY` (no cloud sync of the key) — NFR-P2.
- A copied database file without the key is unreadable; `eraseAll()` destroys
  the key first-class, stranding any prior copy (tested in Storage tests).
- Residual risk: an unlocked phone in hostile hands. Mitigations available to
  the person: OS screen lock (assumed baseline), one-tap erasure (INV-6)
  reachable in two taps from the Threshold.
- Shoulder-surfing: bands are words on a quiet page; no notification ever
  carries content beyond the neutral morning/evening line (INV-4), so the
  lock screen leaks nothing.
- Widgets (M-later): the capture widget must show the PROMPT, never recent
  entries; the quiet-switch widget shows state only. Tracked as a widget
  design constraint.

## T2 — Malicious or tampered content bundle

**Adversary:** compromised CDN, MITM, or a malicious editor.

- Bundles are signed; signature verified on device before activation
  (NFR-R2). A malformed or unverifiable bundle falls back to the embedded
  bundle — never a crash, never partial activation.
- Bundle content is declarative (readings, questions, dare templates,
  strings, helpline lists). No code, no URLs that auto-open, no schema fields
  that change scoring weights — weights live in the app binary
  (core/scoring/config), so a bundle cannot quietly distort the Mirror.
- Helpline lists (SAFE-02, NFR-C2) are the highest-stakes bundle content: a
  tampered list could route a person in crisis to a harmful number. Vetted,
  versioned, and reviewed per locale; signature failure = fallback list.
- Residual risk: a malicious signing-key holder. Mitigation: key custody
  limited to release maintainers; rotation procedure documented at release.

## T3 — Relay / network compromise

**Adversary:** network attacker, compromised relay or gateway operator.

- v1 has no push infrastructure and no user-data endpoints (NFR-P1). The
  attack surface is: bundle CDN (integrity covered by T2), the anonymous
  supporter count (a single integer; worst case a wrong number is displayed),
  payments (delegated to platform IAP/PSP), and later the Companion gateway
  and Circle relay.
- Companion gateway (M4): stateless requests, TLS pinned, no identifier
  beyond an ephemeral request id, on-device crisis pre-screen BEFORE any
  remote call (02 §gateway). A compromised gateway sees only what the prompt
  contains; the persona rules exclude raw journal dumps — only lines the
  person explicitly exposed.
- Circle relay (M5/ADR-002): ciphertext only; keys never leave members'
  devices. A compromised relay can drop or delay messages (availability),
  not read them.
- Residual risk: traffic analysis (that a device talks to the gateway at
  all). Accepted for v1; no mitigation promised to users.

## T4 — The vendor (us) and legal compulsion

- There is nothing to subpoena: no accounts, no server-side profiles, no
  analytics (NFR-P3 enforced by dependency lint in CI).
- The covenant gates (ci/covenant/) are themselves a control against
  internal drift toward extraction patterns.

## Out of scope for v1

- OS-level compromise (rooted/jailbroken device, malicious keyboard).
- Backups: E2E-encrypted to the user's own cloud, user-held keys (NFR-P2);
  design lands with the backup feature.
- Side-channel inference from app size/install (the app's presence itself).

## Review cadence

Revisit at each milestone exit (M2..M4), at any new network endpoint, and at
any new permission request. Changes require an ADR referencing this document.
