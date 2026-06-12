/**
 * QUIET-02 — the Dopamine Detox. Two small flows:
 * starting (program 7/14/30 + the red list, the person's own pick) and the
 * daily check-in (one line, Evidence on the red-list channels). The final
 * day asks the only question that matters: how does this feel compared to
 * before? Companion support joins in M4.
 */
import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { PrimaryAction, QuietAction } from '../../core/design/Buttons';
import { JournalPrompt } from '../../core/design/JournalPrompt';
import { TerminalScreen } from '../../core/design/TerminalScreen';
import { color, space, touchTarget, type } from '../../core/design/tokens';
import { FlowHost } from '../../core/navigation/FlowHost';
import { ChannelKey } from '../../core/scoring/config';
import { CHANNELS } from '../../core/storage/migrations';
import { SqlDatabase } from '../../core/storage/ports';
import { DETOX_CHECKIN_FLOW, DETOX_START_FLOW } from '../../flows/registry';
import {
  ActiveDetox,
  activeDetox,
  completeDetox,
  detoxCheckin,
  DetoxProgram,
  DETOX_PROGRAMS,
  startDetox,
} from './quietRepo';

export interface DetoxStartFlowProps {
  db: SqlDatabase;
  onExit: () => void;
}

export function DetoxStartFlow({ db, onExit }: DetoxStartFlowProps): React.JSX.Element {
  const [program, setProgram] = useState<DetoxProgram>(7);
  const [redList, setRedList] = useState<ChannelKey[]>([]);

  return (
    <FlowHost
      flow={DETOX_START_FLOW}
      onExit={onExit}
      renderers={{
        program: (api) => (
          <View style={styles.screen}>
            <Text style={styles.question}>How long a clearing?</Text>
            {DETOX_PROGRAMS.map((days) =>
              days === 7 ? (
                <PrimaryAction
                  key={days}
                  label="seven days"
                  onPress={() => {
                    setProgram(days);
                    api.advance();
                  }}
                />
              ) : (
                <QuietAction
                  key={days}
                  label={days === 14 ? 'fourteen days' : 'thirty days'}
                  onPress={() => {
                    setProgram(days);
                    api.advance();
                  }}
                />
              ),
            )}
          </View>
        ),
        'red-list': (api) => (
          <View style={styles.screen}>
            <Text style={styles.question}>Which channels go on the red list?</Text>
            {CHANNELS.slice(0, 8).map((c) => {
              const key = c.key as ChannelKey;
              const picked = redList.includes(key);
              return (
                <Pressable
                  key={c.key}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: picked }}
                  accessibilityLabel={c.name.toLowerCase()}
                  onPress={() =>
                    setRedList(picked ? redList.filter((k) => k !== key) : [...redList, key])
                  }
                  style={styles.channel}>
                  <Text style={[styles.channelText, picked && styles.channelPicked]}>
                    {c.name.toLowerCase()}
                  </Text>
                </Pressable>
              );
            })}
            <View style={styles.action}>
              <PrimaryAction
                label="begin the clearing"
                disabled={redList.length === 0}
                onPress={async () => {
                  await startDetox(db, program, redList, new Date());
                  api.advance();
                }}
              />
            </View>
          </View>
        ),
        begun: (api) => (
          <TerminalScreen
            line="The clearing has begun. Shorter feeds go first — one line a day is all it asks."
            onExit={api.exit}
          />
        ),
      }}
    />
  );
}

export interface DetoxCheckinFlowProps {
  db: SqlDatabase;
  onExit: () => void;
}

export function DetoxCheckinFlow({ db, onExit }: DetoxCheckinFlowProps): React.JSX.Element {
  const [detox, setDetox] = useState<ActiveDetox | null | undefined>(undefined);
  const [line, setLine] = useState('');
  const [closingAnswer, setClosingAnswer] = useState('');

  useEffect(() => {
    activeDetox(db, new Date()).then(setDetox);
  }, [db]);

  return (
    <FlowHost
      flow={DETOX_CHECKIN_FLOW}
      onExit={onExit}
      renderers={{
        checkin: (api) =>
          detox == null ? (
            <View style={styles.screen} />
          ) : (
            <View style={styles.screen}>
              <Text style={styles.dayLine}>
                {`day ${detox.dayIndex} of ${detox.state.program} · clearing ${detox.focus.length} of ${detox.state.redList.length} channels`}
              </Text>
              <JournalPrompt prompt="One line about today." value={line} onChange={setLine} />
              <View style={styles.action}>
                <PrimaryAction
                  label="keep it"
                  disabled={line.trim().length === 0}
                  onPress={async () => {
                    await detoxCheckin(db, line.trim(), new Date());
                    api.advance(detox.finished ? 'closing' : 'kept');
                  }}
                />
              </View>
            </View>
          ),
        closing: (api) => (
          <View style={styles.screen}>
            <JournalPrompt
              prompt="The clearing is over. How does this feel, compared to before?"
              value={closingAnswer}
              onChange={setClosingAnswer}
            />
            <View style={styles.action}>
              <PrimaryAction
                label="finish"
                onPress={async () => {
                  await completeDetox(db, closingAnswer, new Date());
                  api.advance();
                }}
              />
            </View>
          </View>
        ),
        kept: (api) => (
          <TerminalScreen line="Kept. The clearing holds — go live the rest of it." onExit={api.exit} />
        ),
        done: (api) => (
          <TerminalScreen line="The clearing is done. Keep what it gave you." onExit={api.exit} />
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
  },
  question: {
    ...type.question,
    color: color.ink,
    marginBottom: space.x4,
  },
  dayLine: {
    ...type.label,
    color: color.stone,
    textTransform: 'uppercase',
    marginBottom: space.x3,
  },
  channel: {
    minHeight: touchTarget,
    justifyContent: 'center',
  },
  channelText: {
    ...type.body,
    color: color.stone,
  },
  channelPicked: {
    color: color.ink,
    textDecorationLine: 'underline',
  },
  action: {
    marginTop: space.x4,
    alignItems: 'center',
  },
});
