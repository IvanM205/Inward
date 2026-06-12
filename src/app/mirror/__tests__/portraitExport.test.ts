import { questionById } from '../../../core/content/questionBank';
import { Storage } from '../../../core/storage/Storage';
import {
  FakeDatabaseProvider,
  FakeKeyStore,
  FakeNotifications,
  FakeWidgets,
} from '../../../core/storage/testing/fakes';
import { saveAnswer } from '../intakeRepo';
import { exportPortrait } from '../portraitExport';
import { weeklyRecalc } from '../recalc';

async function openDb() {
  const storage = new Storage({
    databaseProvider: new FakeDatabaseProvider(),
    keyStore: new FakeKeyStore(),
    widgets: new FakeWidgets(),
    notifications: new FakeNotifications(),
  });
  return storage.open();
}

const NOW = new Date(2026, 5, 12, 19, 0);

describe('exportPortrait (MIR-04)', () => {
  it('waits kindly when the Mirror has not looked', async () => {
    const db = await openDb();
    expect(await exportPortrait(db)).toContain('has not looked yet');
  });

  it('renders bands in words, mechanisms for captured channels, level last', async () => {
    const db = await openDb();
    await saveAnswer(db, questionById('q.feeds.time.1')!, { kind: 'hours', hoursPerWeek: 20 }, NOW);
    for (let i = 1; i <= 5; i++) {
      await saveAnswer(db, questionById(`q.feeds.pull.${i}`)!, { kind: 'likert', value: 4 }, NOW);
    }
    await weeklyRecalc(db, NOW);

    const text = await exportPortrait(db);
    expect(text).toContain('caught');
    expect(text).toContain('feeds & shorts');
    expect(text).toContain('Your attention is the harvest.'); // the mechanism, named
    expect(text).toContain('free');
    expect(text).toMatch(/level \d+ — /);
    expect(text).toContain('Not a verdict — a map.');
    expect(text).not.toMatch(/!/); // 06 §Copy voice
  });
});
