// availability sync from the fandom wiki
import { byName } from './data.js';
import { commit, save } from './store.js';

const API = 'https://mysingingmonsters.fandom.com/api.php?action=parse&format=json&origin=*&prop=text' +
  '&redirects=1&disablelimitreport=1&disableeditsection=1&page=';
export const WIKI_PAGE = 'https://mysingingmonsters.fandom.com/wiki/Availability';
export const WIKI_TTL = 30 * 60 * 1000;

function parsePage(html) {
  const doc = new DOMParser().parseFromString(html, 'text/html'); // inert: no scripts, no image loads
  const redirect = doc.querySelector('.redirectMsg a');
  if (redirect) return { redirect: redirect.getAttribute('title') || '' };
  const root = doc.querySelector('.mw-parser-output') || doc.body;
  const cats = [];
  let inTarget = false;
  for (let el = root.firstElementChild; el; el = el.nextElementSibling) {
    const head = /^H[234]$/.test(el.tagName) ? el : el.classList.contains('mw-heading') ? el.querySelector('h2,h3,h4') : null;
    if (head) {
      if (head.tagName === 'H2') {
        if (inTarget && cats.length) break;
        const t = head.textContent.toLowerCase();
        inTarget = t.includes('current') && t.includes('sale');
      }
      continue;
    }
    if (!inTarget) continue;
    if (!el.querySelector('tr')) {
      // portraits not in a table
      for (const img of el.querySelectorAll('img[alt$=" Portrait"]')) {
        let cat = cats.find((c) => c.name === 'Available Now');
        if (!cat) cats.push(cat = { name: 'Available Now', portraits: [] });
        const name = img.getAttribute('alt').replace(/ Portrait$/, '').trim();
        if (name && !cat.portraits.includes(name)) cat.portraits.push(name);
      }
      continue;
    }
    let columns = [];
    for (const row of el.querySelectorAll('tr')) {
      const ths = row.querySelectorAll('th');
      if (ths.length) {
        columns = [...ths].map((th) => {
          const name = th.textContent.trim();
          if (!name) return null;
          const cat = { name, portraits: [] };
          cats.push(cat);
          return cat;
        });
        continue;
      }
      const tds = row.querySelectorAll('td');
      const cells = tds.length ? [...tds] : [row];
      cells.forEach((cell, i) => {
        const cat = columns[i] || columns[0];
        if (!cat) return;
        for (const img of cell.querySelectorAll('img[alt$=" Portrait"], img[alt$=" (Vessel)"]')) {
          const alt = img.getAttribute('alt');
          const name = alt.replace(/ Portrait$| \(Vessel\)$/, '').trim();
          if (name && !cat.portraits.includes(name)) cat.portraits.push(name);
        }
      });
    }
  }
  return { cats: cats.filter((c) => c.portraits.length) };
}

async function fetchPage(page, depth = 0) {
  if (depth > 3) throw new Error('Too many redirects');
  const res = await fetch(API + encodeURIComponent(page) + '&_t=' + Date.now(), { signal: AbortSignal.timeout(20000) });
  if (!res.ok) throw new Error('Wiki returned ' + res.status);
  const d = await res.json();
  if (d.error) throw new Error(d.error.info || 'Wiki API error');
  const html = d.parse?.text?.['*'];
  if (!html) throw new Error('Empty response from the wiki');
  const result = parsePage(html);
  return result.redirect ? fetchPage(result.redirect, depth + 1) : result.cats;
}

const findMonster = (name) => byName.get(name) ||
  [...byName.values()].find((m) => m.name.toLowerCase() === name.toLowerCase());

let running = null;

export function syncFromWiki() {
  if (running) return running;
  running = (async () => {
    const cats = await fetchPage('Availability');
    if (!cats.reduce((n, c) => n + c.portraits.length, 0)) throw new Error('No available monsters found on the wiki page');
    const unknown = [];
    commit((s) => {
      const timers = {}; // keep any end dates the user set on wiki entries
      for (const k of Object.keys(s.avail)) if (s.avail[k].wiki) { timers[k] = s.avail[k].until; delete s.avail[k]; }
      for (const cat of cats) {
        const chipless = /starshop|vessel/i.test(cat.name);
        for (const name of cat.portraits) {
          const m = findMonster(name);
          if (!m) { if (!unknown.includes(name)) unknown.push(name); continue; }
          if (s.avail[m.name] && !s.avail[m.name].wiki) continue; // keep the user's own entry
          const a = s.avail[m.name] ||= { until: timers[m.name] || null, wiki: true, cats: [], chipless };
          if (!a.cats.includes(cat.name)) a.cats.push(cat.name);
          if (!chipless) a.chipless = false;
        }
      }
      s.wiki = { time: Date.now(), cats: cats.map((c) => c.name), unknown };
    });
    return cats;
  })().finally(() => { running = null; });
  return running;
}

export const wikiStale = () => !save.wiki || Date.now() - save.wiki.time > WIKI_TTL;
