import React from 'react';
import ReactTestRenderer from 'react-test-renderer';

jest.useFakeTimers();
import { t } from '../../../core/content/strings';
import { ThresholdScreen } from '../ThresholdScreen';

beforeEach(() => {
  jest
    .spyOn(require('react-native').AccessibilityInfo, 'isReduceMotionEnabled')
    .mockResolvedValue(true);
});

const noop = () => {};
const PROPS = {
  dueCompass: 'morning' as const,
  onOpenCompass: noop,
  onOpenQuiet: noop,
  onOpenCraving: noop,
  onOpenReading: noop,
  onOpenQuizzes: noop,
  onOpenJournal: noop,
  onOpenSettings: noop,
};

describe('t() — the string catalog (NFR-X2)', () => {
  it('serves Slovak, handles region tags, and falls back to English', () => {
    expect(t('threshold.quietLine', 'sk')).toBe('Deň je na druhej strane tejto obrazovky.');
    expect(t('threshold.quietLine', 'sk-SK')).toBe('Deň je na druhej strane tejto obrazovky.');
    expect(t('threshold.quietLine', 'de')).toBe('The day is on the other side of this screen.');
    expect(t('threshold.quietLine', 'en')).toBe('The day is on the other side of this screen.');
  });
});

describe('ThresholdScreen locale (NFR-X2)', () => {
  it('renders Slovak end to end when the profile says so', async () => {
    let tree!: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(async () => {
      tree = ReactTestRenderer.create(<ThresholdScreen locale="sk" {...PROPS} />);
    });
    const json = JSON.stringify(tree.toJSON());
    expect(json).toContain('Deň je na druhej strane tejto obrazovky.');
    expect(json).toContain('ranný kompas');
    expect(json).toContain('denník');
    await ReactTestRenderer.act(async () => tree.unmount());
  });

  it('defaults to English when no locale arrives', async () => {
    let tree!: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(async () => {
      tree = ReactTestRenderer.create(<ThresholdScreen {...PROPS} />);
    });
    expect(JSON.stringify(tree.toJSON())).toContain('the morning compass');
    await ReactTestRenderer.act(async () => tree.unmount());
  });
});
