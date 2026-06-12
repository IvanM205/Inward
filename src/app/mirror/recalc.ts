/**
 * The weekly recalculation (04 §4, §7) — the ONLY writer of ChannelScore and
 * ExtractionLevel. Joins what the person said (intake responses) with what
 * they lived (counted journal evidence) through the pure engine. Runs at the
 * Realignment moment or on demand from the Mirror; re-running a week replaces
 * that week's rows, so it is never silently compounded (04 §4).
 *
 * Missing answers score 0 — absence of evidence is treated as freedom, never
 * as capture (mercy is a spec requirement, not a default).
 */
import {
  ChannelKey,
  CHANNEL_KEYS,
  EVIDENCE_WINDOW_DAYS,
  PULL_ITEM_COUNT,
  Band,
} from '../../core/scoring/config';
import {
  band,
  evidenceOffset,
  effectiveScore,
  extractionLevel,
  rawCapture,
  smoothed,
} from '../../core/scoring/engine';
import { newId } from '../../core/storage/ids';
import { SqlDatabase } from '../../core/storage/ports';
import { toLocalIso } from '../../core/storage/time';
import { countedEntriesSince } from '../journal/journalRepo';
import { answeredFor, IntakeResponse } from './intakeRepo';

export interface ChannelScoreRow {
  id: string;
  computedAt: string;
  weekIndex: number;
  channelKey: ChannelKey;
  timeScore: number;
  pullScore: number;
  displacementScore: number;
  rawCapture: number;
  evidenceOffset: number;
  effectiveScore: number;
  band: Band;
  /** Intake response ids that built this score — the Portrait explains itself (MIR-03). */
  explanationRefs: string[];
}

export interface ExtractionLevelRow {
  computedAt: string;
  weekIndex: number;
  level: number;
  band: Band;
}

/** Calendar weeks since the local epoch week — stable across runs. */
export function weekIndexOf(now: Date): number {
  const dayMs = 24 * 3600 * 1000;
  const localDays = Math.floor(
    new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime() / dayMs,
  );
  return Math.floor(localDays / 7);
}

interface ChannelInputs {
  time: number;
  pull: number;
  displacement: number;
  refs: string[];
}

/**
 * Dimension scores from the answered intake rows. `normalized` was computed
 * at save time with the same engine functions, so this is a read, not a
 * re-derivation. Pull: mean of the answered items of the five (unanswered
 * items count as 0 — see module note on mercy).
 */
function channelInputs(responses: IntakeResponse[]): ChannelInputs {
  const refs = responses.map((r) => r.id);
  const time = responses.find((r) => r.dimension === 'time')?.normalized ?? 0;
  const displacement = responses.find((r) => r.dimension === 'displacement')?.normalized ?? 0;
  const pullItems = responses.filter((r) => r.dimension === 'pull');
  const pull = pullItems.reduce((sum, r) => sum + r.normalized, 0) / PULL_ITEM_COUNT;
  return { time, pull, displacement, refs };
}

async function priorRawCaptures(
  db: SqlDatabase,
  channel: ChannelKey,
  weekIndex: number,
): Promise<number[]> {
  const result = await db.execute(
    'SELECT raw_capture FROM channel_score WHERE channel_key = ? AND week_index < ? ORDER BY week_index',
    [channel, weekIndex],
  );
  return result.rows.map((r) => Number(r.raw_capture));
}

export async function weeklyRecalc(db: SqlDatabase, now: Date): Promise<ExtractionLevelRow> {
  const weekIndex = weekIndexOf(now);
  const computedAt = toLocalIso(now);
  const evidence = await countedEntriesSince(db, now, EVIDENCE_WINDOW_DAYS);

  const effectives: number[] = [];
  for (const channel of CHANNEL_KEYS) {
    const inputs = channelInputs(await answeredFor(db, channel));
    const raw = rawCapture(inputs.time, inputs.pull, inputs.displacement);
    const history = [...(await priorRawCaptures(db, channel, weekIndex)), raw];
    const offset = evidenceOffset(evidence, channel);
    const effective = effectiveScore(smoothed(history), offset);
    effectives.push(effective);

    await db.execute('DELETE FROM channel_score WHERE week_index = ? AND channel_key = ?', [
      weekIndex,
      channel,
    ]);
    await db.execute(
      `INSERT INTO channel_score
         (id, computed_at, week_index, channel_key, time_score, pull_score,
          displacement_score, raw_capture, evidence_offset, effective_score,
          band, explanation_refs)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        newId(),
        computedAt,
        weekIndex,
        channel,
        inputs.time,
        inputs.pull,
        inputs.displacement,
        raw,
        offset,
        effective,
        band(effective),
        JSON.stringify(inputs.refs),
      ],
    );
  }

  const level = extractionLevel(effectives);
  const headline: ExtractionLevelRow = {
    computedAt,
    weekIndex,
    level,
    band: band(level),
  };
  await db.execute('DELETE FROM extraction_level WHERE week_index = ?', [weekIndex]);
  await db.execute(
    'INSERT INTO extraction_level (id, computed_at, week_index, level, band) VALUES (?, ?, ?, ?, ?)',
    [newId(), computedAt, weekIndex, level, headline.band],
  );
  return headline;
}

function rowToScore(row: Record<string, unknown>): ChannelScoreRow {
  return {
    id: String(row.id),
    computedAt: String(row.computed_at),
    weekIndex: Number(row.week_index),
    channelKey: String(row.channel_key) as ChannelKey,
    timeScore: Number(row.time_score),
    pullScore: Number(row.pull_score),
    displacementScore: Number(row.displacement_score),
    rawCapture: Number(row.raw_capture),
    evidenceOffset: Number(row.evidence_offset),
    effectiveScore: Number(row.effective_score),
    band: String(row.band) as Band,
    explanationRefs: JSON.parse(String(row.explanation_refs)) as string[],
  };
}

/** The newest score per channel, in canonical channel order (MIR-01). */
export async function latestScores(db: SqlDatabase): Promise<ChannelScoreRow[]> {
  const result = await db.execute(
    `SELECT cs.* FROM channel_score cs
     JOIN (SELECT channel_key, MAX(week_index) AS w FROM channel_score GROUP BY channel_key) latest
       ON latest.channel_key = cs.channel_key AND latest.w = cs.week_index
     JOIN channel c ON c.key = cs.channel_key
     ORDER BY c."order"`,
  );
  return result.rows.map(rowToScore);
}

/** The newest headline, or null before the first recalc (Mirror waits). */
export async function latestLevel(db: SqlDatabase): Promise<ExtractionLevelRow | null> {
  const result = await db.execute(
    'SELECT * FROM extraction_level ORDER BY week_index DESC LIMIT 1',
  );
  const row = result.rows[0];
  if (!row) return null;
  return {
    computedAt: String(row.computed_at),
    weekIndex: Number(row.week_index),
    level: Number(row.level),
    band: String(row.band) as Band,
  };
}
