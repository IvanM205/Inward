// Runs every covenant gate; exits non-zero if any fails.
// "Never merge with a red invariant test. There are no exceptions, including demos."
//   — 08-roadmap §Working agreements
import { spawnSync } from 'node:child_process';

const GATES = [
  'grep-gate.mjs',
  'dependency-lint.mjs',
  'notification-gate.mjs',
  'list-gate.mjs',
];

let failed = false;
for (const gate of GATES) {
  const result = spawnSync(process.execPath, [new URL(gate, import.meta.url).pathname], {
    stdio: 'inherit',
  });
  if (result.status !== 0) failed = true;
}

if (failed) {
  console.error('\nCovenant gates failed — the invariants are release law (README §Covenant).');
  process.exit(1);
}
console.log('\nAll covenant gates green.');
