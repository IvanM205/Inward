// NFR-A4 — grep-gate for forbidden engagement mechanics in product code and strings.
// A hit fails CI unless covered by an entry in grep-gate.allowlist.json
// ({ "path": <file prefix>, "pattern": <regex matched against the line>, "reason" }).
import { walkSourceFiles, relPath, readLines, loadJson, report } from './lib.mjs';

const FORBIDDEN = [
  /\bstreaks?\b/i,
  /\bbadges?\b/i,
  /\brewards?\b/i,
  /\bautoplay\b/i,
  /recommended for you/i,
  /\bgamif/i,
  /don'?t miss/i,
  /\btrending\b/i,
];

const allowlist = loadJson('./grep-gate.allowlist.json');

function isAllowed(file, line) {
  return allowlist.some(
    (a) => file.startsWith(a.path) && new RegExp(a.pattern).test(line),
  );
}

const violations = [];
for (const file of walkSourceFiles()) {
  const rel = relPath(file);
  readLines(file).forEach((line, i) => {
    for (const pattern of FORBIDDEN) {
      if (pattern.test(line) && !isAllowed(rel, line)) {
        violations.push(`${rel}:${i + 1} matches ${pattern} — "${line.trim().slice(0, 80)}"`);
      }
    }
  });
}

process.exitCode = report('grep-gate (NFR-A4)', violations) ? 1 : 0;
