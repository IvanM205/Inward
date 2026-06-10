// Shared helpers for the covenant gates (NFR-A1..A5, NFR-P3).
// Plain Node, zero dependencies — these must run before npm install if needed.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

export const REPO_ROOT = new URL('../..', import.meta.url).pathname;

const SKIP_DIRS = new Set([
  'node_modules', '.git', 'build', '.gradle', 'Pods', 'DerivedData',
  // Spec pack and source documents quote forbidden mechanics by name
  // (e.g. "no streaks"); the gates police product code and strings only.
  'specs', 'docs', 'decisions', 'ci',
]);

const TEXT_EXTENSIONS = /\.(ts|tsx|js|jsx|mjs|json|kt|java|swift|m|mm|h|xml|strings|plist|gradle)$/;

export function* walkSourceFiles(root = REPO_ROOT) {
  for (const entry of readdirSync(root)) {
    if (SKIP_DIRS.has(entry) || entry.startsWith('.')) continue;
    const full = join(root, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      yield* walkInner(full);
    } else if (TEXT_EXTENSIONS.test(entry)) {
      yield full;
    }
  }
}

function* walkInner(dir) {
  for (const entry of readdirSync(dir)) {
    if (SKIP_DIRS.has(entry) || entry === '.git') continue;
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) yield* walkInner(full);
    else if (TEXT_EXTENSIONS.test(entry)) yield full;
  }
}

export function relPath(file) {
  return relative(REPO_ROOT, file).replaceAll('\\', '/');
}

export function readLines(file) {
  return readFileSync(file, 'utf8').split(/\r?\n/);
}

export function loadJson(url) {
  return JSON.parse(readFileSync(new URL(url, import.meta.url), 'utf8'));
}

export function report(gateName, violations) {
  if (violations.length === 0) {
    console.log(`✓ ${gateName}: clean`);
    return false;
  }
  console.error(`✗ ${gateName}: ${violations.length} violation(s)`);
  for (const v of violations) console.error(`  ${v}`);
  return true;
}
