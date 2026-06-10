# Inward

A mobile app built to free people's minds from systems of extraction and return
their attention to the values that make us human. The only success metric is
**reverse retention**: users who, after a year, spend *less* time on all screens —
including this one.

**The spec pack in [`specs/`](specs/README.md) is the single source of truth.**
Read `specs/README.md` first — the Covenant (INV-1..9) there is product law and
is enforced by CI gates in this repo.

## Layout

| Path | What |
|---|---|
| `specs/` | Engineering requirements & specifications (v3.0) |
| `docs/` | Product source documents (the three current PDFs; `docs/previous/` is out of scope) |
| `decisions/` | Architecture Decision Records (start with ADR-001) |
| `ci/covenant/` | The covenant gates — grep-gate, dependency lint, notification gate, list gate |
| `src/core/` | scoring · storage · notifications · navigation · design |
| `src/flows/` | Declarative flow graphs — every primary flow ends in a TerminalScreen |

## Commands

```sh
npm run verify     # covenant gates + lint + typecheck + tests — run before every PR
npm run covenant   # just the invariant gates
npm test           # Jest
npm run android    # debug build on emulator/device (host)
```

## Working agreements

- One PR per requirement ID where feasible; reference IDs (e.g. `MIR-03`) in
  commits and tests.
- New ideas become ADRs in `decisions/` and must pass the Covenant Test before
  implementation. Never merge with a red invariant test — no exceptions.
- Content direction: no religious texts or framing anywhere in the product —
  Inward is for all people with good heart (see ADR-001 §Content direction).
