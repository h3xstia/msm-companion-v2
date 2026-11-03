// breeding rules (based on the msm wiki)
import { monsters, islands, onIsland, satisfies, notParents } from './data.js';

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

export function breedable(e) {
  if (!e.combo) return false;
  if (e.how === 'Breed') return true;
  // teleport entries with a time can be rebred there (shanty, mythical etc)
  return e.how === 'Teleport' && !!e.time;
}

// island -> listed combos that can be bred there
const combosOn = new Map();
for (const m of monsters) {
  for (const e of m.islands) {
    if (!breedable(e)) continue;
    if (!combosOn.has(e.island)) combosOn.set(e.island, []);
    combosOn.get(e.island).push(e.combo);
  }
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

// a monster and its rare version count as one species
const species = (m) => m.name.replace(/^Rare /, '');

// island = only check that island (much faster when going through every pair)
export function computeOffspring(p1, p2, island) {
  if (!p1 || !p2 || p1 === p2) return [];
  const sameSpecies = species(p1) === species(p2);
  const disjoint = !p2.elements.some((e) => p1.elements.includes(e));
  const unionKey = setKey(new Set([...p1.elements, ...p2.elements]));
  // natural doubles are 100%, parents can't come out
  const natSingles = disjoint && p1.elements.length === 1 && p2.elements.length === 1 &&
    p1.class === 'Natural' && p2.class === 'Natural';
  const out = [];

  for (const m of island ? onIsland.get(island).map((x) => x.m) : monsters) {
    const found = {};
    const isParent = species(m) === species(p1) || species(m) === species(p2);
    // only ever from two different triples, never as a failed attempt
    const rareSingle = m.rarity === 'Rare' && m.elements.length === 1;
    for (const e of m.islands) {
      if (!breedable(e) || found[e.island] || (island && e.island !== island)) continue;
      if (!hasIsland(p1, e.island) || !hasIsland(p2, e.island)) continue;
      // a monster + its rare version only gives that monster
      if (sameSpecies) {
        if (isParent && !rareSingle) found[e.island] = e;
      } else if (comboMatches(e.combo, p1, p2, e.island)) {
        found[e.island] = e;
      } else if (isParent) {
        // the parents (or their rare versions) can come out as a failed attempt
        if (!natSingles && !rareSingle) found[e.island] = e;
      } else if (disjoint && m.rarity !== 'Epic' && setKey(m.elements) === unionKey && elementsFit(m, e.island) &&
        canParent(p1, e.island) && canParent(p2, e.island)) {
        found[e.island] = e;
      }
    }
    const keys = Object.keys(found);
    if (keys.length) out.push({ m, islands: keys, entries: found });
  }
  const order = { Common: 0, Rare: 1, Epic: 2 };
  out.sort((a, b) => (order[a.m.rarity] - order[b.m.rarity]) || a.m.name.localeCompare(b.m.name));
  return out;
}

export function sharesIsland(a, b) {
  if (a === b) return false;
  for (const isl of Object.keys(ISLAND_ELEMENTS)) {
    if (canParent(a, isl) && canParent(b, isl)) return true;
  }
  for (const { island } of a.islands) {
    if (!hasIsland(b, island)) continue;
    if ((combosOn.get(island) || []).some((combo) => comboMatches(combo, a, b, island))) return true;
  }
  return false;
}

export const parentCandidates = monsters.filter((m) => {
  if (m.rarity !== 'Common' && m.rarity !== 'Rare') return false;
  if (notParents.classes.includes(m.class) || notParents.names.includes(m.name)) return false;
  if (m.class === 'Legendary' && m.name !== 'Shugabush') return false;
  if (m.class === 'Ethereal' && m.elements.length >= 3) return false;
  if (m.class === 'Paironormal' && m.islands.every((e) => e.island === 'Minor Paironormal Carnival')) return false;
  if (m.elements.includes('Dream') && m.elements.includes('Mythical')) return false;
  return true;
});
