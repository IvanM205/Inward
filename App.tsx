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
import { permissionRequests, scheduler, storage } from './src/app/bootstrap';
import { enableCompassLines } from './src/app/notificationsSetup';
import { IntakeQuizFlow } from './src/app/mirror/IntakeQuizFlow';
import { PortraitFlow } from './src/app/mirror/PortraitFlow';
import { OnboardingFlow } from './src/app/onboarding/OnboardingFlow';
import { CravingFlow } from './src/app/crave/CravingFlow';
import { JournalScreen } from './src/app/journal/JournalScreen';
import { ReadingFlow } from './src/app/library/ReadingFlow';
import { todaysReading } from './src/app/library/libraryRepo';
import { PathDayFlow, PathStartFlow } from './src/app/library/PathFlows';
import { activePath, PathState } from './src/app/library/pathRepo';
import { FunnelQuizFlow, ValuesQuizFlow } from './src/app/library/QuizFlows';
import { QuietAction } from './src/core/design/Buttons';
import { OpeningFlow } from './src/app/plan/OpeningFlow';
import { BuildNameFlow } from './src/app/plan/BuildNameFlow';
import { buildThing } from './src/app/plan/buildRepo';
import { RedesignFlow } from './src/app/plan/RedesignFlow';
import { redesignState } from './src/app/plan/redesignRepo';
import { AskFlow } from './src/app/openhand/AskFlow';
import { askAllowed, markAskShown, openHandState } from './src/app/openhand/openHandRepo';
import { RealignFlow } from './src/app/realign/RealignFlow';
import { realignmentDue } from './src/app/realign/realignRepo';
import {
  activeThread,
  markGraduationCelebrated,
  pendingGraduation,
  Thread,
} from './src/app/plan/threadRepo';
import { TerminalScreen } from './src/core/design/TerminalScreen';
import { VowWizardFlow } from './src/app/plan/VowWizardFlow';
import { SettingsScreen } from './src/app/settings/SettingsScreen';
import { DetoxCheckinFlow, DetoxStartFlow } from './src/app/quiet/DetoxFlows';
import { ActiveDetox, activeDetox, isStillnessNow, isUnplugged } from './src/app/quiet/quietRepo';
import { StillnessFlow } from './src/app/quiet/StillnessFlow';
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
  | 'opening'
  | 'crave'
  | 'graduated'
  | 'reading'
  | 'realign'
  | 'detox-start'
  | 'detox-checkin'
  | 'stillness'
  | 'redesign'
  | 'build-name'
  | 'path-start'
  | 'path-day'
  | 'quizzes'
  | 'values-quiz'
  | 'funnel-quiz'
  | 'ask'
  | 'journal';

const STILLNESS_LINE = 'Stillness, kept. The world can hold itself for an hour.';

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
  const [graduated, setGraduated] = useState<Thread | null>(null);
  const [realignDue, setRealignDue] = useState(false);
  const [detox, setDetox] = useState<ActiveDetox | null>(null);
  const [veilLine, setVeilLine] = useState(VEIL_LINE);
  const [redesignOpen, setRedesignOpen] = useState(false);
  const [buildOpen, setBuildOpen] = useState(false);
  const [path, setPath] = useState<PathState | null>(null);

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
      setRealignDue(existing !== null && (await realignmentDue(opened, new Date())));
      setDetox(await activeDetox(opened, new Date()));
      if (existing) {
        setRedesignOpen(!(await redesignState(opened)).retired && (await activeThread(opened)) !== null);
        setBuildOpen((await buildThing(opened)) === null);
        setPath(await activePath(opened, new Date()));
      }
      if ((await isUnplugged(opened, new Date())) || (await isStillnessNow(opened, new Date()))) {
        setVeilLine((await isUnplugged(opened, new Date())) ? VEIL_LINE : STILLNESS_LINE);
        setRoute('veil'); // a running quiet window is defended (QUIET-01/03)
        return;
      }
      const onboarded =
        existing !== null &&
        existing.onboardingState !== 'breath_done' &&
        existing.onboardingState !== 'sentence_done';
      setRoute(onboarded ? 'threshold' : 'onboarding');
    })();
  }, []);

  /**
   * OPEN-02: a finished dare or reading is the only kind of moment that may
   * carry the monthly ask — and only when every other rule agrees.
   */
  const releaseAfter = useCallback(
    async (justCompleted: 'dare' | 'reading') => {
      if (db) {
        const quietNow =
          (await isUnplugged(db, new Date())) || (await isStillnessNow(db, new Date()));
        const allowed = askAllowed(
          await openHandState(db),
          { justCompleted, inCraving: false, inQuiet: quietNow, inOnboarding: false },
          new Date(),
        );
        if (allowed) {
          await markAskShown(db, new Date());
          setRoute('ask');
          return;
        }
      }
      await release();
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [db],
  );

  const release = useCallback(async () => {
    if (db) {
      const fresh = await getProfile(db);
      setDue(fresh ? await dueCompassToday(db, fresh, new Date()) : null);
      setMirrorRoute(mirrorRouteFor(fresh?.onboardingState));
      const current = await activeThread(db);
      setThread(current);
      setVowOpen(current !== null && current.replacementHabit === null);
      setRealignDue(fresh !== null && (await realignmentDue(db, new Date())));
      setDetox(await activeDetox(db, new Date()));
      if (fresh) {
        setRedesignOpen(!(await redesignState(db)).retired && (await activeThread(db)) !== null);
        setBuildOpen((await buildThing(db)) === null);
        setPath(await activePath(db, new Date()));
      }
      const grad = await pendingGraduation(db);
      setGraduated(grad);
      if (grad) {
        setRoute('graduated'); // one quiet sentence, once (PLAN-04)
        return;
      }
    }
    if (Platform.OS === 'android') BackHandler.exitApp();
    const unplugged = db !== null && (await isUnplugged(db, new Date()));
    const still = db !== null && (await isStillnessNow(db, new Date()));
    if (unplugged || still) setVeilLine(unplugged ? VEIL_LINE : STILLNESS_LINE);
    setRoute(unplugged || still ? 'veil' : 'threshold');
  }, [db]);

  return (
    <>
      <StatusBar hidden />
      {route === 'loading' || db === null ? (
        <View style={styles.blank} />
      ) : route === 'onboarding' ? (
        <OnboardingFlow
          db={db}
          permissions={permissionRequests}
          onNotificationsGranted={() => enableCompassLines(db, scheduler)}
          onExit={release}
        />
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
            // INV-6: immediate, irrecoverable; re-launch equals true first run —
            // including every piece of in-memory room state.
            await storage.eraseAll();
            setDb(await storage.open());
            setDue(null);
            setMirrorRoute(null);
            setThread(null);
            setVowOpen(false);
            setGraduated(null);
            setRealignDue(false);
            setDetox(null);
            setRedesignOpen(false);
            setBuildOpen(false);
            setPath(null);
            setRoute('onboarding');
          }}
        />
      ) : route === 'vow' ? (
        <VowWizardFlow db={db} onExit={release} />
      ) : route === 'opening' && thread ? (
        <OpeningFlow
          db={db}
          thread={thread}
          // Only a COMPLETED act is a good moment (OPEN-02); a skipped
          // opening releases plainly, with no ask attached.
          onExit={(completed) => (completed ? releaseAfter('dare') : release())}
        />
      ) : route === 'crave' ? (
        <CravingFlow db={db} thread={thread} onExit={release} />
      ) : route === 'reading' ? (
        <ReadingFlow db={db} reading={todaysReading(new Date())} onExit={() => releaseAfter('reading')} />
      ) : route === 'realign' ? (
        <RealignFlow db={db} onExit={release} />
      ) : route === 'detox-start' ? (
        <DetoxStartFlow db={db} onExit={release} />
      ) : route === 'detox-checkin' ? (
        <DetoxCheckinFlow db={db} onExit={release} />
      ) : route === 'graduated' && graduated ? (
        <TerminalScreen
          line="Four weeks held. The thread is loosened — wear the season lightly."
          onExit={async () => {
            await markGraduationCelebrated(db, graduated.id);
            setGraduated(null);
            setRoute('threshold');
          }}
        />
      ) : route === 'unplug' ? (
        <UnplugFlow db={db} onExit={release} onDesignStillness={() => setRoute('stillness')} />
      ) : route === 'stillness' ? (
        <StillnessFlow db={db} onExit={release} />
      ) : route === 'redesign' ? (
        <RedesignFlow db={db} onExit={release} />
      ) : route === 'build-name' ? (
        <BuildNameFlow db={db} onExit={release} />
      ) : route === 'path-start' ? (
        <PathStartFlow db={db} onExit={release} />
      ) : route === 'path-day' ? (
        <PathDayFlow db={db} onExit={release} />
      ) : route === 'quizzes' ? (
        // Chooser chrome, like the Threshold's doors — not a flow of its own.
        <View style={styles.chooser}>
          <QuietAction label="the values quiz — said and lived" onPress={() => setRoute('values-quiz')} />
          <QuietAction label="the attention audit" onPress={() => setRoute('funnel-quiz')} />
          <QuietAction label="back to the threshold" onPress={release} />
        </View>
      ) : route === 'values-quiz' ? (
        <ValuesQuizFlow db={db} onExit={release} />
      ) : route === 'funnel-quiz' ? (
        <FunnelQuizFlow onExit={release} />
      ) : route === 'ask' ? (
        <AskFlow db={db} onExit={release} />
      ) : route === 'journal' ? (
        <JournalScreen db={db} onClose={release} />
      ) : route === 'veil' ? (
        <QuietVeil line={veilLine} onLeave={release} />
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
          onOpenDetox={() => setRoute(detox ? 'detox-checkin' : 'detox-start')}
          detoxDoorLabel={
            detox ? `detox — day ${detox.dayIndex} of ${detox.state.program}` : 'dopamine detox'
          }
          onOpenCraving={() => setRoute('crave')}
          onOpenReading={() => setRoute('reading')}
          onOpenPath={
            path === null
              ? () => setRoute('path-start')
              : path.doneToday
                ? undefined // today is walked; the door rests until tomorrow
                : () => setRoute('path-day')
          }
          pathDoorLabel={
            path ? `the path — day ${path.dayIndex} of ${path.path.days.length}` : 'a path'
          }
          onOpenQuizzes={() => setRoute('quizzes')}
          onOpenRealign={realignDue ? () => setRoute('realign') : undefined}
          onOpenMirror={mirrorRoute ? () => setRoute(mirrorRoute) : undefined}
          onOpenVow={vowOpen ? () => setRoute('vow') : undefined}
          onOpenRedesign={redesignOpen ? () => setRoute('redesign') : undefined}
          onOpenBuild={buildOpen ? () => setRoute('build-name') : undefined}
          onOpenJournal={() => setRoute('journal')}
          onOpenSettings={() => setRoute('settings')}
        />
      )}
    </>
  );
}

const styles = StyleSheet.create({
  blank: { flex: 1, backgroundColor: color.paper },
  chooser: {
    flex: 1,
    backgroundColor: color.paper,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default App;
