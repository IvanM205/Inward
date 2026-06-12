import React from 'react';
import ReactTestRenderer from 'react-test-renderer';

jest.useFakeTimers();
import { Storage } from '../../../core/storage/Storage';
import { ensureProfile, getProfile } from '../../../core/storage/repos/profileRepo';
import {
  FakeDatabaseProvider,
  FakeKeyStore,
  FakeNotifications,
  FakeWidgets,
} from '../../../core/storage/testing/fakes';
import { funnelResultCopy, funnelShareText, funnelVerdict } from '../funnel';
import { FunnelQuizFlow, ValuesQuizFlow } from '../QuizFlows';

beforeEach(() => {
  jest
    .spyOn(require('react-native').AccessibilityInfo, 'isReduceMotionEnabled')
    .mockResolvedValue(true);
});

async function openDb() {
  const storage = new Storage({
    databaseProvider: new FakeDatabaseProvider(),
    keyStore: new FakeKeyStore(),
    widgets: new FakeWidgets(),
    notifications: new FakeNotifications(),
  });
  const db = await storage.open();
  await ensureProfile(db, new Date(2026, 5, 12));
  return db;
}

async function press(tree: ReactTestRenderer.ReactTestRenderer, label: string, nth = 0) {
  const targets = tree.root.findAll(
    (n) => n.props.accessibilityLabel === label && typeof n.props.onPress === 'function',
  );
  if (!targets[nth]) throw new Error(`No pressable labeled "${label}" (#${nth}) on screen.`);
  await ReactTestRenderer.act(async () => targets[nth].props.onPress());
}

describe('funnelVerdict (LIB-04, 04 §6)', () => {
  it('answers with a coarse phrase, never a number', () => {
    expect(funnelVerdict([0, 0, 0, 0, 0])).toBe('mostly yours');
    expect(funnelVerdict([2, 2, 2, 2, 2])).toBe('on loan');
    expect(funnelVerdict([4, 4, 4, 4, 3])).toBe('being farmed');
  });

  it('the share text is channel-free, numberless, and pitchless', () => {
    for (const verdict of ['mostly yours', 'on loan', 'being farmed'] as const) {
      const share = funnelShareText(verdict);
      expect(share).not.toMatch(/\d/);
      expect(share).not.toMatch(/feeds|series|porn|betting|substances/i);
      expect(share).not.toMatch(/download|install|try|app store/i);
      const copy = funnelResultCopy(verdict);
      expect(copy.line).not.toMatch(/!/);
      expect(copy.nextStep.length).toBeGreaterThan(10);
    }
  });
});

describe('ValuesQuizFlow (LIB-04)', () => {
  it('stated → lived → merciful gap → one step; chosen values persisted', async () => {
    const db = await openDb();
    let tree!: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(async () => {
      tree = ReactTestRenderer.create(<ValuesQuizFlow db={db} onExit={() => {}} />);
    });
    await press(tree, 'family');
    await press(tree, 'nature');
    await press(tree, 'that is what i say');

    // Lived: only family received an hour.
    await press(tree, 'family');
    await press(tree, 'honestly, that');

    const gap = JSON.stringify(tree.toJSON());
    expect(gap).toContain('nature'); // the waiting value, named plainly
    expect(gap).toContain('Not a failing — a direction.');
    await press(tree, 'i see it');
    expect(JSON.stringify(tree.toJSON())).toContain('Give nature one unhurried hour');

    expect((await getProfile(db))!.chosenValues).toEqual(['family', 'nature']);
    await ReactTestRenderer.act(async () => tree.unmount());
  });
});

describe('FunnelQuizFlow (LIB-04)', () => {
  it('five questions, one coarse phrase, terminal end', async () => {
    let tree!: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(async () => {
      tree = ReactTestRenderer.create(<FunnelQuizFlow onExit={() => {}} />);
    });
    for (let i = 0; i < 5; i++) {
      await press(tree, 'always');
    }
    const json = JSON.stringify(tree.toJSON());
    expect(json).toContain('being farmed');
    expect(json).toContain('a design aimed at you');
    await ReactTestRenderer.act(async () => tree.unmount());
  });
});

describe('Slovak funnel and content (NFR-X2)', () => {
  const { funnelQuestionText, FUNNEL_QUESTIONS_SK } = require('../funnel');
  const { mechanismLine } = require('../../../core/content/mechanisms');
  const { suggestAction } = require('../../crave/suggestions');

  it('asks, answers, and shares in Slovak without losing the rules', () => {
    expect(FUNNEL_QUESTIONS_SK).toHaveLength(5);
    expect(funnelQuestionText(0, 'sk')).toContain('Telefón');
    const copy = funnelResultCopy('being farmed', 'sk');
    expect(copy.line).toContain('dizajn mierený na teba');
    expect(copy.line).not.toMatch(/!/);
    const share = funnelShareText('on loan', 'sk');
    expect(share).toContain('požičaná');
    expect(share).not.toMatch(/\d/);
  });

  it('mechanisms and suggestions translate; English stays canonical', () => {
    expect(mechanismLine('feeds', 'sk')).toContain('úroda');
    expect(mechanismLine('feeds', 'en')).toContain('harvest');
    expect(suggestAction('rest', new Date(2026, 5, 12, 12, 0), 'sk')).toContain('telefón v inej izbe');
    expect(suggestAction('rest', new Date(2026, 5, 12, 12, 0))).toContain('phone in another room');
  });
});
