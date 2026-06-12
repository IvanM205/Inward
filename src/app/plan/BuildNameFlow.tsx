/**
 * PLAN-05 — naming the season's one thing to build. One question, one name,
 * and the weekly hands question takes it from there (inside the
 * Realignment). Nothing here counts minutes or draws bars.
 */
import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { PrimaryAction } from '../../core/design/Buttons';
import { QuestionCard } from '../../core/design/QuestionCard';
import { TerminalScreen } from '../../core/design/TerminalScreen';
import { color, space } from '../../core/design/tokens';
import { FlowHost } from '../../core/navigation/FlowHost';
import { SqlDatabase } from '../../core/storage/ports';
import { BUILD_NAME_FLOW } from '../../flows/registry';
import { nameBuildThing } from './buildRepo';

export interface BuildNameFlowProps {
  db: SqlDatabase;
  onExit: () => void;
}

export function BuildNameFlow({ db, onExit }: BuildNameFlowProps): React.JSX.Element {
  const [name, setName] = useState('');
  return (
    <FlowHost
      flow={BUILD_NAME_FLOW}
      onExit={onExit}
      renderers={{
        name: (api) => (
          <View style={styles.screen}>
            <QuestionCard
              question="One thing your hands will build this season. Name it."
              value={name}
              onChange={setName}
              placeholder="bread, a song, a bench, a garden bed…"
            />
            <View style={styles.action}>
              <PrimaryAction
                label="name it"
                disabled={name.trim().length === 0}
                onPress={async () => {
                  await nameBuildThing(db, name, new Date());
                  api.advance();
                }}
              />
            </View>
          </View>
        ),
        named: (api) => (
          <TerminalScreen
            line="Named. Once a week the question will come: did your hands learn something?"
            onExit={api.exit}
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
    justifyContent: 'center',
    paddingVertical: space.x6,
  },
  action: {
    marginTop: space.x4,
    alignItems: 'center',
  },
});
