import {
  band,
  clamp,
  displacementScore,
  effectiveScore,
  entryWeight,
  evidenceOffset,
  extractionLevel,
  pullScore,
  rawCapture,
  smoothed,
  timeScore,
} from '../engine';
import { EVIDENCE_OFFSET_CAP } from '../config';

describe('timeScore (04 §1.1)', () => {
  it('maps the documented feeds thresholds: 2h→0, 7h→40, 14h→70, 25h→100', () => {
    expect(timeScore('feeds', 2)).toBe(0);
    expect(timeScore('feeds', 7)).toBeCloseTo(40);
    expect(timeScore('feeds', 14)).toBeCloseTo(70);
    expect(timeScore('feeds', 25)).toBe(100);
  });

  it('is piecewise-linear between thresholds', () => {
    expect(timeScore('feeds', 4.5)).toBeCloseTo(20); // halfway 2→7 ⇒ halfway 0→40
    expect(timeScore('feeds', 10.5)).toBeCloseTo(55); // halfway 7→14 ⇒ halfway 40→70
    expect(timeScore('feeds', 19.5)).toBeCloseTo(85); // halfway 14→25 ⇒ halfway 70→100
  });

  it('clamps below T0 and above Tsat', () => {
    expect(timeScore('feeds', 0)).toBe(0);
    expect(timeScore('feeds', -3)).toBe(0);
    expect(timeScore('feeds', 80)).toBe(100);
  });

  it('uses per-channel thresholds (betting saturates far earlier than feeds)', () => {
    expect(timeScore('betting', 14)).toBe(100);
    expect(timeScore('feeds', 14)).toBeCloseTo(70);
  });
});

describe('pullScore (04 §1.2)', () => {
  it('normalizes five 0–4 items to 0–100', () => {
    expect(pullScore([0, 0, 0, 0, 0])).toBe(0);
    expect(pullScore([4, 4, 4, 4, 4])).toBe(100);
    expect(pullScore([2, 2, 2, 2, 2])).toBe(50);
  });

  it('rejects wrong item counts and out-of-range items', () => {
    expect(() => pullScore([1, 2, 3])).toThrow(/exactly 5/);
    expect(() => pullScore([1, 2, 3, 4, 5])).toThrow(/out of range/);
    expect(() => pullScore([1, 2, 3, 4, -1])).toThrow(/out of range/);
  });

  it('applies the behavioral modifier at 0.5 weight per term', () => {
    // self = 50; +0.5·(10 + 10 + 10) = +15
    expect(pullScore([2, 2, 2, 2, 2], { pickupZ: 10, nightZ: 10, overrunZ: 10 })).toBe(65);
    expect(pullScore([2, 2, 2, 2, 2], { pickupZ: -10, nightZ: -10, overrunZ: -10 })).toBe(35);
  });

  it('clamps each z-term to ±10 and the result to 0–100', () => {
    expect(pullScore([2, 2, 2, 2, 2], { pickupZ: 999, nightZ: 0, overrunZ: 0 })).toBe(55);
    expect(pullScore([4, 4, 4, 4, 4], { pickupZ: 10, nightZ: 10, overrunZ: 10 })).toBe(100);
    expect(pullScore([0, 0, 0, 0, 0], { pickupZ: -10, nightZ: -10, overrunZ: -10 })).toBe(0);
  });
});

describe('displacementScore (04 §1.3)', () => {
  it('sums the named casualties with spec weights', () => {
    expect(displacementScore(['sleep'])).toBe(25);
    expect(displacementScore(['sleep', 'close_relationship', 'finances'])).toBe(70);
  });

  it('counts each casualty once and caps at 100', () => {
    expect(displacementScore(['sleep', 'sleep'])).toBe(25);
    expect(
      displacementScore([
        'sleep', 'close_relationship', 'finances', 'skill_craft', 'body_outdoors', 'meals_with_people',
      ]),
    ).toBe(100);
  });

  it('scores an empty checklist as zero', () => {
    expect(displacementScore([])).toBe(0);
  });
});

describe('rawCapture (04 §1)', () => {
  it('weights 0.35/0.40/0.25', () => {
    expect(rawCapture(100, 0, 0)).toBeCloseTo(35);
    expect(rawCapture(0, 100, 0)).toBeCloseTo(40);
    expect(rawCapture(0, 0, 100)).toBeCloseTo(25);
    expect(rawCapture(100, 100, 100)).toBeCloseTo(100);
  });

  it('rejects out-of-range dimensions', () => {
    expect(() => rawCapture(101, 0, 0)).toThrow(/time out of range/);
    expect(() => rawCapture(0, -1, 0)).toThrow(/pull out of range/);
  });
});

describe('journal evidence (04 §2)', () => {
  it('weighs entry types per the table', () => {
    expect(entryWeight({ type: 'dare_done', channelKeys: ['feeds'], repeatIndex: 0 }, 'feeds')).toBe(1);
    expect(entryWeight({ type: 'gratitude', channelKeys: ['feeds'], repeatIndex: 0 }, 'feeds')).toBe(0.3);
  });

  it('kindness is full weight on relationships, ×0.25 elsewhere', () => {
    expect(entryWeight({ type: 'kindness', channelKeys: ['relationships'], repeatIndex: 0 }, 'relationships')).toBe(0.8);
    expect(entryWeight({ type: 'kindness', channelKeys: ['feeds'], repeatIndex: 0 }, 'feeds')).toBeCloseTo(0.2);
  });

  it('care is full weight on feeds/substances/porn, ×0.25 elsewhere', () => {
    expect(entryWeight({ type: 'care', channelKeys: ['feeds'], repeatIndex: 0 }, 'feeds')).toBe(0.6);
    expect(entryWeight({ type: 'care', channelKeys: ['games'], repeatIndex: 0 }, 'games')).toBeCloseTo(0.15);
  });

  it('contributes nothing to channels the entry is not tagged with', () => {
    expect(entryWeight({ type: 'dare_done', channelKeys: ['feeds'], repeatIndex: 0 }, 'games')).toBe(0);
  });

  it('halves on each near-duplicate repeat (04 §2.2)', () => {
    const base = { type: 'aliveness' as const, channelKeys: ['feeds' as const] };
    expect(entryWeight({ ...base, repeatIndex: 0 }, 'feeds')).toBe(0.6);
    expect(entryWeight({ ...base, repeatIndex: 1 }, 'feeds')).toBe(0.3);
    expect(entryWeight({ ...base, repeatIndex: 2 }, 'feeds')).toBe(0.15);
  });

  it('caps the offset at 10 per channel — the anti-gaming guarantee (04 §6)', () => {
    const entries = Array.from({ length: 30 }, () => ({
      type: 'dare_done' as const,
      channelKeys: ['feeds' as const],
      repeatIndex: 0,
    }));
    expect(evidenceOffset(entries, 'feeds')).toBe(EVIDENCE_OFFSET_CAP);
  });
});

describe('smoothing & effective score (04 §2.3)', () => {
  it('averages the trailing four weeks at most', () => {
    expect(smoothed([80])).toBe(80);
    expect(smoothed([100, 60])).toBe(80);
    expect(smoothed([0, 100, 100, 100, 100])).toBe(100); // older week falls out
  });

  it('requires at least one week', () => {
    expect(() => smoothed([])).toThrow(/at least one/);
  });

  it('effective = max(0, smoothed − offset)', () => {
    expect(effectiveScore(58, 7)).toBe(51);
    expect(effectiveScore(5, 10)).toBe(0);
  });
});

describe('bands & headline level (04 §3)', () => {
  it('bands at 25/60', () => {
    expect(band(0)).toBe('free');
    expect(band(25)).toBe('free');
    expect(band(25.1)).toBe('leaking');
    expect(band(60)).toBe('leaking');
    expect(band(60.1)).toBe('caught');
    expect(band(100)).toBe('caught');
  });

  it('rejects out-of-range scores', () => {
    expect(() => band(-1)).toThrow();
    expect(() => band(101)).toThrow();
  });

  it('extraction level is the score-weighted mean — deep captures dominate', () => {
    // Plain mean of [80, 20] is 50; score-weighting pulls toward the capture.
    expect(extractionLevel([80, 20])).toBeCloseTo((80 * 80 + 20 * 20) / 100);
    expect(extractionLevel([50, 50])).toBe(50);
  });

  it('all-zero channels give level 0', () => {
    expect(extractionLevel([0, 0, 0])).toBe(0);
  });
});

describe('clamp', () => {
  it('clamps both ends', () => {
    expect(clamp(5, 0, 10)).toBe(5);
    expect(clamp(-5, 0, 10)).toBe(0);
    expect(clamp(15, 0, 10)).toBe(10);
  });
});
