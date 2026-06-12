/**
 * OPEN-01..03 — the Open Hand ask. Exact copy from persuasion/ask.json
 * (NFR-P5); "not this month" is one tap, visually equal, and suppresses the
 * ask for thirty days with zero guilt. Payments ride platform IAP/PSP per
 * ADR-003 — until that lands, choosing an amount records the intent moment
 * only (no payment data is ever stored beyond receipts, OPEN-05).
 */
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import askCopy from '../../../persuasion/ask.json';
import { PrimaryAction, QuietAction } from '../../core/design/Buttons';
import { TerminalScreen } from '../../core/design/TerminalScreen';
import { color, space, type } from '../../core/design/tokens';
import { FlowHost } from '../../core/navigation/FlowHost';
import { SqlDatabase } from '../../core/storage/ports';
import { ASK_FLOW } from '../../flows/registry';
import { markContributed, markDeclined, SupporterCountSource } from './openHandRepo';

export interface AskFlowProps {
  db: SqlDatabase;
  /** OPEN-04: the one anonymous counter; null renders no line at all. */
  supporterCount?: SupporterCountSource;
  onExit: () => void;
}

export function AskFlow({ db, supporterCount, onExit }: AskFlowProps): React.JSX.Element {
  const [supporters, setSupporters] = useState<number | null>(null);

  useEffect(() => {
    supporterCount
      ?.fetch()
      .then(setSupporters)
      .catch(() => setSupporters(null)); // the ask never depends on the network
  }, [supporterCount]);

  return (
    <FlowHost
      flow={ASK_FLOW}
      onExit={onExit}
      renderers={{
        ask: (api) => (
          <View style={styles.screen}>
            <Text style={styles.lead}>{askCopy.lead}</Text>
            {supporters !== null && (
              <Text style={styles.supporters}>
                {askCopy.supporters.replace('{n}', String(supporters))}
              </Text>
            )}
            {askCopy.amounts.map((amount) =>
              amount === askCopy.suggested ? (
                <PrimaryAction
                  key={amount}
                  label={amount}
                  onPress={async () => {
                    await markContributed(db, new Date()); // payment sheet rides ADR-003
                    api.advance('given');
                  }}
                />
              ) : (
                <QuietAction
                  key={amount}
                  label={amount}
                  onPress={async () => {
                    await markContributed(db, new Date());
                    api.advance('given');
                  }}
                />
              ),
            )}
            <View style={styles.decline}>
              <QuietAction
                label={askCopy.decline}
                onPress={async () => {
                  await markDeclined(db, new Date()); // 30 quiet days, zero guilt
                  api.advance('kept');
                }}
              />
            </View>
          </View>
        ),
        given: (api) => (
          <TerminalScreen line="Thank you. Nothing changes — it was already all yours." onExit={api.exit} />
        ),
        kept: (api) => (
          <TerminalScreen line="All good. Everything stays exactly as it is." onExit={api.exit} />
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
  lead: {
    ...type.question,
    color: color.ink,
    marginBottom: space.x3,
  },
  supporters: {
    ...type.label,
    color: color.stone,
    textTransform: 'uppercase',
    marginBottom: space.x3,
  },
  decline: {
    marginTop: space.x3,
    alignItems: 'center',
  },
});
