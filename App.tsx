/**
 * Inward — app root.
 * Opens the encrypted store, then routes by onboarding progress: first launch
 * runs the ONB flow from its declared graph; afterwards the Threshold is home.
 * On Android a terminal exit closes the app (INV-3); on iOS, where apps may
 * not exit themselves, it settles on the Threshold (pops to root).
 */
import React, { useCallback, useEffect, useState } from 'react';
import { BackHandler, Platform, StatusBar, StyleSheet, View } from 'react-native';
import { color } from './src/core/design/tokens';
import { SqlDatabase } from './src/core/storage/ports';
import { getProfile } from './src/core/storage/repos/profileRepo';
import { permissionRequests, storage } from './src/app/bootstrap';
import { IntakeQuizFlow } from './src/app/mirror/IntakeQuizFlow';
import { PortraitFlow } from './src/app/mirror/PortraitFlow';
import { OnboardingFlow } from './src/app/onboarding/OnboardingFlow';
import { OpeningFlow } from './src/app/plan/OpeningFlow';
import { activeThread, Thread } from './src/app/plan/threadRepo';
import { VowWizardFlow } from './src/app/plan/VowWizardFlow';
import { SettingsScreen } from './src/app/settings/SettingsScreen';
import { isUnplugged } from './src/app/quiet/quietRepo';
import { UnplugFlow, VEIL_LINE } from './src/app/quiet/UnplugFlow';
import { EveningFlow } from './src/app/threshold/EveningFlow';
import { MorningFlow } from './src/app/threshold/MorningFlow';
import { CompassSlot, dueCompassToday } from './src/app/threshold/dueCompass';
import { ThresholdScreen } from './src/app/threshold/ThresholdScreen';
import { QuietVeil } from './src/core/design/QuietVeil';
import { localDateKey } from './src/core/storage/time';

type Route =
  | 'loading'
  | 'onboarding'
  | 'threshold'
  | 'morning'
  | 'evening'
  | 'intake'
  | 'portrait'
  | 'unplug'
  | 'veil'
  | 'settings'
  | 'vow'
  | 'opening';

/** Where the Mirror door leads: the quiz until intake_done, then the Portrait. */
function mirrorRouteFor(state: string | undefined): 'intake' | 'portrait' | null {
  if (state === 'permissions_done' || state === 'intake_in_progress') return 'intake';
  if (state === 'intake_done' || state === 'portrait_seen' || state === 'thread_chosen' || state === 'complete') {
    return 'portrait';
  }
  return null;
}

function App(): React.JSX.Element {
  const [route, setRoute] = useState<Route>('loading');
  const [db, setDb] = useState<SqlDatabase | null>(null);
  const [due, setDue] = useState<CompassSlot>(null);
  const [mirrorRoute, setMirrorRoute] = useState<'intake' | 'portrait' | null>(null);
  const [vowOpen, setVowOpen] = useState(false);
  const [thread, setThread] = useState<Thread | null>(null);

  useEffect(() => {
    (async () => {
      const opened = await storage.open();
      setDb(opened);
      const existing = await getProfile(opened);
      if (existing) setDue(await dueCompassToday(opened, existing, new Date()));
      setMirrorRoute(mirrorRouteFor(existing?.onboardingState));
      const current = await activeThread(opened);
      setThread(current);
      setVowOpen(current !== null && current.replacementHabit === null);
      if (await isUnplugged(opened, new Date())) {
        setRoute('veil'); // a running unplug window is defended (QUIET-01)
        return;
      }
      const onboarded =
        existing !== null &&
        existing.onboardingState !== 'breath_done' &&
        existing.onboardingState !== 'sentence_done';
      setRoute(onboarded ? 'threshold' : 'onboarding');
    })();
  }, []);

  const release = useCallback(async () => {
    if (db) {
      const fresh = await getProfile(db);
      setDue(fresh ? await dueCompassToday(db, fresh, new Date()) : null);
      setMirrorRoute(mirrorRouteFor(fresh?.onboardingState));
      const current = await activeThread(db);
      setThread(current);
      setVowOpen(current !== null && current.replacementHabit === null);
    }
    if (Platform.OS === 'android') BackHandler.exitApp();
    setRoute(db && (await isUnplugged(db, new Date())) ? 'veil' : 'threshold');
  }, [db]);

  return (
    <>
      <StatusBar hidden />
      {route === 'loading' || db === null ? (
        <View style={styles.blank} />
      ) : route === 'onboarding' ? (
        <OnboardingFlow db={db} permissions={permissionRequests} onExit={release} />
      ) : route === 'morning' ? (
        <MorningFlow db={db} opening={thread?.microAct} onExit={release} />
      ) : route === 'evening' ? (
        <EveningFlow db={db} onExit={release} />
      ) : route === 'intake' ? (
        <IntakeQuizFlow db={db} onExit={release} />
      ) : route === 'portrait' ? (
        <PortraitFlow db={db} onExit={release} />
      ) : route === 'settings' ? (
        <SettingsScreen
          onClose={release}
          onEraseAll={async () => {
            // INV-6: immediate, irrecoverable; re-launch equals true first run.
            await storage.eraseAll();
            setDb(await storage.open());
            setDue(null);
            setMirrorRoute(null);
            setRoute('onboarding');
          }}
        />
      ) : route === 'vow' ? (
        <VowWizardFlow db={db} onExit={release} />
      ) : route === 'opening' && thread ? (
        <OpeningFlow db={db} thread={thread} onExit={release} />
      ) : route === 'unplug' ? (
        <UnplugFlow db={db} onExit={release} />
      ) : route === 'veil' ? (
        <QuietVeil line={VEIL_LINE} onLeave={release} />
      ) : (
        <ThresholdScreen
          dueCompass={due}
          onOpenCompass={(slot) => setRoute(slot)}
          opening={
            thread?.microAct && thread.openingDoneOn !== localDateKey(new Date())
              ? thread.microAct
              : null
          }
          onOpenOpening={() => setRoute('opening')}
          onOpenQuiet={() => setRoute('unplug')}
          onOpenMirror={mirrorRoute ? () => setRoute(mirrorRoute) : undefined}
          onOpenVow={vowOpen ? () => setRoute('vow') : undefined}
          onOpenSettings={() => setRoute('settings')}
        />
      )}
    </>
  );
}

const styles = StyleSheet.create({
  blank: { flex: 1, backgroundColor: color.paper },
});

export default App;
