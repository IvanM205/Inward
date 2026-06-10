// NFR-P3 / INV-5 — dependency lint.
// Every dependency (and devDependency) must appear in dependency-allowlist.json
// with a stated reason, and nothing matching the tracking/analytics denylist may
// enter the tree at all. Adding a dependency is a deliberate, reviewed act.
import { readFileSync } from 'node:fs';
import { REPO_ROOT, loadJson, report } from './lib.mjs';

const DENYLIST = [
  'analytics', 'firebase', 'segment', 'amplitude', 'mixpanel', 'appsflyer',
  'adjust', 'braze', 'intercom', 'onesignal', 'admob', 'google-ads', 'gtag',
  'facebook', 'fbsdk', 'crashlytics', 'sentry', 'bugsnag', 'datadog',
  'heap', 'hotjar', 'singular', 'kochava', 'branch-sdk', 'tracking',
];
// Crash reporting (sentry/bugsnag/…) stays denied until the opt-in-only
// implementation is decided (02 §Telemetry); remove from the list via PR + ADR.

const pkg = JSON.parse(readFileSync(`${REPO_ROOT}/package.json`, 'utf8'));
const allowlist = loadJson('./dependency-allowlist.json');

const violations = [];
const all = { ...pkg.dependencies, ...pkg.devDependencies };

for (const name of Object.keys(all)) {
  const denied = DENYLIST.find((d) => name.toLowerCase().includes(d));
  if (denied) {
    violations.push(`"${name}" matches denylist term "${denied}" (INV-5: no analytics/ads/tracking SDKs)`);
    continue;
  }
  if (!allowlist[name]) {
    violations.push(`"${name}" is not in ci/covenant/dependency-allowlist.json — add it with a reason (NFR-P3)`);
  }
}

for (const name of Object.keys(allowlist)) {
  if (!all[name]) violations.push(`allowlist entry "${name}" is no longer a dependency — remove it`);
}

process.exitCode = report('dependency-lint (NFR-P3)', violations) ? 1 : 0;
