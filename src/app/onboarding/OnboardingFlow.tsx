/**
 * The first-launch flow, run from its declared graph (ONB-01..03, ONB-05).
 * No account, no email, no sign-in — the profile is a local row created the
 * moment the first breath completes. Intake (ONB-04) arrives in M2 and will
 * extend the graph between permissions and the terminal screen.
 */
import React from 'react';
import { FlowHost } from '../../core/navigation/FlowHost';
import { TerminalScreen } from '../../core/design/TerminalScreen';
import { SqlDatabase } from '../../core/storage/ports';
import { ensureProfile, setOnboardingState } from '../../core/storage/repos/profileRepo';
import { ONBOARDING_FLOW } from '../../flows/registry';
import { BreathScreen } from './BreathScreen';
import { PermissionsScreen, PermissionRequests } from './PermissionsScreen';
import { SentenceScreen } from './SentenceScreen';

export interface OnboardingFlowProps {
  db: SqlDatabase;
  permissions: PermissionRequests;
  /** Runs once when the notification ask is granted — schedules the slots. */
  onNotificationsGranted?: () => Promise<void>;
  /** The terminal screen released the user (INV-3). */
  onExit: () => void;
}

export function OnboardingFlow({
  db,
  permissions,
  onNotificationsGranted,
  onExit,
}: OnboardingFlowProps): React.JSX.Element {
  const wiredPermissions: PermissionRequests = {
    requestNotifications: async () => {
      const granted = await permissions.requestNotifications();
      if (granted) await onNotificationsGranted?.();
      return granted;
    },
    requestScreenTime: () => permissions.requestScreenTime(),
  };
  return (
    <FlowHost
      flow={ONBOARDING_FLOW}
      onExit={onExit}
      renderers={{
        breath: (api) => (
          <BreathScreen
            onDone={async () => {
              await ensureProfile(db, new Date());
              api.advance();
            }}
          />
        ),
        sentence: (api) => (
          <SentenceScreen
            onDone={async () => {
              await setOnboardingState(db, 'sentence_done');
              api.advance();
            }}
          />
        ),
        permissions: (api) => (
          <PermissionsScreen
            permissions={wiredPermissions}
            onDone={async () => {
              await setOnboardingState(db, 'permissions_done');
              api.advance();
            }}
          />
        ),
        'enough-for-today': (api) => (
          <TerminalScreen line="That is enough for today. Go live." onExit={api.exit} />
        ),
      }}
    />
  );
}
