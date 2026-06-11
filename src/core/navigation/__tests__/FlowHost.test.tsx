import React from 'react';
import { Text } from 'react-native';
import ReactTestRenderer from 'react-test-renderer';
import { FlowGraph } from '../flowGraph';
import { assertRunnableFlow, FlowHost, FlowScreenApi } from '../FlowHost';

const FLOW: FlowGraph = {
  name: 'TEST two-step',
  entry: 'ask',
  screens: [
    { id: 'ask', kind: 'screen' },
    { id: 'fork-a', kind: 'terminal' },
    { id: 'fork-b', kind: 'terminal' },
  ],
  edges: [
    { from: 'ask', to: 'fork-a' },
    { from: 'ask', to: 'fork-b' },
  ],
};

function renderFlow(onExit: () => void = () => {}) {
  const apis: Record<string, FlowScreenApi> = {};
  let tree!: ReactTestRenderer.ReactTestRenderer;
  ReactTestRenderer.act(() => {
    tree = ReactTestRenderer.create(
      <FlowHost
        flow={FLOW}
        onExit={onExit}
        renderers={{
          ask: (api) => {
            apis.ask = api;
            return <Text>the question</Text>;
          },
          'fork-a': (api) => {
            apis['fork-a'] = api;
            return <Text>terminal a</Text>;
          },
          'fork-b': (api) => {
            apis['fork-b'] = api;
            return <Text>terminal b</Text>;
          },
        }}
      />,
    );
  });
  return { tree, apis };
}

describe('FlowHost — navigation built from the declared graph (NFR-A3)', () => {
  it('renders the entry screen first', () => {
    const { tree } = renderFlow();
    expect(JSON.stringify(tree.toJSON())).toContain('the question');
  });

  it('advances along a declared edge', () => {
    const { tree, apis } = renderFlow();
    ReactTestRenderer.act(() => apis.ask.advance('fork-a'));
    expect(JSON.stringify(tree.toJSON())).toContain('terminal a');
  });

  it('refuses to move off-graph', () => {
    const { apis } = renderFlow();
    expect(() => apis.ask.advance('nowhere')).toThrow(/not a declared edge/);
  });

  it('requires naming the destination when several edges leave a screen', () => {
    const { apis } = renderFlow();
    expect(() => apis.ask.advance()).toThrow(/ambiguous/);
  });

  it('terminal screens release the user through onExit (INV-3)', () => {
    const onExit = jest.fn();
    const { apis } = renderFlow(onExit);
    ReactTestRenderer.act(() => apis.ask.advance('fork-b'));
    apis['fork-b'].exit();
    expect(onExit).toHaveBeenCalled();
  });

  // assertRunnableFlow guards FlowHost's render; tested directly because
  // React 19 reports render errors to the error handler instead of rethrowing
  // through ReactTestRenderer.create.
  it('rejects an unlawful flow outright', () => {
    const cyclic: FlowGraph = {
      name: 'TEST cycle',
      entry: 'a',
      screens: [
        { id: 'a', kind: 'screen' },
        { id: 'b', kind: 'screen' },
        { id: 't', kind: 'terminal' },
      ],
      edges: [
        { from: 'a', to: 'b' },
        { from: 'b', to: 'a' },
        { from: 'b', to: 't' },
      ],
    };
    const renderers = { a: () => <Text>a</Text>, b: () => <Text>b</Text>, t: () => <Text>t</Text> };
    expect(() => assertRunnableFlow(cyclic, renderers)).toThrow(/unlawful flow/);
  });

  it('rejects a flow with a missing renderer', () => {
    expect(() => assertRunnableFlow(FLOW, { ask: () => <Text>q</Text> })).toThrow(/no renderer/);
  });
});
