// NFR-A1 / INV-1 — no feed, no infinity.
// Virtualized/infinite list components may appear only in files explicitly
// allowlisted below, each with a justification that the bound collection is
// finite, user-authored, and has a visible end (e.g. the user's own journal).
import { walkSourceFiles, relPath, readLines, report } from './lib.mjs';

const LIST_COMPONENTS = [
  /\bFlatList\b/,
  /\bSectionList\b/,
  /\bVirtualizedList\b/,
  /\bFlashList\b/,
  /\bRecyclerListView\b/,
  /onEndReached/, // the infinite-scroll hook itself, anywhere, is forbidden
];

// path → justification. onEndReached is never allowed, even here.
const ALLOWED = {
  // 'src/app/journal/JournalSearch.tsx':
  //   'JRN-05: user’s own finite journal; has a visible end; no consumable content',
};

const violations = [];
for (const file of walkSourceFiles()) {
  const rel = relPath(file);
  readLines(file).forEach((line, i) => {
    for (const pattern of LIST_COMPONENTS) {
      if (!pattern.test(line)) continue;
      const infiniteScroll = /onEndReached/.test(line);
      if (!infiniteScroll && ALLOWED[rel]) continue;
      violations.push(`${rel}:${i + 1} uses ${pattern}${infiniteScroll ? ' (never allowlistable)' : ' without allowlist entry'} (INV-1)`);
    }
  });
}

process.exitCode = report('list-gate (NFR-A1)', violations) ? 1 : 0;
