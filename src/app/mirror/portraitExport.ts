/**
 * MIR-04 — the private portrait export: the Mirror rendered as plain text
 * for the person's own keeping (the native share sheet / PDF wrapper rides
 * the bridges). Private by default; the ONLY shareable variant anywhere is
 * the coarse channel-free funnel-quiz result (LIB-04), never this.
 */
import { mechanismLine } from '../../core/content/mechanisms';
import { CHANNELS } from '../../core/storage/migrations';
import { SqlDatabase } from '../../core/storage/ports';
import { latestLevel, latestScores } from './recalc';

const channelName = (key: string): string =>
  CHANNELS.find((c) => c.key === key)?.name.toLowerCase() ?? key;

export async function exportPortrait(db: SqlDatabase): Promise<string> {
  const scores = await latestScores(db);
  const level = await latestLevel(db);
  if (scores.length === 0 || level === null) {
    return 'The Mirror has not looked yet.\n';
  }

  const groups = {
    caught: scores.filter((s) => s.band === 'caught'),
    leaking: scores.filter((s) => s.band === 'leaking'),
    free: scores.filter((s) => s.band === 'free'),
  };

  const lines: string[] = ['The Portrait', ''];
  for (const band of ['caught', 'leaking', 'free'] as const) {
    if (groups[band].length === 0) continue;
    lines.push(band);
    for (const s of groups[band]) {
      lines.push(`  ${channelName(s.channelKey)}`);
      if (band !== 'free') lines.push(`    ${mechanismLine(s.channelKey as never)}`);
    }
    lines.push('');
  }
  // Words first; the raw numbers afterwards, the same one-tap-away spirit
  // as the screen (MIR-01).
  lines.push(`level ${Math.round(level.level)} — ${level.band}`);
  lines.push('');
  lines.push('Computed on this device, from your own answers. Not a verdict — a map.');
  return lines.join('\n') + '\n';
}
