// suggests what to breed on an island. ignores breed time and offspring odds:
// a pair scores the total value of everything it could produce
import { alwaysObtainable, WUBBOX_TYPES } from './data.js';
import { save, isOwned, availableOn, zapNeedsFor, wubboxProgress } from './store.js';
import { computeOffspring, parentCandidates } from './breeding.js';
import { urgency } from './util.js';

const NEED = { zap: 12, newHere: 10, wubStarted: 8, wubProgress: 8, wubUnstarted: 2 };
const ZAP_URGENT = 2; // deadline within 2 days
const AVAIL_BOOST = { Common: 1.5, Rare: 4, Epic: 6 }; // high enough to beat a pair of three plain commons
const LAST_DAYS_BOOST = 1.5; // leaving within 2 days
const EXTRA_NEED = 0.25; // one egg can only go to one place, so other needs barely add
const TOP = 10;

// rares, epics and seasonals only hatch while they're available
function canHatch(m, island) {
  if (m.rarity === 'Common' && m.class !== 'Seasonal') return true;
  return availableOn(m, island) || alwaysObtainable(m, island);
}

function wubboxNeed(m, island) {
  let best = null;
  for (const type of WUBBOX_TYPES) {
    const { list, required, boxed, n } = wubboxProgress(island, type);
    if (!list.includes(m.name) || boxed[m.name] || n >= required) continue;
    const value = n ? NEED.wubStarted + NEED.wubProgress * n / required : NEED.wubUnstarted;
    if (!best || value > best.value) best = { kind: 'wub', value, label: n ? `Wubbox ${n}/${required}` : 'Wubbox', title: `${type} Wubbox on ${island}` };
  }
  return best;
}

function needsOf(m, island) {
  const needs = [];
  if (!isOwned(island, m.name)) needs.push({ kind: 'new', value: NEED.newHere, label: 'New', title: `Not owned on ${island}` });
  const wub = wubboxNeed(m, island);
  if (wub) needs.push(wub);
  for (const { zap, still, via } of zapNeedsFor(m.name)) {
    const u = urgency(zap.deadline);
    if (u === 'expired') continue;
    needs.push({ kind: 'zap', value: NEED.zap * (u === 'urgent' ? ZAP_URGENT : 1), label: `${zap.monster} ×${still}`,
      title: `Zap on ${zap.island}${via ? ` (as ${via})` : ''}` });
  }
  return needs.sort((a, b) => b.value - a.value);
}

function scoreOutcome(m, island) {
  const needs = needsOf(m, island);
  const limited = availableOn(m, island);
  if (!needs.length) return { m, needs, limited, value: 0 };
  const base = needs.reduce((n, x, i) => n + x.value * (i ? EXTRA_NEED : 1), 0);
  const leaving = limited && urgency(save.avail[m.name].until) === 'urgent';
  return { m, needs, limited, value: base * (limited ? AVAIL_BOOST[m.rarity] : 1) * (leaving ? LAST_DAYS_BOOST : 1) };
}

// offspring never change, so only work each pair out once
const offspringCache = new Map();
function offspringOf(p1, p2, island) {
  const key = `${island}|${p1.name}|${p2.name}`;
  if (!offspringCache.has(key)) offspringCache.set(key, computeOffspring(p1, p2, island).map((o) => o.m));
  return offspringCache.get(key);
}

export const planParents = (island) => parentCandidates.filter((m) => isOwned(island, m.name));

// best pairs first. pairs that would give the same useful monsters are folded into one, counted in `others`
export function suggestPairs(island) {
  const parents = planParents(island);
  const pairs = [];
  for (let i = 0; i < parents.length; i++) {
    for (let j = i + 1; j < parents.length; j++) {
      const outcomes = offspringOf(parents[i], parents[j], island).filter((m) => canHatch(m, island)).map((m) => scoreOutcome(m, island));
      const useful = outcomes.filter((o) => o.value > 0).sort((a, b) => b.value - a.value);
      if (!useful.length) continue;
      pairs.push({ p1: parents[i], p2: parents[j], useful, total: outcomes.length, others: 0,
        score: useful.reduce((n, o) => n + o.value, 0) });
    }
  }
  pairs.sort((a, b) => b.score - a.score || b.useful.length / b.total - a.useful.length / a.total);
  const seen = new Map();
  for (const p of pairs) {
    const key = p.useful.map((o) => o.m.name).sort().join('|');
    if (seen.has(key)) seen.get(key).others++;
    else seen.set(key, p);
  }
  return [...seen.values()].slice(0, TOP);
}
