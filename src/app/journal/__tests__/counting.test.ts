import { isSpecific, repeatIndex, tokenJaccard } from '../counting';

describe('specificity rule (04 §2.2, JRN-04)', () => {
  it('accepts concrete past-tense sentences with a named thing', () => {
    expect(isSpecific('I called my brother Tomáš after dinner')).toBe(true);
    expect(isSpecific('Walked to the river with Eva')).toBe(true);
    expect(isSpecific('I fixed the broken gate in the garden')).toBe(true);
  });

  it('rejects entries under the minimum word count', () => {
    expect(isSpecific('helped mom')).toBe(false);
    expect(isSpecific('was kind')).toBe(false);
  });

  it('rejects vague present-tense or abstract lines', () => {
    expect(isSpecific('I am feeling very good today')).toBe(false);
    expect(isSpecific('so very good really')).toBe(false);
  });

  it('rejects empty and whitespace text', () => {
    expect(isSpecific('')).toBe(false);
    expect(isSpecific('   ')).toBe(false);
  });
});

describe('tokenJaccard (04 §2.2 diminishing returns)', () => {
  it('is 1 for identical text and 0 for disjoint text', () => {
    expect(tokenJaccard('called my brother', 'called my brother')).toBe(1);
    expect(tokenJaccard('walked the dog', 'baked sour bread')).toBe(0);
  });

  it('ignores punctuation and case', () => {
    expect(tokenJaccard('Called my brother!', 'called my brother')).toBe(1);
  });

  it('scores partial overlap between 0 and 1', () => {
    const sim = tokenJaccard('called my brother after dinner', 'called my sister after dinner');
    expect(sim).toBeGreaterThan(0.5);
    expect(sim).toBeLessThan(1);
  });
});

describe('repeatIndex', () => {
  it('counts near-duplicates at or above the 0.7 threshold', () => {
    const recent = [
      'called my brother after dinner',
      'called my brother after dinner today',
      'planted tomatoes with my daughter',
    ];
    expect(repeatIndex('called my brother after dinner', recent)).toBe(2);
  });

  it('is 0 when nothing similar was written', () => {
    expect(repeatIndex('called my brother', ['baked sour bread'])).toBe(0);
    expect(repeatIndex('called my brother', [])).toBe(0);
  });
});
