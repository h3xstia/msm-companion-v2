// island plan images live in indexeddb (localStorage is only ~5mb, shared with the old site)
import { refresh, toast } from './store.js';

const DB = 'msm2', STORE = 'islandImages', OLD_PREFIX = 'msm2:img:';
const cache = new Map();
let dbp = null;

function db() {
  dbp ||= new Promise((resolve, reject) => {
    const req = indexedDB.open(DB, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return dbp;
}

async function tx(mode, fn) {
  const d = await db();
  return new Promise((resolve, reject) => {
    const t = d.transaction(STORE, mode);
    const out = fn(t.objectStore(STORE));
    t.oncomplete = () => resolve(out?.result);
    t.onerror = () => reject(t.error);
  });
}

export async function loadImages() {
  try {
    // move images saved by earlier versions out of localStorage
    const old = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k.startsWith(OLD_PREFIX)) old.push(k);
    }
    for (const k of old) {
      await tx('readwrite', (s) => s.put(localStorage.getItem(k), k.slice(OLD_PREFIX.length)));
      localStorage.removeItem(k);
    }
    const keys = await tx('readonly', (s) => s.getAllKeys());
    const vals = await tx('readonly', (s) => s.getAll());
    keys.forEach((k, i) => cache.set(k, vals[i]));
    refresh();
  } catch (e) {
    console.warn('island images unavailable', e);
  }
}

export const getIslandImage = (name) => cache.get(name) || null;
export const allIslandImages = () => Object.fromEntries(cache);

export async function setIslandImage(name, dataUrl) {
  try {
    if (dataUrl) await tx('readwrite', (s) => s.put(dataUrl, name));
    else await tx('readwrite', (s) => s.delete(name));
    if (dataUrl) cache.set(name, dataUrl); else cache.delete(name);
    refresh();
    return true;
  } catch {
    toast("Couldn't save that image", { tone: 'error' });
    return false;
  }
}
