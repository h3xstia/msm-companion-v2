// breeding rules (based on the msm wiki)
import { monsters, islands, satisfies } from './data.js';

const ISLAND_ELEMENTS = Object.fromEntries(islands.filter((i) => i.elements).map((i) => [i.name, i.elements]));

// these classes only breed on their home island
const SPECIAL_CLASSES = ['Ethereal', 'Mythical', 'Seasonal', 'Paironormal'];
const isHome = (m, isl) =>
  (isl === 'Ethereal Island' && m.class === 'Ethereal') ||
  (isl === 'Major Paironormal Carnival' && m.class === 'Paironormal');

const hasIsland = (m, isl) => m.islands.some((e) => e.island === isl);
const setKey = (arr) => [...arr].sort().join('|');

function elementsFit(m, isl) {
  const ie = ISLAND_ELEMENTS[isl];
  if (!ie || !m.elements.length) return false;
  if (!isHome(m, isl) && SPECIAL_CLASSES.includes(m.class)) return false;
  return m.elements.every((e) => ie.includes(e));
}

const canParent = (m, isl) => (m.rarity === 'Common' || m.rarity === 'Rare') && elementsFit(m, isl);

function isElementResult(m, isl) {
  if (m.rarity === 'Epic') return false;
  if (m.rarity === 'Rare' && m.elements.length === 1) return false;
  return elementsFit(m, isl);
}

function breedable(e) {
  if (!e.combo) return false;
  if (e.how === 'Breed') return true;
  // teleport entries with a time can be rebred there (shanty, mythical etc)
  return e.how === 'Teleport' && !!e.time;
}

function comboMatches(combo, p1, p2, isl) {
  const slot = (tok, par) => {
    if (!satisfies(tok, par)) return false;
    // any monster = anything breedable on that island
    if (tok === 'Any Monster') return par.islands.some((e) => e.island === isl && breedable(e));
    return true;
  };
  return (slot(combo[0], p1) && slot(combo[1], p2)) || (slot(combo[0], p2) && slot(combo[1], p1));
}

export function computeOffspring(p1, p2) {
  if (!p1 || !p2) return [];
  const p1key = setKey(p1.elements), p2key = setKey(p2.elements);
  const disjoint = !p2.elements.some((e) => p1.elements.includes(e));
  const unionKey = setKey(new Set([...p1.elements, ...p2.elements]));
  // natural doubles are 100%, parents can't come out
  const natSingles = disjoint && p1.elements.length === 1 && p2.elements.length === 1 &&
    p1.class === 'Natural' && p2.class === 'Natural';
  const out = [];

  for (const m of monsters) {
    const found = {};
    for (const e of m.islands) {
      if (!breedable(e) || found[e.island]) continue;
      if (!hasIsland(p1, e.island) || !hasIsland(p2, e.island)) continue;
      // combo listed in the data
      if (comboMatches(e.combo, p1, p2, e.island)) {
        // rare singles need two different triples
        if (m.rarity === 'Rare' && m.elements.length === 1 && p1.name === p2.name && /^Any \S+ Triple$/.test(e.combo[0])) continue;
        found[e.island] = e;
        continue;
      }
      // parents (and rare versions) can come out
      const mk = setKey(m.elements);
      const isParentVariant = [p1.name, p2.name].some((pn) => m.name === pn || m.name === 'Rare ' + pn || 'Rare ' + m.name === pn);
      if (!natSingles && isParentVariant && (mk === p1key || mk === p2key) && (m.rarity === 'Common' || m.rarity === 'Rare')) {
        found[e.island] = e;
        continue;
      }
      // element addition
      if (!isElementResult(m, e.island)) continue;
      if (!canParent(p1, e.island) || !canParent(p2, e.island)) continue;
      if (disjoint && mk === unionKey) found[e.island] = e;
    }
    const keys = Object.keys(found);
    if (keys.length) out.push({ m, islands: keys, entries: found });
  }
  const order = { Common: 0, Rare: 1, Epic: 2 };
  out.sort((a, b) => (order[a.m.rarity] - order[b.m.rarity]) || a.m.name.localeCompare(b.m.name));
  return out;
}

export function sharesIsland(a, b) {
  for (const isl of Object.keys(ISLAND_ELEMENTS)) {
    if (canParent(a, isl) && canParent(b, isl)) return true;
  }
  for (const m of monsters) {
    for (const e of m.islands) {
      if (breedable(e) && hasIsland(a, e.island) && hasIsland(b, e.island) && comboMatches(e.combo, a, b, e.island)) return true;
    }
  }
  return false;
}

const FIRE_EXCLUDED = new Set(['Bisonorus', 'Yelmut', 'Flum Ox', 'Krillby', 'Edamimi', 'PongPing', 'Incisaur',
  'Tiawa', 'Candelavra', 'Drummidary', 'Bowhead', 'Tuskski', 'Gnarls']);
const EXCLUDED_CLASSES = new Set(['Supernatural', 'Primordial', 'Titansoul', 'Dipster', 'Celestial']);

export const parentCandidates = monsters.filter((m) => {
  if (m.rarity !== 'Common' && m.rarity !== 'Rare') return false;
  if (EXCLUDED_CLASSES.has(m.class) || m.name === 'Mimic' || FIRE_EXCLUDED.has(m.name)) return false;
  if (m.class === 'Legendary' && m.name !== 'Shugabush') return false;
  if (m.class === 'Ethereal' && m.elements.length >= 3) return false;
  if (m.class === 'Paironormal' && m.islands.every((e) => e.island === 'Minor Paironormal Carnival')) return false;
  if (m.elements.includes('Dream') && m.elements.includes('Mythical')) return false;
  return true;
});
