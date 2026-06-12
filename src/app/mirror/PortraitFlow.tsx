/**
 * MIR-01..03 — the Portrait: one strictly bounded page. Channels grouped
 * free / leaking / caught; one mechanism line per captured channel; one
 * orientation sentence; the suggested first thread. Bands always — raw
 * numbers and the person's own answers appear behind one tap, expanding in
 * place (MIR-03: the score must explain itself; no navigation loops).
 *
 * First view runs the recalc if no scores exist yet (re-measure on demand,
 * 04 §4). Leaving marks portrait_seen — the Mirror never demands a revisit.
 */
import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { LIKERT_LABELS } from './IntakeQuizFlow';
import { mechanismLine } from '../../core/content/mechanisms';
import { t } from '../../core/content/strings';
import { CASUALTY_OPTIONS, questionById } from '../../core/content/questionBank';
import { PrimaryAction, QuietAction } from '../../core/design/Buttons';
import { BandRow } from '../../core/design/BandRow';
import { TerminalScreen } from '../../core/design/TerminalScreen';
import { color, space, type } from '../../core/design/tokens';
import { FlowHost } from '../../core/navigation/FlowHost';
import { Casualty } from '../../core/scoring/config';
import { CHANNELS } from '../../core/storage/migrations';
import { severityGate } from '../../core/safety/classifier';
import { SqlDatabase } from '../../core/storage/ports';
import { getProfile, setOnboardingState } from '../../core/storage/repos/profileRepo';
import { PORTRAIT_FLOW } from '../../flows/registry';
import { startThread } from '../plan/threadRepo';
import { HelpFirstScreen } from '../safety/HelpFirstScreen';
import { allResponses, IntakeAnswer, IntakeResponse, responsesByIds } from './intakeRepo';
import { ChannelScoreRow, latestScores, weeklyRecalc } from './recalc';

export interface PortraitFlowProps {
  db: SqlDatabase;
  onExit: () => void;
}

const channelName = (key: string): string =>
  CHANNELS.find((c) => c.key === key)?.name ?? key;

/** A saved answer, rendered back in the person's own terms (MIR-03). */
export function describeAnswer(response: IntakeResponse): string {
  const question = questionById(response.questionId);
  const text = question?.text ?? response.questionId;
  const raw = response.rawAnswer as IntakeAnswer | null;
  if (response.skipped || raw === null) return `${text} — you let this one pass.`;
  switch (raw.kind) {
    case 'hours':
      return `${text} — ${raw.hoursPerWeek} hours.`;
    case 'likert':
      return `${text} — ${LIKERT_LABELS[raw.value]}.`;
    case 'casualties': {
      const names = raw.casualties.map(
        (c: Casualty) => CASUALTY_OPTIONS.find((o) => o.key === c)?.label ?? c,
      );
      return names.length > 0 ? `${text} — ${names.join(', ')}.` : `${text} — nothing named.`;
    }
  }
}

export function PortraitFlow({ db, onExit }: PortraitFlowProps): React.JSX.Element {
  const [scores, setScores] = useState<ChannelScoreRow[] | null>(null);
  const [expandedChannel, setExpandedChannel] = useState<string | null>(null);
  const [explanation, setExplanation] = useState<IntakeResponse[]>([]);
  // SAFE-03: severity patterns hand the person on BEFORE the Mirror speaks.
  const [helpFirst, setHelpFirst] = useState(false);
  const [locale, setLocale] = useState('en');
  // ONB-06: the first viewing flows on into first-thread selection.
  const [firstRun, setFirstRun] = useState(false);
  const [closingLine, setClosingLine] = useState(
    t('portrait.mapTerminal', 'en'),
  );

  useEffect(() => {
    (async () => {
      const responses = await allResponses(db);
      setHelpFirst(severityGate(responses).triggered);
      const profile = await getProfile(db);
      setLocale(profile?.locale ?? 'en');
      setFirstRun(profile?.onboardingState === 'intake_done');
      let latest = await latestScores(db);
      if (latest.length === 0) {
        await weeklyRecalc(db, new Date());
        latest = await latestScores(db);
      }
      setScores(latest);
    })();
  }, [db]);

  const toggleExplanation = async (score: ChannelScoreRow) => {
    if (expandedChannel === score.channelKey) {
      setExpandedChannel(null);
      return;
    }
    setExplanation(await responsesByIds(db, score.explanationRefs));
    setExpandedChannel(score.channelKey);
  };

  const caught = scores?.filter((s) => s.band === 'caught') ?? [];
  const deepest = [...caught].sort((a, b) => b.effectiveScore - a.effectiveScore)[0];

  return (
    <FlowHost
      flow={PORTRAIT_FLOW}
      onExit={onExit}
      renderers={{
        portrait: (api) =>
          scores === null ? (
            <View style={styles.screen} />
          ) : helpFirst ? (
            // Pause, help first, continue when ready — never withheld (SAFE-02/04).
            <HelpFirstScreen locale={locale} onContinue={() => setHelpFirst(false)} />
          ) : (
            <View style={styles.screen}>
              {/* Bounded by construction: 12 rows, no feed (MIR-02, INV-1). */}
              <ScrollView style={styles.page} bounces={false}>
                {scores.map((score) => (
                  <View key={score.channelKey}>
                    <BandRow
                      channelName={channelName(score.channelKey)}
                      band={score.band}
                      expanded={expandedChannel === score.channelKey}
                      onPress={() => toggleExplanation(score)}
                    />
                    {expandedChannel === score.channelKey && (
                      <View style={styles.explanation}>
                        {score.band !== 'free' && (
                          <Text style={styles.mechanism}>
                            {mechanismLine(score.channelKey as never)}
                          </Text>
                        )}
                        <Text style={styles.numbers}>
                          {/* Raw numbers behind one tap, never pushed (MIR-01). */}
                          time {Math.round(score.timeScore)} · pull {Math.round(score.pullScore)} ·
                          displacement {Math.round(score.displacementScore)} · evidence −
                          {score.evidenceOffset.toFixed(1)} → {Math.round(score.effectiveScore)}
                        </Text>
                        {explanation.map((r) => (
                          <Text key={r.id} style={styles.answer}>
                            {describeAnswer(r)}
                          </Text>
                        ))}
                        {explanation.length === 0 && (
                          <Text style={styles.answer}>
                            Nothing asked yet — this channel rests until you answer.
                          </Text>
                        )}
                      </View>
                    )}
                  </View>
                ))}
                <Text style={styles.orientation}>
                  {deepest
                    ? `One thread holds most of the weight: ${channelName(deepest.channelKey).toLowerCase()}. When the Untangling opens, begin there.`
                    : 'Nothing has you caught. Keep living the way the needle points.'}
                </Text>
              </ScrollView>
              <View style={styles.action}>
                <PrimaryAction
                  label={t('portrait.seen', locale)}
                  onPress={() => api.advance(firstRun ? 'first-thread' : 'seen')}
                />
                {/* MIR-05: re-measure on demand — recalc from today's answers
                    and evidence; the short re-intake arrives with threads (M3). */}
                <QuietAction
                  label={t('portrait.measureAgain', locale)}
                  onPress={async () => {
                    await weeklyRecalc(db, new Date());
                    setExpandedChannel(null);
                    setScores(await latestScores(db));
                  }}
                />
              </View>
            </View>
          ),
        'first-thread': (api) => {
          const suggested = deepest ?? [...(scores ?? [])].sort(
            (a, b) => b.effectiveScore - a.effectiveScore,
          )[0];
          const others = (scores ?? []).filter(
            (s) => s.band !== 'free' && s.channelKey !== suggested?.channelKey,
          );
          const choose = async (channelKey: string) => {
            await startThread(db, channelKey as never, new Date());
            await setOnboardingState(db, 'thread_chosen');
            setClosingLine(t('portrait.onbTerminal', locale)); // ONB-06
            api.advance('seen');
          };
          return (
            <View style={[styles.screen, styles.firstThread]}>
              <Text style={styles.orientation}>
                {t('portrait.firstThread', locale)}
              </Text>
              {suggested && (
                <PrimaryAction
                  label={`${t('portrait.beginWith', locale)} ${channelName(suggested.channelKey).toLowerCase()}`}
                  onPress={() => choose(suggested.channelKey)}
                />
              )}
              {others.map((s) => (
                <QuietAction
                  key={s.channelKey}
                  label={channelName(s.channelKey).toLowerCase()}
                  onPress={() => choose(s.channelKey)}
                />
              ))}
              <QuietAction
                label={t('portrait.notYet', locale)}
                onPress={() => {
                  setClosingLine(t('portrait.onbTerminal', locale)); // ONB-06
                  api.advance('seen');
                }}
              />
            </View>
          );
        },
        seen: (api) => (
          <TerminalScreen
            line={closingLine}
            onExit={async () => {
              const profile = await getProfile(db);
              if (profile?.onboardingState === 'intake_done') {
                await setOnboardingState(db, 'portrait_seen');
              } else if (profile?.onboardingState === 'thread_chosen') {
                await setOnboardingState(db, 'complete'); // onboarding ends (ONB-06)
              }
              api.exit();
            }}
          />
        ),
      }}
    />
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: color.paper,
    paddingTop: space.x6,
  },
  page: {
    paddingHorizontal: space.readingMargin,
  },
  explanation: {
    paddingVertical: space.x2,
    paddingLeft: space.x2,
  },
  mechanism: {
    ...type.body,
    color: color.ink,
    fontStyle: 'italic',
    marginBottom: space.x1,
  },
  numbers: {
    ...type.label,
    color: color.stone,
    marginBottom: space.x1,
  },
  answer: {
    ...type.body,
    color: color.stone,
    marginBottom: space.x1 / 2,
  },
  orientation: {
    ...type.question,
    color: color.ink,
    marginTop: space.x4,
    marginBottom: space.x3,
  },
  firstThread: {
    justifyContent: 'center',
    paddingHorizontal: space.readingMargin,
  },
  action: {
    alignItems: 'center',
    paddingVertical: space.x2,
  },
});
