'use strict';
/* Game rules. Everything here is DERIVED from nodes + journal entries: nothing is hand-awarded. */

const CATEGORIES = ['Body', 'Mind', 'Creativity', 'Adventure', 'Social', 'Career', 'Life Admin'];
const STATS = ['Body', 'Mind', 'Creativity', 'Adventure', 'Social', 'Career'];
const TYPES = {
  skill:      { label: 'Skill',      hint: 'Something you get better at over time (levels 1–5).' },
  experience: { label: 'Experience', hint: 'A one-off bucket-list moment.' },
  knowledge:  { label: 'Knowledge',  hint: 'Something you learn or come to understand.' }
};
const STATUS_LABEL = { locked: 'Locked', available: 'Available', unlocked: 'Unlocked', mastered: 'Mastered' };

/* Skill levels: cumulative linked entries needed for Level 1..5. */
const SKILL_THRESHOLDS = [1, 3, 6, 10, 15];
/* Stat points per event. */
const POINTS = { unlock: 3, skillLevel: 2 };
/* Which stat(s) each category feeds. Life Admin splits between Mind and Career. */
const CATEGORY_TO_STAT = {
  Body: { Body: 1 }, Mind: { Mind: 1 }, Creativity: { Creativity: 1 }, Adventure: { Adventure: 1 },
  Social: { Social: 1 }, Career: { Career: 1 }, 'Life Admin': { Mind: 0.5, Career: 0.5 }
};
const TITLE_TIERS = [3, 12, 30];
const TITLES = {
  Body: ['Trainee', 'Athlete', 'Champion'],
  Mind: ['Student', 'Scholar', 'Sage'],
  Creativity: ['Tinkerer', 'Maker', 'Virtuoso'],
  Adventure: ['Explorer', 'Adventurer', 'Wayfinder'],
  Social: ['Companion', 'Bard', 'Heart of the Party'],
  Career: ['Apprentice', 'Strategist', 'Guildmaster']
};
const MOODS = ['Rough', 'Low', 'Okay', 'Good', 'Great'];

/* Character level: total unlocks needed to reach level n is (n-1)(n+2)/2 → 0, 2, 5, 9, 14, 20… */
const levelThreshold = (n) => ((n - 1) * (n + 2)) / 2;
function charLevel(total) {
  let n = 1;
  while (total >= levelThreshold(n + 1)) n++;
  return { level: n, cur: levelThreshold(n), next: levelThreshold(n + 1) };
}

function sortEntriesAsc(a, b) {
  if (a.date !== b.date) return a.date < b.date ? -1 : 1;
  return (a.createdAt || 0) - (b.createdAt || 0);
}
const evKey = (ev) => ev.nodeId + ':' + ev.level;

/* Core derivation. Given entries + nodes, returns per-node progress, unlock events, stats and level. */
function derive(entries, nodes) {
  const byNode = new Map(nodes.map((n) => [n.id, []]));
  const sorted = [...entries].sort(sortEntriesAsc);
  for (const e of sorted) for (const id of e.nodeIds || []) if (byNode.has(id)) byNode.get(id).push(e);

  const info = new Map();
  const events = [];
  for (const n of nodes) {
    const list = byNode.get(n.id);
    let level = 0, unlockedAt = null;
    if (n.type === 'skill') {
      SKILL_THRESHOLDS.forEach((t, i) => {
        if (list.length >= t) {
          const e = list[t - 1];
          level = i + 1;
          if (i === 0) unlockedAt = e.date;
          events.push({ nodeId: n.id, kind: i === 0 ? 'unlock' : 'level', level: i + 1, date: e.date, ts: e.createdAt || 0, entryId: e.id });
        }
      });
    } else if (list.length) {
      unlockedAt = list[0].date;
      events.push({ nodeId: n.id, kind: 'unlock', level: 1, date: list[0].date, ts: list[0].createdAt || 0, entryId: list[0].id });
    }
    info.set(n.id, {
      count: list.length, level, unlocked: !!unlockedAt, unlockedAt, entries: list,
      prevAt: n.type === 'skill' && level > 0 ? SKILL_THRESHOLDS[level - 1] : 0,
      nextAt: n.type === 'skill' && level < 5 ? SKILL_THRESHOLDS[level] : null
    });
  }

  const nodeMap = new Map(nodes.map((n) => [n.id, n]));
  const stats = Object.fromEntries(STATS.map((s) => [s, 0]));
  for (const ev of events) {
    const n = nodeMap.get(ev.nodeId);
    const pts = n.type === 'skill' ? POINTS.skillLevel : POINTS.unlock;
    const map = CATEGORY_TO_STAT[n.category] || {};
    for (const k in map) stats[k] += pts * map[k];
  }
  return { info, events, stats, total: events.length, level: charLevel(events.length) };
}

function strongestStat(stats) {
  let best = null;
  for (const s of STATS) if (stats[s] > 0 && (!best || stats[s] > stats[best])) best = s;
  return best;
}
function titleFor(stats) {
  const s = strongestStat(stats);
  if (!s) return { title: 'Wanderer', stat: null };
  let tier = -1;
  TITLE_TIERS.forEach((t, i) => { if (stats[s] >= t) tier = i; });
  if (tier < 0) return { title: 'Wanderer', stat: s };
  return { title: TITLES[s][tier], stat: s };
}
function earnedTitles(stats) {
  const out = [];
  for (const s of STATS) TITLES[s].forEach((t, i) => out.push({ stat: s, title: t, need: TITLE_TIERS[i], earned: stats[s] >= TITLE_TIERS[i] }));
  return out;
}

/* Layered auto-layout for a tree: depth = longest prerequisite chain. */
function layoutTree(nodes) {
  const ids = new Set(nodes.map((n) => n.id));
  const map = new Map(nodes.map((n) => [n.id, n]));
  const depth = new Map(), visiting = new Set();
  const dep = (n) => {
    if (depth.has(n.id)) return depth.get(n.id);
    if (visiting.has(n.id)) return 0;
    visiting.add(n.id);
    const ps = (n.prereqs || []).filter((p) => ids.has(p)).map((p) => dep(map.get(p)));
    const d = ps.length ? Math.max(...ps) + 1 : 0;
    visiting.delete(n.id);
    depth.set(n.id, d);
    return d;
  };
  nodes.forEach(dep);
  const rows = [];
  nodes.forEach((n) => { const d = depth.get(n.id); (rows[d] = rows[d] || []).push(n); });

  const X = 116, Y = 136, PAD = 64;
  const maxCols = Math.max(1, ...rows.map((r) => (r ? r.length : 0)));
  const width = Math.max(maxCols * X + PAD, 320);
  const pos = new Map();

  // Roots: keep chains together by ordering roots by first-created child, then creation time.
  rows.forEach((row, ri) => {
    if (!row) return;
    if (ri > 0) {
      const bc = new Map(row.map((n) => {
        const ps = (n.prereqs || []).filter((p) => pos.has(p));
        return [n.id, ps.length ? ps.reduce((a, p) => a + pos.get(p).x, 0) / ps.length : 1e9];
      }));
      row.sort((a, b) => bc.get(a.id) - bc.get(b.id) || (a.createdAt || 0) - (b.createdAt || 0));
    }
    row.forEach((n, i) => {
      pos.set(n.id, { x: width / 2 + (i - (row.length - 1) / 2) * X, y: 70 + ri * Y });
    });
  });
  return { pos, width, height: rows.length * Y + 70, depth };
}

/* Nodes that depend on `id` (directly or indirectly) – used to prevent prerequisite cycles. */
function descendantsOf(id, nodes) {
  const out = new Set();
  let frontier = [id];
  while (frontier.length) {
    const next = [];
    for (const n of nodes) if ((n.prereqs || []).some((p) => frontier.includes(p)) && !out.has(n.id)) { out.add(n.id); next.push(n.id); }
    frontier = next;
  }
  return out;
}

/* Dates (local, ISO yyyy-mm-dd) */
function todayISO() {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 10);
}
const asDate = (iso) => new Date(iso + 'T00:00:00');
const fmtDate = (iso, opts = { day: 'numeric', month: 'short', year: 'numeric' }) => asDate(iso).toLocaleDateString(undefined, opts);
const fmtMonth = (ym) => new Date(ym + '-01T00:00:00').toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
function lastDayOfMonth(ym) {
  const [y, m] = ym.split('-').map(Number);
  return ym + '-' + String(new Date(y, m, 0).getDate()).padStart(2, '0');
}
