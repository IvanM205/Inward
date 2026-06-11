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
import { getProfile, Profile } from './src/core/storage/repos/profileRepo';
import { permissionRequests, storage } from './src/app/bootstrap';
import { OnboardingFlow } from './src/app/onboarding/OnboardingFlow';
import { isUnplugged } from './src/app/quiet/quietRepo';
import { UnplugFlow, VEIL_LINE } from './src/app/quiet/UnplugFlow';
import { EveningFlow } from './src/app/threshold/EveningFlow';
import { MorningFlow } from './src/app/threshold/MorningFlow';
import { CompassSlot, ThresholdScreen } from './src/app/threshold/ThresholdScreen';
import { QuietVeil } from './src/core/design/QuietVeil';

type Route = 'loading' | 'onboarding' | 'threshold' | 'morning' | 'evening' | 'unplug' | 'veil';

/** Which compass is due: morning until its hour has long passed, evening after. */
export function dueCompass(profile: Profile, now: Date): CompassSlot {
  const minutes = now.getHours() * 60 + now.getMinutes();
  const [eh, em] = profile.eveningHour.split(':').map(Number);
  const [mh, mm] = profile.morningHour.split(':').map(Number);
  if (minutes >= eh * 60 + em) return 'evening';
  if (minutes >= mh * 60 + mm) return 'morning';
  return null;
}

function App(): React.JSX.Element {
  const [route, setRoute] = useState<Route>('loading');
  const [db, setDb] = useState<SqlDatabase | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    (async () => {
      const opened = await storage.open();
      setDb(opened);
      const existing = await getProfile(opened);
      setProfile(existing);
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
    if (db) setProfile(await getProfile(db));
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
        <MorningFlow onExit={release} />
      ) : route === 'evening' ? (
        <EveningFlow db={db} onExit={release} />
      ) : route === 'unplug' ? (
        <UnplugFlow db={db} onExit={release} />
      ) : route === 'veil' ? (
        <QuietVeil line={VEIL_LINE} onLeave={release} />
      ) : (
        <ThresholdScreen
          dueCompass={profile ? dueCompass(profile, new Date()) : null}
          onOpenCompass={(slot) => setRoute(slot)}
          onOpenQuiet={() => setRoute('unplug')}
        />
      )}
    </>
  );
}

const styles = StyleSheet.create({
  blank: { flex: 1, backgroundColor: color.paper },
});

export default App;
