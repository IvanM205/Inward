import { composeRequest } from '../gateway';
import { COMPANION_SYSTEM_PROMPT, PERSONA_VERSION } from '../persona';
import { SOFT_CLOSE_AFTER_MS, softCloseDue } from '../sessionRules';

describe('the persona (COMP-01/03/04)', () => {
  it('is versioned and carries the non-negotiables in plain words', () => {
    expect(PERSONA_VERSION).toMatch(/^\d{4}\.\d{2}\.\d+$/);
    expect(COMPANION_SYSTEM_PROMPT).toContain('ask before advising');
    expect(COMPANION_SYSTEM_PROMPT).toContain('do not diagnose');
    expect(COMPANION_SYSTEM_PROMPT).toContain('question for a doctor');
    expect(COMPANION_SYSTEM_PROMPT).toContain('replacement for therapy');
    expect(COMPANION_SYSTEM_PROMPT).toContain('twenty minutes');
    expect(COMPANION_SYSTEM_PROMPT).toContain('Go say it');
    expect(COMPANION_SYSTEM_PROMPT).toContain('never suggest returning');
    expect(COMPANION_SYSTEM_PROMPT).toContain('No selling');
  });

  it('never promises confidentiality on behalf of others (SAFE-04)', () => {
    expect(COMPANION_SYSTEM_PROMPT).toContain('no promises about other services');
  });
});

describe('composeRequest — the privacy gateway contract (02 §gateway)', () => {
  it('routes crisis language to help before any request exists (SAFE-01)', () => {
    const result = composeRequest([], 'some nights I think about killing myself', []);
    expect(result.route).toBe('help');
    if (result.route === 'help') {
      expect(result.signal.kind).toBe('self_harm');
    }
  });

  it('composes a stateless request with only exposed evidence', () => {
    const result = composeRequest(
      [{ role: 'companion', text: 'What would you like to untangle?' }],
      'I keep promising myself evenings and losing them',
      ['walked the long way home past the river'],
    );
    expect(result.route).toBe('send');
    if (result.route === 'send') {
      expect(result.request.personaVersion).toBe(PERSONA_VERSION);
      expect(result.request.systemPrompt).toBe(COMPANION_SYSTEM_PROMPT);
      expect(result.request.messages).toHaveLength(2);
      expect(result.request.exposedEvidence).toEqual([
        'walked the long way home past the river',
      ]);
      expect(result.request.requestId).toMatch(/^[0-9a-f-]{36}$/); // ephemeral
    }
  });

  it('two requests never share an id — nothing to correlate server-side', () => {
    const a = composeRequest([], 'hello', []);
    const b = composeRequest([], 'hello', []);
    if (a.route === 'send' && b.route === 'send') {
      expect(a.request.requestId).not.toBe(b.request.requestId);
    } else {
      throw new Error('expected both to compose');
    }
  });
});

describe('session rules (COMP-03)', () => {
  it('begins the soft close around twenty minutes', () => {
    const start = new Date(2026, 5, 12, 21, 0, 0);
    expect(softCloseDue(start, new Date(2026, 5, 12, 21, 10))).toBe(false);
    expect(softCloseDue(start, new Date(start.getTime() + SOFT_CLOSE_AFTER_MS))).toBe(true);
  });
});
