import { validateFlow } from '../../core/navigation/flowGraph';
import { primaryFlows } from '../registry';

describe('route-graph covenant test (NFR-A3)', () => {
  it('registers at least one primary flow', () => {
    expect(primaryFlows.length).toBeGreaterThan(0);
  });

  it.each(primaryFlows.map((f) => [f.name, f] as const))(
    '%s terminates lawfully',
    (_name, flow) => {
      expect(validateFlow(flow)).toEqual([]);
    },
  );
});
