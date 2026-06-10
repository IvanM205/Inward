/**
 * Declarative flow graphs — the route-graph harness behind NFR-A3 and the
 * navigation rule of 01 §Information architecture: "no loops, only exits".
 *
 * Every primary flow (morning, evening, reading, dare, craving, ask, …) is
 * declared as a FlowGraph and registered in src/flows/registry.ts. Navigation
 * is built FROM these graphs in M1, so what the test validates is what ships.
 *
 * A valid flow:
 *  - has at least one terminal screen (INV-3: the app closes itself),
 *  - reaches every screen from its entry,
 *  - contains no cycles (no loops, only exits),
 *  - every dead end IS a terminal screen,
 *  - terminal screens have no outgoing edges.
 */

export interface FlowScreen {
  id: string;
  /** 'terminal' = a TerminalScreen(line): night background, one serif line, exit only. */
  kind: 'screen' | 'terminal';
}

export interface FlowEdge {
  from: string;
  to: string;
}

export interface FlowGraph {
  /** Requirement ID this flow implements, e.g. "THR-02 morning". */
  name: string;
  entry: string;
  screens: FlowScreen[];
  edges: FlowEdge[];
}

/** Returns a list of human-readable violations; empty means the flow is lawful. */
export function validateFlow(flow: FlowGraph): string[] {
  const errors: string[] = [];
  const ids = new Set(flow.screens.map((s) => s.id));

  if (!ids.has(flow.entry)) {
    errors.push(`${flow.name}: entry "${flow.entry}" is not a declared screen`);
    return errors;
  }
  for (const e of flow.edges) {
    for (const end of [e.from, e.to]) {
      if (!ids.has(end)) errors.push(`${flow.name}: edge references unknown screen "${end}"`);
    }
  }
  if (errors.length > 0) return errors;

  if (!flow.screens.some((s) => s.kind === 'terminal')) {
    errors.push(`${flow.name}: no terminal screen — every primary flow must end in one (NFR-A3, INV-3)`);
  }

  const out = new Map<string, string[]>(flow.screens.map((s) => [s.id, []]));
  for (const e of flow.edges) out.get(e.from)!.push(e.to);

  for (const s of flow.screens) {
    if (s.kind === 'terminal' && out.get(s.id)!.length > 0) {
      errors.push(`${flow.name}: terminal screen "${s.id}" has outgoing edges — terminal means exit only (INV-3)`);
    }
    if (s.kind !== 'terminal' && out.get(s.id)!.length === 0) {
      errors.push(`${flow.name}: screen "${s.id}" is a dead end but not a terminal screen (NFR-A3)`);
    }
  }

  // Reachability from entry.
  const reached = new Set<string>();
  const queue = [flow.entry];
  while (queue.length > 0) {
    const id = queue.pop()!;
    if (reached.has(id)) continue;
    reached.add(id);
    queue.push(...out.get(id)!);
  }
  for (const s of flow.screens) {
    if (!reached.has(s.id)) errors.push(`${flow.name}: screen "${s.id}" is unreachable from entry`);
  }

  // Cycle detection (DFS, three-color).
  const state = new Map<string, 'visiting' | 'done'>();
  const visit = (id: string): boolean => {
    if (state.get(id) === 'visiting') return true;
    if (state.get(id) === 'done') return false;
    state.set(id, 'visiting');
    for (const next of out.get(id)!) {
      if (visit(next)) return true;
    }
    state.set(id, 'done');
    return false;
  };
  if (visit(flow.entry)) {
    errors.push(`${flow.name}: flow contains a cycle — no loops, only exits (01 §IA)`);
  }

  return errors;
}
