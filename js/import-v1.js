// import progress from the old site (msm-companion v1)
import { html, useEffect, useState } from './lib.js';
import { byName } from './data.js';
import { commit, zapEggs } from './store.js';
import { setIslandImage } from './views/islands.js';
import { plural } from './util.js';
import { Dialog } from './ui.js';

const V1_KEY = 'msm4';
const V1_IMG = 'msm4_img_';

const lower = new Map([...byName.keys()].map((n) => [n.toLowerCase(), n]));

// v1 keys looked like "Potbelly (Common)", "Hornacle (Young)", "Adult Hornacle (Adult)"
function monsterName(key) {
  if (!key) return null;
  const base = key.replace(/\s*\((Common|Rare|Epic|Young|Adult|Legendary)\)\s*$/i, '').trim();
  return byName.has(base) ? base : lower.get(base.toLowerCase()) || null;
}

const SIZE = { 2: 'Double', 3: 'Triple', 4: 'Quad' };
function eggName(key) {
  const flex = key.match(/^Rare Flex \((\w+)\)\((\d)\)$/i);
  if (flex) return `Any Rare ${flex[1]} ${SIZE[flex[2]]}`;
  if (/^Mythical Flex$/i.test(key)) return 'Any Mythical';
  if (/^Any 10 of the 19 Rare Wublins$/i.test(key)) return 'Any Rare Wublin';
  return monsterName(key) || key;
}

export const looksLikeV1 = (d) => !!d && typeof d === 'object' && typeof d.owned === 'object' &&
  ('zapTracked' in d || 'wubboxBoxed' in d || 'islandSkins' in d);

export function localV1() {
  try {
    const raw = localStorage.getItem(V1_KEY);
    const d = raw && JSON.parse(raw);
    if (!looksLikeV1(d)) return null;
    const images = {};
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k.startsWith(V1_IMG)) images[k.slice(V1_IMG.length)] = localStorage.getItem(k);
    }
    return { data: d, images };
  } catch { return null; }
}

function convert(v1) {
  const skipped = new Set();
  const out = { owned: {}, zaps: [], boxed: {}, skins: {}, avail: {} };
  let ownedN = 0;

  for (const [island, row] of Object.entries(v1.owned || {})) {
    for (const [key, on] of Object.entries(row || {})) {
      if (!on) continue;
      const name = monsterName(key);
      if (!name || !byName.get(name).islands.some((e) => e.island === island)) { skipped.add(key); continue; }
      (out.owned[island] ||= {})[name] = 1;
      ownedN++;
    }
  }

  const order = v1.zapOrder || [];
  const entries = Object.entries(v1.zapTracked || {})
    .sort(([a], [b]) => ((order.indexOf(a) + 1) || 1e9) - ((order.indexOf(b) + 1) || 1e9));
  for (const [id, z] of entries) {
    const monster = monsterName(z.monster_name);
    const zap = monster && { id: 'v1-' + id, monster, island: z.island, deadline: z.deadline ? Date.parse(z.deadline) : null, sent: {}, bred: {} };
    const eggs = zap && zapEggs(zap);
    if (!eggs?.length) { skipped.add(z.monster_name + ' (zap tracker)'); continue; }
    const valid = new Set(eggs.map(([e]) => e));
    for (const field of ['sent', 'bred']) {
      for (const [k, n] of Object.entries(z[field] || {})) {
        const egg = eggName(k);
        if (valid.has(egg) && n > 0) zap[field][egg] = (zap[field][egg] || 0) + n;
      }
    }
    out.zaps.push(zap);
  }

  let boxedN = 0;
  for (const [key, row] of Object.entries(v1.wubboxBoxed || {})) {
    const [island, type] = key.split('__');
    if (!island || !type) continue;
    for (const [name, on] of Object.entries(row || {})) {
      if (!on) continue;
      (out.boxed[island + '|' + type] ||= {})[name] = 1;
      boxedN++;
    }
  }

  for (const [island, on] of Object.entries(v1.islandSkins || {})) if (on) out.skins[island] = true;

  // only hand-added availability that hasn't run out; wiki entries come back on the next sync
  for (const [key, a] of Object.entries(v1.avail || {})) {
    if (!a || a.wiki || (a.until && a.until <= Date.now())) continue;
    const name = monsterName(key);
    if (name) out.avail[name] = { until: a.until || null, wiki: false, cats: [] };
  }

  return { out, report: { owned: ownedN, zaps: out.zaps.length, boxed: boxedN, skipped: [...skipped] } };
}

const listeners = new Set();

// merges into the current save (nothing gets removed) and can be undone
export function importV1(v1, images = {}) {
  const { out, report } = convert(v1);
  commit((s) => {
    for (const [isl, row] of Object.entries(out.owned)) Object.assign((s.owned[isl] ||= {}), row);
    for (const [k, row] of Object.entries(out.boxed)) Object.assign((s.boxed[k] ||= {}), row);
    Object.assign(s.skins, out.skins);
    for (const [n, a] of Object.entries(out.avail)) if (!s.avail[n]) s.avail[n] = a;
    for (const z of out.zaps) {
      const i = s.zaps.findIndex((x) => x.id === z.id || (x.monster === z.monster && x.island === z.island));
      if (i === -1) s.zaps.push(z); else s.zaps[i] = z;
    }
  }, { undoable: 'Imported progress from the old site' });
  let imgs = 0;
  for (const [isl, data] of Object.entries(images || {})) if (data && setIslandImage(isl, data)) imgs++;
  report.images = imgs;
  listeners.forEach((f) => f(report));
  return report;
}

export function ImportReport() {
  const [r, setR] = useState(null);
  useEffect(() => { listeners.add(setR); return () => listeners.delete(setR); }, []);
  if (!r) return null;
  return html`<${Dialog} open=${!!r} onClose=${() => setR(null)} title="Import finished"
    footer=${html`<button class="btn primary" onClick=${() => setR(null)}>Done</button>`}>
    <p>${`Brought over ${plural(r.owned, 'owned monster')}, ${plural(r.zaps, 'zap tracker')}, ${plural(r.boxed, 'boxed Wubbox monster')}${r.images ? ` and ${plural(r.images, 'island image')}` : ''}.`}</p>
    ${r.skipped.length > 0 && html`<p class="muted small">${`Skipped ${plural(r.skipped.length, 'entry', 'entries')} that couldn't be matched in the new database: ${r.skipped.slice(0, 30).join(', ')}${r.skipped.length > 30 ? ', ...' : ''}`}</p>`}
    <p class="muted small">Changed your mind? Use Undo on the message at the bottom of the screen.</p>
  <//>`;
}
