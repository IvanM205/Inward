import { FlowGraph, validateFlow } from '../flowGraph';

const lawful: FlowGraph = {
  name: 'fixture lawful',
  entry: 'a',
  screens: [
    { id: 'a', kind: 'screen' },
    { id: 'b', kind: 'screen' },
    { id: 'end', kind: 'terminal' },
  ],
  edges: [
    { from: 'a', to: 'b' },
    { from: 'a', to: 'end' },
    { from: 'b', to: 'end' },
  ],
};

describe('validateFlow', () => {
  it('accepts a lawful flow', () => {
    expect(validateFlow(lawful)).toEqual([]);
  });

  it('rejects a flow without a terminal screen', () => {
    const flow: FlowGraph = {
      name: 'no-terminal',
      entry: 'a',
      screens: [
        { id: 'a', kind: 'screen' },
        { id: 'b', kind: 'screen' },
      ],
      edges: [{ from: 'a', to: 'b' }],
    };
    const errors = validateFlow(flow);
    expect(errors.join('\n')).toMatch(/no terminal screen/);
  });

  it('rejects cycles — no loops, only exits', () => {
    const flow: FlowGraph = {
      ...lawful,
      name: 'cyclic',
      edges: [...lawful.edges, { from: 'b', to: 'a' }],
    };
    expect(validateFlow(flow).join('\n')).toMatch(/cycle/);
  });

  it('rejects non-terminal dead ends', () => {
    const flow: FlowGraph = {
      name: 'dead-end',
      entry: 'a',
      screens: [
        { id: 'a', kind: 'screen' },
        { id: 'b', kind: 'screen' },
        { id: 'end', kind: 'terminal' },
      ],
      edges: [
        { from: 'a', to: 'b' },
        { from: 'a', to: 'end' },
      ],
    };
    expect(validateFlow(flow).join('\n')).toMatch(/dead end/);
  });

  it('rejects terminal screens with outgoing edges', () => {
    const flow: FlowGraph = {
      ...lawful,
      name: 'terminal-exit',
      edges: [...lawful.edges, { from: 'end', to: 'a' }],
    };
    expect(validateFlow(flow).join('\n')).toMatch(/terminal means exit only/);
  });

  it('rejects unreachable screens', () => {
    const flow: FlowGraph = {
      name: 'unreachable',
      entry: 'a',
      screens: [
        { id: 'a', kind: 'screen' },
        { id: 'orphan', kind: 'screen' },
        { id: 'end', kind: 'terminal' },
      ],
      edges: [
        { from: 'a', to: 'end' },
        { from: 'orphan', to: 'end' },
      ],
    };
    expect(validateFlow(flow).join('\n')).toMatch(/unreachable/);
  });

  it('rejects edges to undeclared screens', () => {
    const flow: FlowGraph = {
      ...lawful,
      name: 'ghost-edge',
      edges: [...lawful.edges, { from: 'b', to: 'ghost' }],
    };
    expect(validateFlow(flow).join('\n')).toMatch(/unknown screen/);
  });

  it('rejects an entry that is not a declared screen', () => {
    const flow: FlowGraph = { ...lawful, name: 'bad-entry', entry: 'nope' };
    expect(validateFlow(flow).join('\n')).toMatch(/entry/);
  });
});
