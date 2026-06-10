/**
 * Regression fixture — the worked example "M., 29", channel `feeds` (04 §8).
 *
 * The narrative in 04 §8 carries rounding slop (it quotes week-0 raw as 77.85;
 * the §1 formula gives exactly 77.30 — both ≈ 78 and 'caught'). The formula in
 * §1 is the binding rule, so this fixture pins the FORMULA-exact values and the
 * narrative's band journey: caught (≈78) → leaking (≈51).
 */
import {
  band,
  effectiveScore,
  evidenceOffset,
  rawCapture,
  smoothed,
  timeScore,
} from '../engine';

describe('worked example "M., 29" — feeds (04 §8)', () => {
  it('week 0: Time 84, Pull 81, Displacement 62 ⇒ raw ≈ 78, caught', () => {
    const raw = rawCapture(84, 81, 62);
    expect(raw).toBeCloseTo(77.3, 5);
    expect(Math.abs(raw - 78)).toBeLessThan(1);
    expect(band(raw)).toBe('caught');
  });

  it('week 8: observed 14 h/week ⇒ Time exactly 70 (observed wins over self-report)', () => {
    expect(timeScore('feeds', 14)).toBeCloseTo(70);
  });

  it('week 8: Time 70, re-asked Pull 52, Displacement 38 ⇒ raw falls out of caught', () => {
    const raw = rawCapture(70, 52, 38);
    expect(raw).toBeCloseTo(54.8, 5);
    expect(band(raw)).toBe('leaking');
  });

  it('evidence: a lived month accrues a capped offset (narrative: 7 points)', () => {
    // 18 counted entries with diminishing returns + dares, worth 7 against feeds:
    // four completed dares (1.0 each) + five specific care entries (0.6 full on feeds),
    // the remaining entries near-duplicates decayed to negligible weight.
    const entries = [
      ...Array.from({ length: 4 }, () => ({
        type: 'dare_done' as const,
        channelKeys: ['feeds' as const],
        repeatIndex: 0,
      })),
      ...Array.from({ length: 5 }, () => ({
        type: 'care' as const,
        channelKeys: ['feeds' as const],
        repeatIndex: 0,
      })),
    ];
    expect(evidenceOffset(entries, 'feeds')).toBeCloseTo(7);
  });

  it('week 8 effective: smoothed raw − 7 evidence ⇒ ≈ 51, leaking', () => {
    // Narrative anchor: smoothed ≈ 58 over the trailing month, minus 7 ⇒ 51.
    const effective = effectiveScore(58, 7);
    expect(effective).toBe(51);
    expect(band(effective)).toBe('leaking');
  });

  it('the full week-8 pipeline lands in leaking, falling', () => {
    const weeklyRaw = [62.5, 60.1, 57.8, rawCapture(70, 52, 38)]; // a falling month
    const eff = effectiveScore(smoothed(weeklyRaw), 7);
    expect(band(eff)).toBe('leaking');
    expect(eff).toBeLessThan(rawCapture(84, 81, 62)); // the needle drifted
  });
});
