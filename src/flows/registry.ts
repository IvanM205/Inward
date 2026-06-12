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
  name: 'MIR-01..03 portrait',
  entry: 'portrait',
  screens: [
    { id: 'portrait', kind: 'screen' },
    { id: 'seen', kind: 'terminal' },
  ],
  edges: [{ from: 'portrait', to: 'seen' }],
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
  MORNING_FLOW,
  EVENING_FLOW,
  WIDGET_CAPTURE_FLOW,
  UNPLUG_FLOW,
];
