import assert from 'node:assert/strict';
import { test, beforeEach } from 'node:test';
import { dailyRevision, loadStats, resultFor, markBattleStarted, recordResult, settleAbandonedGame, currentStreaks, dailySeed } from '../web/daily.js';
let saved;
globalThis.localStorage = { getItem: () => saved ? JSON.stringify(saved) : null, setItem: (_, value) => { saved = JSON.parse(value); } };
const date = '2026-10-17';
const legacy = (result = 'won') => ({ wins: 7, losses: 3, winStreak: result === 'won' ? 4 : 0, dayStreak: 8, lastPlayed: date, lastResult: result, pending: null });
beforeEach(() => { saved = undefined; });

for (const result of ['won', 'lost']) test(`legacy ${result}: reopen only today without changing counters`, () => {
  saved = legacy(result);
  const stats = loadStats();
  assert.equal(resultFor(stats, date), null);
  for (const key of ['wins', 'losses', 'winStreak', 'dayStreak', 'lastPlayed', 'lastResult']) assert.equal(stats[key], saved[key]);
  assert.deepEqual(currentStreaks(stats, date), { winStreak: saved.winStreak, dayStreak: 8 });
});

test('new attempt relocks across reload, counts once and does not add a streak day', () => {
  saved = legacy();
  const stats = loadStats();
  markBattleStarted(stats, date);
  assert.equal(saved.pendingRevision, 1);
  recordResult(stats, date, true);
  assert.equal(resultFor(loadStats(), date), 'won');
  assert.deepEqual([saved.wins, saved.losses, saved.winStreak, saved.dayStreak], [8, 3, 4, 8]);
  recordResult(stats, date, true);
  assert.equal(saved.wins, 8);
});

test('new loss counts without dropping past wins or adding a streak day', () => {
  saved = legacy();
  const stats = loadStats();
  recordResult(stats, date, false);
  assert.deepEqual([saved.wins, saved.losses, saved.winStreak, saved.dayStreak], [7, 4, 0, 8]);
  assert.equal(resultFor(loadStats(), date), 'lost');
});

test('a win after the earlier loss starts a one-day win streak', () => {
  saved = legacy('lost');
  recordResult(loadStats(), date, true);
  assert.deepEqual([saved.wins, saved.losses, saved.winStreak, saved.dayStreak], [8, 3, 1, 8]);
});

test('legacy abandoned battle settles against old slot and leaves reopened attempt free', () => {
  saved = { ...legacy(), lastPlayed: '2026-10-16', pending: date };
  const stats = settleAbandonedGame(loadStats());
  assert.equal(stats.losses, 4);
  assert.equal(stats.lastRevision, 0);
  assert.equal(resultFor(stats, date), null);
  assert.equal(stats.pending, null);
});

test('abandoning the reopened attempt consumes it exactly once', () => {
  saved = legacy();
  markBattleStarted(loadStats(), date);
  const stats = settleAbandonedGame(loadStats());
  assert.equal(stats.losses, 4);
  assert.equal(resultFor(stats, date), 'lost');
  settleAbandonedGame(loadStats());
  assert.equal(saved.losses, 4);
});

test('a stale old result cannot overwrite the completed replacement', () => {
  saved = legacy();
  const stats = loadStats(); recordResult(stats, date, true);
  const snapshot = JSON.stringify(saved);
  recordResult(stats, date, false, 0);
  assert.equal(JSON.stringify(saved), snapshot);
});

test('new visitors have one attempt and other dates retain the ordinary lock', () => {
  const stats = loadStats(); recordResult(stats, date, true);
  assert.equal(stats.wins, 1);
  assert.equal(resultFor(stats, date), 'won');
  assert.equal(resultFor({ ...legacy(), lastPlayed: '2026-10-18' }, '2026-10-18'), 'won');
  assert.equal(dailyRevision('2026-10-16'), 0);
  assert.equal(dailyRevision('2026-10-18'), 0);
});

test('the following day keeps normal streak progression and one attempt', () => {
  saved = legacy(); const stats = loadStats();
  recordResult(stats, date, true);
  recordResult(stats, '2026-10-18', true);
  assert.deepEqual([saved.wins, saved.dayStreak, saved.winStreak, saved.lastRevision], [9, 9, 5, 0]);
  recordResult(stats, '2026-10-18', false);
  assert.equal(saved.losses, 3);
});

test('reset does not change the deterministic daily team seed', () => {
  assert.equal(dailySeed(date), 4176325482);
});

test('an older cached client carrying the revision to tomorrow cannot unlock extra attempts', () => {
  saved = { ...legacy(), lastPlayed: '2026-10-18', lastRevision: 1 };
  const stats = loadStats();
  assert.equal(resultFor(stats, '2026-10-18'), 'won');
  recordResult(stats, '2026-10-18', true);
  assert.equal(saved.wins, 7);
});

test('stale pending metadata on another day settles using the ordinary lock', () => {
  saved = { ...legacy(), lastRevision: 1, pending: '2026-10-18', pendingRevision: 1 };
  const stats = settleAbandonedGame(loadStats());
  assert.equal(stats.lastRevision, 0);
  assert.equal(resultFor(stats, '2026-10-18'), 'lost');
  assert.equal(stats.losses, 4);
});
