/**
 * THR-03 — the evening compass: one tap on the spirit↔matter spectrum
 * (optional line), 0–3 gratitudes, the evening fold (JRN-02: kindness /
 * care / aliveness, answer any/all/none), the Needle, rest.
 *
 * Persistence happens once, when the fold closes: the Reflection row, one
 * `gratitude` journal entry per gratitude line, and one entry per answered
 * fold prompt — all through the counting rules (04 §2.2). Channel tags stay
 * empty until a thread exists to suggest them (M3).
 */
import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { PrimaryAction, QuietAction } from '../../core/design/Buttons';
import { JournalPrompt } from '../../core/design/JournalPrompt';
import { NeedleView } from '../../core/design/NeedleView';
import { SpectrumSlider } from '../../core/design/SpectrumSlider';
import { TerminalScreen } from '../../core/design/TerminalScreen';
import { color, space, type } from '../../core/design/tokens';
import { FlowHost } from '../../core/navigation/FlowHost';
import { SqlDatabase } from '../../core/storage/ports';
import { needleDirection, saveReflection } from '../../core/storage/repos/reflectionRepo';
import { localDateKey } from '../../core/storage/time';
import { t } from '../../core/content/strings';
import { suggestedChannels } from '../journal/channelSuggestion';
import { addEntry } from '../journal/journalRepo';
import { BreathScreen } from '../onboarding/BreathScreen';
import { EVENING_FLOW } from '../../flows/registry';

export const FOLD_PROMPTS = [
  { type: 'kindness' as const, promptKey: 'evening.foldKindness' as const },
  { type: 'care' as const, promptKey: 'evening.foldCare' as const },
  { type: 'aliveness' as const, promptKey: 'evening.foldAliveness' as const },
];

export interface EveningFlowProps {
  db: SqlDatabase;
  locale?: string;
  onExit: () => void;
}

export function EveningFlow({ db, locale = 'en', onExit }: EveningFlowProps): React.JSX.Element {
  const [direction, setDirection] = useState<number | null>(null);
  const [line, setLine] = useState('');
  const [gratitudes, setGratitudes] = useState(['', '', '']);
  const [fold, setFold] = useState({ kindness: '', care: '', aliveness: '' });
  const [needle, setNeedle] = useState<number | null>(null);

  const persistEvening = async () => {
    const now = new Date();
    await saveReflection(db, {
      date: localDateKey(now),
      direction: direction ?? 0,
      line: line.trim() || undefined,
      gratitudes: gratitudes.map((g) => g.trim()).filter((g) => g.length > 0),
    });
    // Channels auto-suggested from the active thread (04 §2.1) — without
    // them, lived evidence would never reach the score.
    for (const g of gratitudes.map((s) => s.trim()).filter((s) => s.length > 0)) {
      await addEntry(
        db,
        { type: 'gratitude', text: g, channelKeys: await suggestedChannels(db, 'gratitude'), origin: 'evening' },
        now,
      );
    }
    for (const { type } of FOLD_PROMPTS) {
      const text = fold[type].trim();
      if (text.length > 0) {
        await addEntry(
          db,
          { type, text, channelKeys: await suggestedChannels(db, type), origin: 'evening' },
          now,
        );
      }
    }
    setNeedle(await needleDirection(db, now));
  };

  return (
    <FlowHost
      flow={EVENING_FLOW}
      onExit={onExit}
      renderers={{
        direction: (api) => (
          <View style={styles.screen}>
            <Text style={styles.question}>{t('evening.lean', locale)}</Text>
            <View style={styles.spectrum}>
              <SpectrumSlider value={direction} onSelect={setDirection} />
            </View>
            <JournalPrompt prompt={t('evening.linePrompt', locale)} value={line} onChange={setLine} />
            <View style={styles.action}>
              <PrimaryAction
                label={t('common.goOn', locale)}
                onPress={() => api.advance()}
                disabled={direction === null}
              />
            </View>
          </View>
        ),
        gratitudes: (api) => (
          <View style={styles.screen}>
            <Text style={styles.question}>{t('evening.gratitudeQuestion', locale)}</Text>
            {gratitudes.map((g, i) => (
              <JournalPrompt
                key={i}
                prompt={i === 0 ? t('evening.gratitudeHint', locale) : ' '}
                value={g}
                onChange={(text) =>
                  setGratitudes(gratitudes.map((prev, j) => (j === i ? text : prev)))
                }
              />
            ))}
            <View style={styles.action}>
              <PrimaryAction label={t('common.goOn', locale)} onPress={() => api.advance()} />
            </View>
          </View>
        ),
        fold: (api) => (
          <View style={styles.screen}>
            {FOLD_PROMPTS.map(({ type, promptKey }) => (
              <JournalPrompt
                key={type}
                prompt={t(promptKey, locale)}
                value={fold[type]}
                onChange={(text) => setFold({ ...fold, [type]: text })}
              />
            ))}
            <View style={styles.action}>
              <PrimaryAction
                label={t('evening.foldTheDay', locale)}
                onPress={async () => {
                  await persistEvening();
                  api.advance();
                }}
              />
            </View>
          </View>
        ),
        needle: (api) => (
          <View style={styles.screen}>
            <View style={styles.needle}>
              <NeedleView direction={needle} />
            </View>
            <View style={styles.action}>
              <QuietAction label={t('evening.goodNight', locale)} onPress={() => api.advance('rest')} />
              <QuietAction label={t('evening.windDownFirst', locale)} onPress={() => api.advance('winddown')} />
            </View>
          </View>
        ),
        // QUIET-04: screens already dim (night), one slow breath, optional by
        // construction (the breath is skippable), then the closing line.
        winddown: (api) => <BreathScreen onDone={() => api.advance()} />,
        rest: (api) => (
          <TerminalScreen line={t('evening.restTerminal', locale)} onExit={api.exit} />
        ),
        sleep: (api) => (
          <TerminalScreen line={t('evening.sleepTerminal', locale)} onExit={api.exit} />
        ),
      }}
    />
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: color.paper,
    justifyContent: 'center',
    paddingHorizontal: space.readingMargin,
    paddingVertical: space.x6,
  },
  question: {
    ...type.question,
    color: color.ink,
    marginBottom: space.x4,
  },
  spectrum: {
    marginBottom: space.x4,
  },
  needle: {
    alignItems: 'center',
  },
  action: {
    marginTop: space.x4,
    alignItems: 'center',
  },
});
