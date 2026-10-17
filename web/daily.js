// The daily game and the player's stats, saved in this browser (localStorage).
//
// Everyone choosing the same mode gets the same team on the same calendar
// day (in their own time zone, like Wordle). Each browser gets one battle
// with RED per day, shared across all modes.

const STORAGE_KEY = 'dailyred-stats';

// One-time reopening after the team-mode release. Existing results remain in
// all-time stats; only this date gets a new daily attempt. Other days use 0.
export const dailyRevision = (date) => date === '2026-10-17' ? 1 : 0;

// A date in the player's time zone, e.g. "2026-10-11".
export function today(now = new Date()) {
  const pad = (n) => String(n).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

export function addDays(date, days) {
  const d = new Date(`${date}T12:00:00`); // midday, so DST changes can't skip a day
  d.setDate(d.getDate() + days);
  return today(d);
}

// The day's team seed: a hash (FNV-1a) of the date, never 0.
export function dailySeed(date) {
  let hash = 0x811c9dc5;
  for (const ch of `dailyred:${date}`) {
    hash ^= ch.charCodeAt(0);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash || 1;
}

export function msUntilTomorrow(now = new Date()) {
  const midnight = new Date(now);
  midnight.setHours(24, 0, 0, 0);
  return midnight - now;
}

// --- Stats ------------------------------------------------------------------
//   wins, losses     all-time
//   winStreak        daily wins in a row
//   dayStreak        days played in a row
//   lastPlayed       date of the last finished battle, lastResult 'won'/'lost'
//   pending          date of a battle that started but hasn't finished

const EMPTY = { wins: 0, losses: 0, winStreak: 0, dayStreak: 0, lastPlayed: null, lastResult: null, lastRevision: 0, pending: null, pendingRevision: 0 };

let memoryCopy = null; // used when localStorage is blocked

export function loadStats() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return { ...EMPTY, ...saved };
  } catch {
    return { ...EMPTY, ...memoryCopy };
  }
}

function save(stats) {
  memoryCopy = { ...stats };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
  } catch {
    // Storage blocked (e.g. some private modes): stats last until the page closes.
  }
}

// Today's result ('won' / 'lost'), or null if today's battle isn't done.
export function resultFor(stats, date, revision = dailyRevision(date)) {
  const recordedRevision = dailyRevision(date) === 0 ? 0 : (stats.lastRevision ?? 0);
  return stats.lastPlayed === date && recordedRevision === revision ? stats.lastResult : null;
}

// Streaks as they stand on `date`: missing a day breaks them.
export function currentStreaks(stats, date) {
  const alive = stats.lastPlayed === date || stats.lastPlayed === addDays(date, -1);
  return { winStreak: alive ? stats.winStreak : 0, dayStreak: alive ? stats.dayStreak : 0 };
}

// From the moment RED's battle starts the day counts as played, so leaving
// mid-battle counts as a loss (see settleAbandonedGame).
export function markBattleStarted(stats, date) {
  const revision = dailyRevision(date);
  if ((stats.pending === date && (stats.pendingRevision ?? 0) === revision) || resultFor(stats, date)) return;
  stats.pending = date;
  stats.pendingRevision = revision;
  save(stats);
}

export function recordResult(stats, date, won, revision = dailyRevision(date)) {
  // Older cached clients may carry unknown revision fields to the next date.
  // Revision metadata never changes the ordinary one-attempt rule on other days.
  if (dailyRevision(date) === 0) revision = 0;
  const sameDay = stats.lastPlayed === date;
  // Ignore duplicate results and an older attempt finishing after its replacement.
  if (sameDay && (dailyRevision(date) === 0 || (stats.lastRevision ?? 0) >= revision)) return;
  const consecutive = stats.lastPlayed === addDays(date, -1);
  if (!sameDay) stats.dayStreak = consecutive ? stats.dayStreak + 1 : 1;
  if (won) {
    stats.wins++;
    stats.winStreak = sameDay
      ? (stats.lastResult === 'won' ? Math.max(1, stats.winStreak) : 1)
      : (consecutive && stats.lastResult === 'won' ? stats.winStreak + 1 : 1);
  } else {
    stats.losses++;
    stats.winStreak = 0;
  }
  stats.lastPlayed = date;
  stats.lastResult = won ? 'won' : 'lost';
  stats.lastRevision = revision;
  stats.pending = null;
  stats.pendingRevision = 0;
  save(stats);
}

// A battle that started but never finished (tab closed, page reloaded) is a loss.
export function settleAbandonedGame(stats) {
  if (stats.pending) {
    // A pre-reset abandoned battle belongs to revision 0, not the reopened slot.
    recordResult(stats, stats.pending, false, stats.pendingRevision ?? 0);
    stats.pending = null;
    stats.pendingRevision = 0;
    save(stats);
  }
  return stats;
}
