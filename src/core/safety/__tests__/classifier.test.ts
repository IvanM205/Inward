import { classifyText, severityGate, SEVERITY_CHANNELS } from '../classifier';
import { helpResources, RESOURCE_LIST_VERSION } from '../resources';
import { IntakeResponse } from '../../../app/mirror/intakeRepo';

function pullResponse(channel: string, normalized: number, skipped = false): IntakeResponse {
  return {
    id: `r-${channel}-${normalized}-${Math.floor(normalized)}`,
    createdAt: 'now',
    questionId: `q.${channel}.pull.1`,
    channelKey: channel as IntakeResponse['channelKey'],
    dimension: 'pull',
    rawAnswer: null,
    normalized,
    skipped,
  };
}

describe('classifyText (SAFE-01)', () => {
  it('triggers on self-harm signals, in both launch locales', () => {
    expect(classifyText('some nights I think about killing myself').kind).toBe('self_harm');
    expect(classifyText('I want to die').triggered).toBe(true);
    expect(classifyText('rozmýšľam, že si ublížim').kind).toBe('self_harm');
  });

  it('triggers on acute distress', () => {
    expect(classifyText("I can't take this anymore").kind).toBe('acute_distress');
    expect(classifyText('už nevládzem').triggered).toBe(true);
  });

  it('stays quiet on ordinary language', () => {
    expect(classifyText('I killed it at work today').triggered).toBe(false);
    expect(classifyText('this deadline is brutal').triggered).toBe(false);
    expect(classifyText('walked the dog and felt alive').triggered).toBe(false);
  });
});

describe('severityGate (SAFE-01/03)', () => {
  it('routes severity patterns in substances, betting, and porn', () => {
    for (const channel of SEVERITY_CHANNELS) {
      const hot = [pullResponse(channel, 100), pullResponse(channel, 75)];
      expect(severityGate(hot).kind).toBe('addiction_severity');
    }
  });

  it('does not route high pull on non-severity channels — feeds are the product’s job', () => {
    expect(severityGate([pullResponse('feeds', 100)]).triggered).toBe(false);
  });

  it('does not route moderate pull, and ignores skipped answers', () => {
    expect(severityGate([pullResponse('substances', 50)]).triggered).toBe(false);
    expect(severityGate([pullResponse('substances', 100, true)]).triggered).toBe(false);
    expect(severityGate([]).triggered).toBe(false);
  });
});

describe('help resources (SAFE-02)', () => {
  it('is versioned and has region lines for both launch locales', () => {
    expect(RESOURCE_LIST_VERSION).toMatch(/^\d{4}\.\d{2}\.\d+$/);
    expect(helpResources('sk').some((r) => r.contact === '0800 800 566')).toBe(true); // national line
    expect(helpResources('sk').some((r) => r.contact === '112')).toBe(true);
    expect(helpResources('en').length).toBeGreaterThan(0);
  });
});
