/**
 * FlowHost — runs a declared FlowGraph as real navigation (NFR-A3).
 *
 * Navigation is built FROM the graphs in src/flows/registry.ts: a screen can
 * only move along a declared edge, so the route-graph covenant test (no loops,
 * every dead end terminal, INV-3) validates exactly what ships. There is no
 * back stack — no loops, only exits (01 §IA).
 */
import React, { useMemo, useState } from 'react';
import { FlowGraph, validateFlow } from './flowGraph';

export interface FlowScreenApi {
  /**
   * Follow an edge. With one outgoing edge `to` may be omitted; with several,
   * name the destination. Moving off-graph is a programming error and throws.
   */
  advance: (to?: string) => void;
  /** Release the user (terminal screens; the host exits or pops to root). */
  exit: () => void;
}

export type ScreenRenderer = (api: FlowScreenApi) => React.JSX.Element;

export interface FlowHostProps {
  flow: FlowGraph;
  renderers: Record<string, ScreenRenderer>;
  /** Called when a terminal screen releases the user (INV-3). */
  onExit: () => void;
  /** Fires after every transition — hosts persist progress here (e.g. onboarding_state). */
  onScreenChange?: (screenId: string) => void;
}

/** Throws unless the flow is lawful AND fully renderable — run before mount. */
export function assertRunnableFlow(flow: FlowGraph, renderers: Record<string, ScreenRenderer>): void {
  const violations = validateFlow(flow);
  if (violations.length > 0) {
    throw new Error(`FlowHost given an unlawful flow:\n${violations.join('\n')}`);
  }
  for (const screen of flow.screens) {
    if (!renderers[screen.id]) {
      throw new Error(`${flow.name}: no renderer for screen "${screen.id}"`);
    }
  }
}

export function FlowHost({ flow, renderers, onExit, onScreenChange }: FlowHostProps): React.JSX.Element {
  useMemo(() => assertRunnableFlow(flow, renderers), [flow, renderers]);

  const [current, setCurrent] = useState(flow.entry);

  const edgesFrom = (id: string): string[] =>
    flow.edges.filter((e) => e.from === id).map((e) => e.to);

  const api: FlowScreenApi = {
    advance: (to?: string) => {
      const targets = edgesFrom(current);
      const next = to ?? (targets.length === 1 ? targets[0] : undefined);
      if (next === undefined) {
        throw new Error(
          `${flow.name}: advance() from "${current}" is ambiguous — name one of: ${targets.join(', ')}`,
        );
      }
      if (!targets.includes(next)) {
        throw new Error(
          `${flow.name}: "${current}" → "${next}" is not a declared edge — navigation only moves along the graph (NFR-A3)`,
        );
      }
      setCurrent(next);
      onScreenChange?.(next);
    },
    exit: onExit,
  };

  return renderers[current](api);
}
