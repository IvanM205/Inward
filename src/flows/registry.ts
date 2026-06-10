/**
 * Registry of every primary flow in Inward. The route-graph test
 * (src/flows/__tests__/registry.test.ts) validates each entry against the
 * covenant rules (NFR-A3) — a flow that is not registered here must not be
 * navigable, and PR review enforces that navigation is only built from these
 * graphs.
 *
 * M1 adds: THR-02 morning, THR-03 evening, THR-04 opening, QUIET-01 unplug,
 * JRN-03 widget capture. M0 ships the harness with the onboarding skeleton.
 */
import { FlowGraph } from '../core/navigation/flowGraph';

export const primaryFlows: FlowGraph[] = [
  {
    name: 'ONB-01..03 first launch (skeleton)',
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
  },
];
