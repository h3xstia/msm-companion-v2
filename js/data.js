const RAW = window.MSM;

export const monsters = RAW.monsters;
export const islands = RAW.islands;
export const wubbox = RAW.wubbox;

export const byName = new Map(monsters.map((m) => [m.name, m]));
export const islandByName = new Map(islands.map((i) => [i.name, i]));

export const RARITIES = ['Common', 'Rare', 'Epic'];
// timeline -> groups -> islands, in islands.js order
export const ISLAND_TREE = [];
for (const i of islands) {
  const tl = (i.timeline || 'Main') + ' Timeline';
  let t = ISLAND_TREE.find((x) => x.name === tl);
  if (!t) ISLAND_TREE.push(t = { name: tl, groups: [] });
  let g = t.groups.find((x) => x.name === i.group);
  if (!g) t.groups.push(g = { name: i.group, islands: [] });
  g.islands.push(i);
}
export const ZAP_ISLANDS = ['Wublin Island', 'Amber Island', 'Celestial Island'];
export const WUBBOX_TYPES = ['common', 'rare', 'epic'];

// island -> [{ m, e }]
export const onIsland = new Map(islands.map((i) => [i.name, []]));
for (const m of monsters) {
  for (const e of m.islands) onIsland.get(e.island)?.push({ m, e });
}

export const classes = [...new Set(monsters.map((m) => m.class))].sort();
export const elements = [...new Set(monsters.flatMap((m) => m.elements))].sort();

export const entryFor = (m, island) => m.islands.find((e) => e.island === island);
export const zapEntry = (m) => m.islands.find((e) => e.how === 'Zap');

// rare/epic monsters that can always be made on this island (amber, workshop) aren't "available" news there
export const alwaysObtainable = (m, island) => !!island && !!islandByName.get(island)?.alwaysRares && m.rarity !== 'Common';

export const HOW = {
  Breed: { label: 'Breed', tone: 'breed' },
  Teleport: { label: 'Teleport', tone: 'teleport' },
  Zap: { label: 'Zap', tone: 'zap' },
  Purchase: { label: 'Purchase', tone: 'buy' },
  Evolve: { label: 'Evolve', tone: 'evolve' },
  Harmonize: { label: 'Harmonize', tone: 'harmonize' },
  Synthesize: { label: 'Synthesize', tone: 'synth' },
  Fuze: { label: 'Fuze', tone: 'synth' },
  Dig: { label: 'Dipster Dig', tone: 'buy' },
};

export function howLabel(e) {
  if (e.how === 'Teleport') return islandByName.get(e.island)?.teleportName || 'Teleport';
  return HOW[e.how]?.label || e.how;
}

// extra info (cost, teleport level, evolves from)
export function entryDetails(m, e) {
  const out = [];
  if (e.cost) out.push(e.cost);
  if (e.how === 'Teleport') {
    const lvl = islandByName.get(e.island)?.teleportLevel;
    if (lvl) out.push('Level ' + lvl);
  }
  if (e.how === 'Evolve') {
    const base = m.name.replace(/^(Rare|Epic)\s+/, '');
    out.push('From ' + (m.rarity === 'Epic' ? 'Rare ' + base : base));
  }
  if (e.uses) out.push(e.uses.join(' + '));
  if (e.note) out.push(e.note);
  return out;
}

export const isWildcard = (name) => name.startsWith('Any ');

export function wildcardElement(name) {
  const m = name.match(/^Any (?:Rare )?(\w+)(?: (?:Double|Triple|Quad))?$/);
  if (!m) return null;
  const el = m[1];
  return elements.includes(el) ? el : null;
}

// does m fit a combo/egg token? exact name or wildcard
export function satisfies(token, m) {
  if (token === m.name) return true;
  if (!isWildcard(token)) return false;
  const n = m.elements.length;
  if (token === 'Any Monster') return true;
  if (token === 'Any Mythical') return m.class === 'Mythical';
  if (token === 'Any Rare Wublin') return m.rarity === 'Rare' && m.islands.some((e) => e.island === 'Wublin Island' && e.how === 'Zap');
  if (token === 'Any Single Ethereal') return m.class === 'Ethereal' && n === 1;
  if (token === 'Any Single Mythical') return m.class === 'Mythical' && n === 1;
  if (token === 'Any Triple') return n === 3 && ['Natural', 'Fire', 'Magical', 'Paironormal'].includes(m.class);
  const sized = token.match(/^Any (Rare )?(\w+) (Double|Triple|Quad)$/);
  if (sized) {
    const size = { Double: 2, Triple: 3, Quad: 4 }[sized[3]];
    if (sized[1] && m.rarity !== 'Rare') return false;
    if (n !== size) return false;
    if (sized[2] === 'Fire' && !sized[1]) return m.class === 'Fire';
    return m.elements.includes(sized[2]);
  }
  return false;
}

// monsters that fit an egg/combo token: itself if it's a name, every match if it's a wildcard
const matchCache = new Map();
export function matchesFor(token) {
  if (!matchCache.has(token)) {
    matchCache.set(token, isWildcard(token) ? monsters.filter((m) => satisfies(token, m)) : [byName.get(token)].filter(Boolean));
  }
  return matchCache.get(token);
}

export function wubboxList(island, type) {
  const box = wubbox[island] || {};
  const list = box[type] || [];
  return { list, required: box[type + 'Count'] || list.length };
}

export const wubboxKey = (island, type) => island + '|' + type;
