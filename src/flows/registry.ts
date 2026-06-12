/**
 * Registry of every primary flow in Inward. The route-graph test
 * (src/flows/__tests__/registry.test.ts) validates each entry against the
 * covenant rules (NFR-A3) — a flow that is not registered here must not be
 * navigable, and navigation IS built from these graphs via FlowHost.
 *
 * ONB-04 intake (M2) will extend the onboarding graph between permissions and
 * the terminal screen.
 */
import { FlowGraph } from '../core/navigation/flowGraph';

/** ONB-01..03 + ONB-05: breath → sentence → honest permissions → release. */
export const ONBOARDING_FLOW: FlowGraph = {
  name: 'ONB-01..03,05 first launch',
  entry: 'breath',
  screens: [
    { id: 'breath', kind: 'screen' },
    { id: 'sentence', kind: 'screen' },
    { id: 'permissions', kind: 'screen' },
    { id: 'enough-for-today', kind: 'terminal' },
  ],
  edges: [
    { from: 'breath', to: 'sentence' },
    { from: 'sentence', to: 'permissions' },
    { from: 'permissions', to: 'enough-for-today' },
  ],
};

/** THR-02: one question, the Opening, release. Target ≤ 60 s. */
export const MORNING_FLOW: FlowGraph = {
  name: 'THR-02 morning',
  entry: 'question',
  screens: [
    { id: 'question', kind: 'screen' },
    { id: 'opening', kind: 'screen' },
    { id: 'go-live', kind: 'terminal' },
  ],
  edges: [
    { from: 'question', to: 'opening' },
    { from: 'opening', to: 'go-live' },
  ],
};

/**
 * THR-03: direction → gratitudes → evening fold (JRN-02) → the Needle → rest,
 * with the optional hand-off to the sleep wind-down (QUIET-04): one slow
 * breath under the night sky, then sleep. No scores, no graphs.
 */
export const EVENING_FLOW: FlowGraph = {
  name: 'THR-03 evening (+QUIET-04 wind-down)',
  entry: 'direction',
  screens: [
    { id: 'direction', kind: 'screen' },
    { id: 'gratitudes', kind: 'screen' },
    { id: 'fold', kind: 'screen' },
    { id: 'needle', kind: 'screen' },
    { id: 'winddown', kind: 'screen' },
    { id: 'rest', kind: 'terminal' },
    { id: 'sleep', kind: 'terminal' },
  ],
  edges: [
    { from: 'direction', to: 'gratitudes' },
    { from: 'gratitudes', to: 'fold' },
    { from: 'fold', to: 'needle' },
    { from: 'needle', to: 'rest' },
    { from: 'needle', to: 'winddown' },
    { from: 'winddown', to: 'sleep' },
  ],
};

/**
 * ONB-04 intake quiz: one question screen, re-asked with the adaptive
 * cursor (src/app/mirror/adaptive.ts) until done or paused. Both exits are
 * terminal: pausing loses nothing (resumable ≤ 14 days), and abandoning
 * leaves the app fully usable — the Mirror simply waits.
 */
export const INTAKE_FLOW: FlowGraph = {
  name: 'ONB-04 intake quiz',
  entry: 'question',
  screens: [
    { id: 'question', kind: 'screen' },
    { id: 'done', kind: 'terminal' },
    { id: 'paused', kind: 'terminal' },
  ],
  edges: [
    { from: 'question', to: 'done' },
    { from: 'question', to: 'paused' },
  ],
};

/**
 * MIR-01..03 portrait: one bounded page; band explanations expand in place
 * (state, not navigation — no loops, only exits). Seeing it is the end.
 */
export const PORTRAIT_FLOW: FlowGraph = {
  name: 'MIR-01..03 portrait (+ONB-06 first thread)',
  entry: 'portrait',
  screens: [
    { id: 'portrait', kind: 'screen' },
    { id: 'first-thread', kind: 'screen' },
    { id: 'seen', kind: 'terminal' },
  ],
  edges: [
    // Onboarding passes through first-thread selection (ONB-06); later
    // visits go straight to the exit.
    { from: 'portrait', to: 'first-thread' },
    { from: 'portrait', to: 'seen' },
    { from: 'first-thread', to: 'seen' },
  ],
};

/** PLAN-02 vow wizard: the habit loop in the person's words, then the vow. */
export const VOW_FLOW: FlowGraph = {
  name: 'PLAN-02 vow wizard',
  entry: 'cue',
  screens: [
    { id: 'cue', kind: 'screen' },
    { id: 'routine', kind: 'screen' },
    { id: 'what-it-gives', kind: 'screen' },
    { id: 'vow', kind: 'screen' },
    { id: 'micro-act', kind: 'screen' },
    { id: 'held', kind: 'terminal' },
  ],
  edges: [
    { from: 'cue', to: 'routine' },
    { from: 'routine', to: 'what-it-gives' },
    { from: 'what-it-gives', to: 'vow' },
    { from: 'vow', to: 'micro-act' },
    { from: 'micro-act', to: 'held' },
  ],
};

/**
 * THR-04 Today's Opening: one act, finishable today. Completing writes
 * Evidence; leaving it carries no penalty and no copy that says otherwise.
 */
export const OPENING_FLOW: FlowGraph = {
  name: 'THR-04 opening',
  entry: 'act',
  screens: [
    { id: 'act', kind: 'screen' },
    { id: 'done', kind: 'terminal' },
    { id: 'left', kind: 'terminal' },
  ],
  edges: [
    { from: 'act', to: 'done' },
    { from: 'act', to: 'left' },
  ],
};

/**
 * CRAVE-01..03: ninety breathed seconds, the real hunger named, one
 * real-world action, an optional line — under three minutes, every step
 * skippable, and it never blocks the phone.
 */
export const CRAVING_FLOW: FlowGraph = {
  name: 'CRAVE-01..03 craving button',
  entry: 'breath',
  screens: [
    { id: 'breath', kind: 'screen' },
    { id: 'hunger', kind: 'screen' },
    { id: 'action', kind: 'screen' },
    { id: 'note', kind: 'screen' },
    { id: 'decoded', kind: 'terminal' },
  ],
  edges: [
    { from: 'breath', to: 'hunger' },
    { from: 'hunger', to: 'action' },
    { from: 'action', to: 'note' },
    { from: 'note', to: 'decoded' },
  ],
};

/** LIB-01 One Deep Thing: today's reading, then go live it. */
export const READING_FLOW: FlowGraph = {
  name: 'LIB-01 one deep thing',
  entry: 'reading',
  screens: [
    { id: 'reading', kind: 'screen' },
    { id: 'live-it', kind: 'terminal' },
  ],
  edges: [{ from: 'reading', to: 'live-it' }],
};

/** JRN-03: one-line aliveness capture from the widget — in and back out. */
export const WIDGET_CAPTURE_FLOW: FlowGraph = {
  name: 'JRN-03 widget capture',
  entry: 'capture',
  screens: [
    { id: 'capture', kind: 'screen' },
    { id: 'kept', kind: 'terminal' },
  ],
  edges: [{ from: 'capture', to: 'kept' }],
};

/** QUIET-01: one tap chooses 1–4 h; the veil is the end state. */
export const UNPLUG_FLOW: FlowGraph = {
  name: 'QUIET-01 unplug',
  entry: 'choose',
  screens: [
    { id: 'choose', kind: 'screen' },
    { id: 'veil', kind: 'terminal' },
  ],
  edges: [{ from: 'choose', to: 'veil' }],
};

export const primaryFlows: FlowGraph[] = [
  ONBOARDING_FLOW,
  INTAKE_FLOW,
  PORTRAIT_FLOW,
  VOW_FLOW,
  OPENING_FLOW,
  CRAVING_FLOW,
  READING_FLOW,
  MORNING_FLOW,
  EVENING_FLOW,
  WIDGET_CAPTURE_FLOW,
  UNPLUG_FLOW,
];
