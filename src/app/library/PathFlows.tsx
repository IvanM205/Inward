/**
 * LIB-02 — walking a Path: starting it, and the daily reading + question +
 * act. The question is for the person, not the database (least data); only
 * the final day's closing line is kept, as path_reflection Evidence.
 */
import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { PATHS, Path } from '../../core/content/paths';
import { readingById } from '../../core/content/readings';
import { PrimaryAction, QuietAction } from '../../core/design/Buttons';
import { JournalPrompt } from '../../core/design/JournalPrompt';
import { QuestionCard } from '../../core/design/QuestionCard';
import { TerminalScreen } from '../../core/design/TerminalScreen';
import { color, space, type } from '../../core/design/tokens';
import { FlowHost } from '../../core/navigation/FlowHost';
import { SqlDatabase } from '../../core/storage/ports';
import { PATH_DAY_FLOW, PATH_START_FLOW } from '../../flows/registry';
import { activePath, completePathDay, PathState, startPath } from './pathRepo';

export interface PathStartFlowProps {
  db: SqlDatabase;
  onExit: () => void;
}

export function PathStartFlow({ db, onExit }: PathStartFlowProps): React.JSX.Element {
  const choose = (api: { advance: () => void }) => async (path: Path) => {
    await startPath(db, path.id, new Date());
    api.advance();
  };
  return (
    <FlowHost
      flow={PATH_START_FLOW}
      onExit={onExit}
      renderers={{
        invite: (api) => (
          <View style={styles.screen}>
            <Text style={styles.body}>
              Seven days each. One short reading a day, one question, one act
              in the world. One day at a time — the pace is the point.
            </Text>
            {PATHS.map((path, i) =>
              i === 0 ? (
                <PrimaryAction key={path.id} label={path.title} onPress={() => choose(api)(path)} />
              ) : (
                <QuietAction key={path.id} label={path.title} onPress={() => choose(api)(path)} />
              ),
            )}
          </View>
        ),
        begun: (api) => (
          <TerminalScreen line="The path is open. Day one waits on the threshold." onExit={api.exit} />
        ),
      }}
    />
  );
}

export interface PathDayFlowProps {
  db: SqlDatabase;
  onExit: () => void;
}

export function PathDayFlow({ db, onExit }: PathDayFlowProps): React.JSX.Element {
  const [state, setState] = useState<PathState | null | undefined>(undefined);
  const [answer, setAnswer] = useState('');
  const [actDone, setActDone] = useState(false);
  const [closingLine, setClosingLine] = useState('');

  useEffect(() => {
    activePath(db, new Date()).then(setState);
  }, [db]);

  if (state == null) return <View style={styles.screen} />;

  const day = state.path.days[state.dayIndex - 1];
  const reading = readingById(day.readingId)!;
  const finalDay = state.dayIndex >= state.path.days.length;

  const finishDay = async (api: { advance: (to?: string) => void }, done: boolean) => {
    setActDone(done);
    if (finalDay) {
      api.advance('closing');
    } else {
      await completePathDay(db, done, '', new Date());
      api.advance('kept');
    }
  };

  return (
    <FlowHost
      flow={PATH_DAY_FLOW}
      onExit={onExit}
      renderers={{
        reading: (api) => (
          <View style={styles.screen}>
            <ScrollView bounces={false}>
              <Text style={styles.dayLabel}>
                {`day ${state.dayIndex} of ${state.path.days.length}`}
              </Text>
              <Text style={styles.title}>{reading.title}</Text>
              {reading.body.map((p, i) => (
                <Text key={i} style={styles.body}>
                  {p}
                </Text>
              ))}
              <View style={styles.action}>
                <PrimaryAction label="i have read it" onPress={() => api.advance()} />
              </View>
            </ScrollView>
          </View>
        ),
        question: (api) => (
          <View style={styles.screen}>
            {/* The answer stays with the person — nothing is stored here. */}
            <QuestionCard
              question={day.question}
              value={answer}
              onChange={setAnswer}
              placeholder="for you, not for the app"
            />
            <View style={styles.action}>
              <PrimaryAction label="go on" onPress={() => api.advance()} />
            </View>
          </View>
        ),
        act: (api) => (
          <View style={styles.screen}>
            <Text style={styles.dayLabel}>the day’s act</Text>
            <Text style={styles.title}>{day.act}</Text>
            <View style={styles.action}>
              <PrimaryAction label="done — it happened" onPress={() => finishDay(api, true)} />
              <QuietAction label="i will carry it into the day" onPress={() => finishDay(api, false)} />
            </View>
          </View>
        ),
        closing: (api) => (
          <View style={styles.screen}>
            <JournalPrompt
              prompt="Seven days walked. What did the path leave with you?"
              value={closingLine}
              onChange={setClosingLine}
            />
            <View style={styles.action}>
              <PrimaryAction
                label="finish the path"
                onPress={async () => {
                  await completePathDay(db, actDone, closingLine, new Date());
                  api.advance();
                }}
              />
            </View>
          </View>
        ),
        kept: (api) => (
          <TerminalScreen line="The day is walked. The next opens tomorrow." onExit={api.exit} />
        ),
        walked: (api) => (
          <TerminalScreen line="The path is walked. Keep walking without it." onExit={api.exit} />
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
  dayLabel: {
    ...type.label,
    color: color.stone,
    textTransform: 'uppercase',
    marginBottom: space.x2,
  },
  title: {
    ...type.question,
    color: color.ink,
    marginBottom: space.x3,
  },
  body: {
    ...type.body,
    color: color.ink,
    marginBottom: space.x3,
  },
  action: {
    marginTop: space.x3,
    alignItems: 'center',
  },
});
