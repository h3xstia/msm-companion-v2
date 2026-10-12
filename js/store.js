import { useEffect, useState } from './lib.js';
import { byName, wubbox, wubboxList, wubboxKey, WUBBOX_TYPES } from './data.js';

const SAVE_KEY = 'msm2:save';
const UI_KEY = 'msm2:ui';

//   owned     { [island]: { [monster]: 1 } }
//   zaps      [{ id, monster, island, deadline, sent: {egg: n}, bred: {egg: n} }]  (array = display order)
//   boxed     { ["island|type"]: { [monster]: 1 } }
//   avail     { [monster]: { until, wiki, cats: [], chipless } }
//   wiki      { time, cats: [], unknown: [] }   last wiki sync
//   skins     { [island]: true }               islands with a breeding-speed skin
export function emptySave() {
  return { v: 2, owned: {}, zaps: [], boxed: {}, avail: {}, wiki: null, skins: {}, updatedAt: 0 };
}

const UI_DEFAULT = {
  view: 'collection',
  theme: 'auto',
  col: { island: 'Plant Island', rarity: '', hideOwned: false, q: '' },
  breed: { p1: '', p2: '', island: '' },
  db: { q: '', rarity: '', cls: '', elem: '', island: '', status: [] },
  wub: { island: 'Plant Island', type: 'common' },
  isl: { island: '' },
  zap: { collapsed: {} },
};

function read(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (raw) return { ...fallback, ...JSON.parse(raw) };
  } catch { /* ignore */ }
  return structuredClone(fallback);
}

export let save = read(SAVE_KEY, emptySave());
export let ui = read(UI_KEY, UI_DEFAULT);
for (const k of Object.keys(UI_DEFAULT)) {
  if (typeof UI_DEFAULT[k] === 'object') ui[k] = { ...UI_DEFAULT[k], ...ui[k] };
}

let version = 0;
const listeners = new Set();
const changeHooks = new Set();
function notify() { version++; derived = null; listeners.forEach((fn) => fn(version)); }

export let storageFull = false;
function persist() {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(save));
    storageFull = false;
    return true;
  } catch {
    if (!storageFull) toast("Couldn't save your progress on this device: browser storage is full. See Settings to free up space.", { tone: 'error', ms: 15000 });
    storageFull = true;
    return false;
  }
}
export const saveNow = () => persist();
export const refresh = () => notify();
function persistUi() {
  try { localStorage.setItem(UI_KEY, JSON.stringify(ui)); } catch { /* quota */ }
}

export function useStore() {
  const [, setV] = useState(version);
  useEffect(() => { listeners.add(setV); return () => listeners.delete(setV); }, []);
  return version;
}

// used by sync
export const onSaveChange = (fn) => changeHooks.add(fn);

let undoSnap = null;
export function undo() {
  if (!undoSnap) return;
  save = undoSnap; undoSnap = null;
  save.updatedAt = Date.now();
  persist(); notify(); changeHooks.forEach((fn) => fn(save));
}

// fn mutates the save. pass { undoable: 'text' } for an undo toast
// opts.local = device-only change (wiki availability): saved here but doesn't count as progress for sync
export function commit(fn, opts = {}) {
  if (opts.undoable) undoSnap = structuredClone(save);
  fn(save);
  if (!opts.local) save.updatedAt = Date.now();
  persist(); notify();
  if (!opts.local) changeHooks.forEach((fn) => fn(save));
  if (opts.undoable) toast(opts.undoable, { action: 'Undo', onAction: undo });
}

// keepLocal: keep this device's availability (used when loading from the cloud)
export function replaceSave(next, keepLocal = false) {
  save = { ...emptySave(), ...next, ...(keepLocal ? { avail: save.avail, wiki: save.wiki } : {}) };
  persist(); notify();
}

// another tab saved: pick up its version instead of overwriting it later
addEventListener('storage', (e) => {
  if (e.key !== SAVE_KEY || !e.newValue) return;
  try { save = { ...emptySave(), ...JSON.parse(e.newValue) }; notify(); } catch { /* ignore */ }
});

export const hasProgress = (s) => Object.values(s.owned || {}).some((r) => Object.keys(r).length) ||
  (s.zaps || []).length > 0 || Object.values(s.boxed || {}).some((r) => Object.keys(r).length) ||
  Object.values(s.skins || {}).some(Boolean);

// setUi('col', { island }) or setUi({ view })
export function setUi(section, patch) {
  if (typeof section === 'string') ui[section] = { ...ui[section], ...patch };
  else Object.assign(ui, section);
  persistUi(); notify();
}

export let toasts = [];
let toastId = 0;
export function toast(text, { action, onAction, tone, ms = 5000 } = {}) {
  const id = ++toastId;
  toasts = [...toasts, { id, text, action, onAction, tone }];
  notify();
  setTimeout(() => dismissToast(id), ms);
}
export function dismissToast(id) {
  toasts = toasts.filter((t) => t.id !== id);
  notify();
}

export let detail = null; // { name, island }
export function openDetail(name, island) { detail = { name, island }; notify(); }
export function closeDetail() { detail = null; notify(); }

export const isOwned = (island, name) => !!save.owned[island]?.[name];

export function setOwned(island, name, value) {
  commit((s) => {
    const row = (s.owned[island] ||= {});
    if (value) row[name] = 1; else delete row[name];
  });
}

export function isAvailable(name) {
  const a = save.avail[name];
  if (!a || a.chipless) return false;
  return !a.until || a.until > Date.now();
}

export function zapTotals(z) {
  let need = 0, sent = 0, bred = 0;
  for (const [egg, n] of zapEggs(z)) {
    need += n;
    const s = Math.min(z.sent[egg] || 0, n);
    sent += s;
    bred += Math.min(z.bred[egg] || 0, n - s);
  }
  return { need, sent, bred, have: sent + bred };
}

export function zapEggs(z) {
  const e = byName.get(z.monster)?.islands.find((x) => x.island === z.island && x.how === 'Zap');
  return e?.eggs || [];
}

let derived = null;
function getDerived() {
  if (derived) return derived;
  // egg name -> trackers that still need it
  const zapNeeds = new Map();
  for (const z of save.zaps) {
    for (const [egg, n] of zapEggs(z)) {
      const still = n - (z.sent[egg] || 0) - (z.bred[egg] || 0);
      if (still <= 0) continue;
      if (!zapNeeds.has(egg)) zapNeeds.set(egg, []);
      zapNeeds.get(egg).push({ zap: z, still });
    }
  }
  // only counts wubboxes that have been started
  const wubNeeds = new Map();
  for (const island of Object.keys(wubbox)) {
    for (const type of WUBBOX_TYPES) {
      const { list, required } = wubboxList(island, type);
      const boxed = save.boxed[wubboxKey(island, type)] || {};
      const n = list.filter((x) => boxed[x]).length;
      if (!n || n >= required) continue;
      for (const name of list) {
        if (boxed[name]) continue;
        if (!wubNeeds.has(name)) wubNeeds.set(name, []);
        wubNeeds.get(name).push({ island, type });
      }
    }
  }
  derived = { zapNeeds, wubNeeds };
  return derived;
}

export const zapNeedsFor = (name) => getDerived().zapNeeds.get(name) || [];
export const wubNeedsFor = (name) => getDerived().wubNeeds.get(name) || [];

export function missingIslands(m) {
  return m.islands.filter((e) => !isOwned(e.island, m.name)).map((e) => e.island);
}

export function purgeExpired() {
  const now = Date.now();
  const dead = Object.keys(save.avail).filter((k) => save.avail[k].until && save.avail[k].until <= now);
  if (dead.length) commit((s) => dead.forEach((k) => delete s.avail[k]), { local: true });
}
