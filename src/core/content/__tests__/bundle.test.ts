import {
  activeBundle,
  fallbackBundle,
  loadBundle,
  resetToFallback,
  SignatureVerifier,
  validateBundle,
} from '../bundle';

const trusting: SignatureVerifier = { verify: () => true };
const refusing: SignatureVerifier = { verify: () => false };

afterEach(resetToFallback);

function goodBundlePayload(): string {
  const fallback = fallbackBundle();
  return JSON.stringify({
    ...fallback,
    bundleVersion: '2026.07.1',
    readings: fallback.readings,
    paths: fallback.paths,
  });
}

describe('the fallback bundle (02 §Content)', () => {
  it('is complete and valid by construction — first run works offline', () => {
    const fallback = fallbackBundle();
    expect(validateBundle(fallback)).not.toBeNull();
    expect(fallback.readings.length).toBeGreaterThanOrEqual(7);
    expect(fallback.paths.length).toBeGreaterThanOrEqual(1);
    expect(fallback.intakeQuestions).toHaveLength(84);
    expect(Object.keys(fallback.dareTemplates)).toHaveLength(12);
  });
});

describe('loadBundle — verify before trust (NFR-R2)', () => {
  it('activates a signed, well-formed bundle', () => {
    expect(loadBundle(goodBundlePayload(), 'sig', trusting)).toBe('activated');
    expect(activeBundle().bundleVersion).toBe('2026.07.1');
  });

  it('a bad signature changes nothing — checked before parsing', () => {
    expect(loadBundle(goodBundlePayload(), 'sig', refusing)).toBe('rejected_signature');
    expect(activeBundle().bundleVersion).toBe('2026.06.1-embedded');
  });

  it('malformed JSON is a non-event, never a crash', () => {
    expect(loadBundle('{"bundleVersion": ', 'sig', trusting)).toBe('rejected_parse');
    expect(activeBundle().bundleVersion).toBe('2026.06.1-embedded');
  });

  it('a wrong shape is refused whole — no partial activation', () => {
    const missingReadings = JSON.stringify({ bundleVersion: 'x', locale: 'en', paths: [], intakeQuestions: [] });
    expect(loadBundle(missingReadings, 'sig', trusting)).toBe('rejected_shape');

    const emptyReadingBody = JSON.stringify({
      ...fallbackBundle(),
      readings: [{ id: 'r', title: 't', author: 'a', body: [], closingQuestion: 'q?' }],
    });
    expect(loadBundle(emptyReadingBody, 'sig', trusting)).toBe('rejected_shape');
    expect(activeBundle().bundleVersion).toBe('2026.06.1-embedded');
  });

  it('a path pointing at a missing reading is refused — no voids', () => {
    const fallback = fallbackBundle();
    const danglingPath = JSON.stringify({
      ...fallback,
      paths: [
        {
          id: 'path.broken',
          title: 'broken',
          days: Array.from({ length: 7 }, () => ({
            readingId: 'reading.does-not-exist',
            question: 'q?',
            act: 'do a thing somewhere real',
          })),
        },
      ],
    });
    expect(loadBundle(danglingPath, 'sig', trusting)).toBe('rejected_shape');
  });

  it('a path outside 7–14 days is refused (LIB-02)', () => {
    const fallback = fallbackBundle();
    const shortPath = JSON.stringify({
      ...fallback,
      paths: [{ id: 'p', title: 't', days: fallback.paths[0].days.slice(0, 3) }],
    });
    expect(loadBundle(shortPath, 'sig', trusting)).toBe('rejected_shape');
  });
});
