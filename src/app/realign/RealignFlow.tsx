/**
 * RLG-01..02 — the Weekly Realignment. Ten bounded minutes, four screens:
 * the ledger ("what you treated as ultimate, in practice"), the hours that
 * reached what you love, the gap — shown plainly, without verdict — and one
 * written commitment. Completing it triggers the weekly recalculation.
 */
import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { PrimaryAction } from '../../core/design/Buttons';
import { QuestionCard } from '../../core/design/QuestionCard';
import { TerminalScreen } from '../../core/design/TerminalScreen';
import { color, space, type } from '../../core/design/tokens';
import { FlowHost } from '../../core/navigation/FlowHost';
import { SqlDatabase } from '../../core/storage/ports';
import { REALIGN_FLOW } from '../../flows/registry';
import { weeklyRecalc } from '../mirror/recalc';
import { saveRealignment } from './realignRepo';

export interface RealignFlowProps {
  db: SqlDatabase;
  onExit: () => void;
}

function NumberLine({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}): React.JSX.Element {
  return (
    <View style={styles.numberLine}>
      <Text style={styles.numberLabel}>{label}</Text>
      <TextInput
        style={styles.numberInput}
        value={value}
        onChangeText={onChange}
        keyboardType="numeric"
        placeholder="0"
        placeholderTextColor={color.stone}
        accessibilityLabel={label}
      />
    </View>
  );
}

const num = (s: string) => (Number.isFinite(Number(s)) && s.trim() !== '' ? Number(s) : 0);

export function RealignFlow({ db, onExit }: RealignFlowProps): React.JSX.Element {
  const [screenHours, setScreenHours] = useState('');
  const [spending, setSpending] = useState('');
  const [lovedHours, setLovedHours] = useState('');
  const [commitment, setCommitment] = useState('');

  return (
    <FlowHost
      flow={REALIGN_FLOW}
      onExit={onExit}
      renderers={{
        ledger: (api) => (
          <View style={styles.screen}>
            <Text style={styles.question}>
              The ledger: what did you treat as ultimate, in practice?
            </Text>
            <NumberLine label="hours to screens, your honest guess" value={screenHours} onChange={setScreenHours} />
            <NumberLine label="money to wanting, not needing" value={spending} onChange={setSpending} />
            <View style={styles.action}>
              <PrimaryAction label="go on" onPress={() => api.advance()} />
            </View>
          </View>
        ),
        values: (api) => (
          <View style={styles.screen}>
            <Text style={styles.question}>
              And the hours that reached what you say you love?
            </Text>
            <NumberLine label="hours to what you love" value={lovedHours} onChange={setLovedHours} />
            <View style={styles.action}>
              <PrimaryAction label="go on" onPress={() => api.advance()} />
            </View>
          </View>
        ),
        gap: (api) => (
          <View style={styles.screen}>
            {/* The gap, without verdict (RLG-01): two numbers, no adjective. */}
            <Text style={styles.gapLine}>
              {num(screenHours)} hours went to the screens.
            </Text>
            <Text style={styles.gapLine}>
              {num(lovedHours)} hours reached what you love.
            </Text>
            <View style={styles.action}>
              <PrimaryAction label="i see it" onPress={() => api.advance()} />
            </View>
          </View>
        ),
        commitment: (api) => (
          <View style={styles.screen}>
            <QuestionCard
              question="One commitment for the week ahead — yours, in your words."
              value={commitment}
              onChange={setCommitment}
              placeholder="this week I will…"
            />
            <View style={styles.action}>
              <PrimaryAction
                label="commit"
                disabled={commitment.trim().length === 0}
                onPress={async () => {
                  const now = new Date();
                  await saveRealignment(
                    db,
                    now,
                    { screenHours: num(screenHours), spentOnWanting: num(spending) },
                    { hoursToWhatYouLove: num(lovedHours) },
                    commitment,
                  );
                  await weeklyRecalc(db, now); // RLG-02
                  api.advance();
                }}
              />
            </View>
          </View>
        ),
        realigned: (api) => (
          <TerminalScreen line="The week is read. Now go write the next one." onExit={api.exit} />
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
  numberLine: {
    marginBottom: space.x3,
  },
  numberLabel: {
    ...type.body,
    color: color.stone,
    marginBottom: space.x1 / 2,
  },
  numberInput: {
    ...type.body,
    color: color.ink,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: color.mist,
    paddingVertical: space.x1,
  },
  gapLine: {
    ...type.question,
    color: color.ink,
    marginBottom: space.x3,
  },
  action: {
    marginTop: space.x4,
    alignItems: 'center',
  },
});
