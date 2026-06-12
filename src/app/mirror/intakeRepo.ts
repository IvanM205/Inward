/**
 * Intake responses (ONB-04, 03 §IntakeResponse) — the Mirror's raw material.
 *
 * Every question is skippable, and skipping is recorded so the intake can
 * resume where it left off (≤ 14 days) without re-asking. Re-answering a
 * question replaces the earlier row. `normalized` is computed at save time
 * with the same pure functions the weekly recalc will use (core/scoring), so
 * the Portrait can always explain itself from these rows (explanation_refs).
 */
import { IntakeQuestion } from '../../core/content/questionBank';
import { Casualty, ChannelKey, PULL_ITEM_MAX } from '../../core/scoring/config';
import { clamp, displacementScore, timeScore } from '../../core/scoring/engine';
import { newId } from '../../core/storage/ids';
import { SqlDatabase } from '../../core/storage/ports';
import { toLocalIso } from '../../core/storage/time';

export type IntakeAnswer =
  | { kind: 'hours'; hoursPerWeek: number }
  | { kind: 'likert'; value: number }
  | { kind: 'casualties'; casualties: Casualty[] };

export interface IntakeResponse {
  id: string;
  createdAt: string;
  questionId: string;
  channelKey: ChannelKey;
  dimension: 'time' | 'pull' | 'displacement';
  rawAnswer: unknown;
  normalized: number;
  skipped: boolean;
}

function normalize(question: IntakeQuestion, answer: IntakeAnswer): number {
  switch (answer.kind) {
    case 'hours':
      if (answer.hoursPerWeek < 0 || !Number.isFinite(answer.hoursPerWeek)) {
        throw new Error(`Invalid weekly hours: ${answer.hoursPerWeek}`);
      }
      return timeScore(question.channelKey, answer.hoursPerWeek);
    case 'likert':
      if (!Number.isInteger(answer.value) || answer.value < 0 || answer.value > PULL_ITEM_MAX) {
        throw new Error(`Likert value out of range 0–${PULL_ITEM_MAX}: ${answer.value}`);
      }
      return (answer.value / PULL_ITEM_MAX) * 100;
    case 'casualties':
      return displacementScore(answer.casualties);
  }
}

function answerKindFor(question: IntakeQuestion): IntakeAnswer['kind'] {
  return question.type;
}

async function upsert(db: SqlDatabase, row: IntakeResponse): Promise<void> {
  await db.execute('DELETE FROM intake_response WHERE question_id = ?', [row.questionId]);
  await db.execute(
    `INSERT INTO intake_response
       (id, created_at, question_id, channel_key, dimension, raw_answer, normalized, skipped)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      row.id,
      row.createdAt,
      row.questionId,
      row.channelKey,
      row.dimension,
      JSON.stringify(row.rawAnswer),
      row.normalized,
      row.skipped ? 1 : 0,
    ],
  );
}

export async function saveAnswer(
  db: SqlDatabase,
  question: IntakeQuestion,
  answer: IntakeAnswer,
  now: Date,
): Promise<IntakeResponse> {
  if (answer.kind !== answerKindFor(question)) {
    throw new Error(
      `Question ${question.id} expects a ${answerKindFor(question)} answer, got ${answer.kind}.`,
    );
  }
  const row: IntakeResponse = {
    id: newId(),
    createdAt: toLocalIso(now),
    questionId: question.id,
    channelKey: question.channelKey,
    dimension: question.dimension,
    rawAnswer: answer,
    normalized: clamp(normalize(question, answer), 0, 100),
    skipped: false,
  };
  await upsert(db, row);
  return row;
}

/** Every question is skippable (ONB-04); the skip itself is the record. */
export async function skipQuestion(
  db: SqlDatabase,
  question: IntakeQuestion,
  now: Date,
): Promise<IntakeResponse> {
  const row: IntakeResponse = {
    id: newId(),
    createdAt: toLocalIso(now),
    questionId: question.id,
    channelKey: question.channelKey,
    dimension: question.dimension,
    rawAnswer: null,
    normalized: 0,
    skipped: true,
  };
  await upsert(db, row);
  return row;
}

function rowToResponse(row: Record<string, unknown>): IntakeResponse {
  return {
    id: String(row.id),
    createdAt: String(row.created_at),
    questionId: String(row.question_id),
    channelKey: String(row.channel_key) as ChannelKey,
    dimension: String(row.dimension) as IntakeResponse['dimension'],
    rawAnswer: JSON.parse(String(row.raw_answer)),
    normalized: Number(row.normalized),
    skipped: Number(row.skipped) === 1,
  };
}

/** All responses, answered and skipped — resume state and Mirror input. */
export async function allResponses(db: SqlDatabase): Promise<IntakeResponse[]> {
  const result = await db.execute('SELECT * FROM intake_response ORDER BY created_at');
  return result.rows.map(rowToResponse);
}

/** Answered (non-skipped) responses for one channel — the scoring input. */
export async function answeredFor(db: SqlDatabase, channel: ChannelKey): Promise<IntakeResponse[]> {
  const result = await db.execute(
    'SELECT * FROM intake_response WHERE channel_key = ? AND skipped = 0 ORDER BY question_id',
    [channel],
  );
  return result.rows.map(rowToResponse);
}

/** Which question ids already have a row — the resume cursor (ONB-04). */
export async function seenQuestionIds(db: SqlDatabase): Promise<Set<string>> {
  const result = await db.execute('SELECT question_id FROM intake_response');
  return new Set(result.rows.map((r) => String(r.question_id)));
}
