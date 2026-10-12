import { html, render, useEffect, useState } from './lib.js';
import { ui, setUi, useStore, detail } from './store.js';
import { initSync, useSync } from './sync.js';
import { Icon, Toasts } from './ui.js';
import { DetailPanel, SearchPalette } from './overlays.js';
import { CollectionView } from './views/collection.js';
import { BreedView } from './views/breed.js';
import { AvailableView } from './views/available.js';
import { DatabaseView } from './views/database.js';
import { ZappingView } from './views/zapping.js';
import { WubboxView } from './views/wubbox.js';
import { IslandsView } from './views/islands.js';
import { SettingsView } from './views/settings.js';
import { cx } from './util.js';

const VIEWS = {
  collection: { label: 'Collection', icon: 'collection', View: CollectionView },
  breed: { label: 'Breed Sim', icon: 'breed', View: BreedView },
  available: { label: 'Available', icon: 'available', View: AvailableView },
  database: { label: 'Database', icon: 'database', View: DatabaseView },
  zapping: { label: 'Zapping', icon: 'zap', View: ZappingView },
  wubbox: { label: 'Wubbox', icon: 'wubbox', View: WubboxView },
  islands: { label: 'Islands', icon: 'islands', View: IslandsView },
  settings: { label: 'Settings', icon: 'settings', View: SettingsView },
};
const MAIN_NAV = ['collection', 'breed', 'available', 'database', 'zapping', 'wubbox', 'islands'];
const PHONE_NAV = ['collection', 'breed', 'zapping', 'available'];

// view goes in the hash so the back button works
const viewFromHash = () => { const v = location.hash.slice(2); return VIEWS[v] ? v : null; };
function go(view) {
  if (location.hash !== '#/' + view) location.hash = '/' + view;
  setUi({ view });
  document.querySelector('main')?.scrollTo(0, 0);
  window.scrollTo(0, 0);
}

function applyTheme(theme) {
  const t = theme === 'auto' ? (matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark') : theme;
  document.documentElement.dataset.theme = t;
}

let swWaiting = null;
const swListeners = new Set();
function registerSW() {
  if (!('serviceWorker' in navigator) || location.hostname === 'localhost' || location.hostname === '127.0.0.1') return;
  navigator.serviceWorker.register('sw.js').then((reg) => {
    const notify = (w) => { swWaiting = w; swListeners.forEach((f) => f(w)); };
    if (reg.waiting && navigator.serviceWorker.controller) notify(reg.waiting);
    reg.addEventListener('updatefound', () => {
      const w = reg.installing;
      w?.addEventListener('statechange', () => { if (w.state === 'installed' && navigator.serviceWorker.controller) notify(w); });
    });
  }).catch(() => {});
  let reloaded = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => { if (!reloaded) { reloaded = true; location.reload(); } });
}

function UpdateBanner() {
  const [w, setW] = useState(swWaiting);
  useEffect(() => { swListeners.add(setW); return () => swListeners.delete(setW); }, []);
  if (!w) return null;
  return html`<div class="update-banner"><span>A new version is ready.</span>
    <button class="btn primary sm" onClick=${() => w.postMessage('skipWaiting')}>Update</button></div>`;
}

function SyncDot() {
  const s = useSync();
  if (!s.user) return null;
  const tone = { synced: 'ok', saving: 'busy', loading: 'busy', error: 'bad', conflict: 'bad' }[s.status] || 'busy';
  return html`<span class=${'sync-dot ' + tone} title=${'Cloud sync: ' + (s.status || 'connecting')}></span>`;
}

function NavButton({ id, current, compact }) {
  const v = VIEWS[id];
  return html`<a href=${'#/' + id} class=${cx('nav-item', current === id && 'on')} aria-current=${current === id ? 'page' : undefined}
    onClick=${(e) => { e.preventDefault(); go(id); }}>
    <${Icon} name=${v.icon} size=${compact ? 22 : 18} /><span>${v.label}</span></a>`;
}

function App() {
  useStore();
  const [searching, setSearching] = useState(false);
  const [more, setMore] = useState(false);
  const view = VIEWS[ui.view] ? ui.view : 'collection';
  const { View } = VIEWS[view];

  useEffect(() => {
    const onHash = () => { const v = viewFromHash(); if (v && v !== ui.view) setUi({ view: v }); };
    addEventListener('hashchange', onHash);
    const onKey = (e) => {
      const typing = /INPUT|TEXTAREA|SELECT/.test(document.activeElement?.tagName);
      if ((e.key === 'k' && (e.ctrlKey || e.metaKey)) || (e.key === '/' && !typing)) { e.preventDefault(); setSearching(true); }
    };
    addEventListener('keydown', onKey);
    return () => { removeEventListener('hashchange', onHash); removeEventListener('keydown', onKey); };
  }, []);
  useEffect(() => {
    applyTheme(ui.theme);
    const mq = matchMedia('(prefers-color-scheme: light)');
    const f = () => applyTheme(ui.theme);
    mq.addEventListener('change', f);
    return () => mq.removeEventListener('change', f);
  }, [ui.theme]);
  useEffect(() => { document.title = VIEWS[view].label + ' · MSM Companion'; setMore(false); }, [view]);

  return html`
    <aside class="sidebar">
      <a class="brand" href="#/collection" onClick=${(e) => { e.preventDefault(); go('collection'); }}>
        <img src="images/icon-512.png" alt="My Singing Monsters Companion" /></a>
      <button class="search-trigger" onClick=${() => setSearching(true)}><${Icon} name="search" size=${16} /><span>Search</span><kbd>/</kbd></button>
      <nav class="nav">${MAIN_NAV.map((id) => html`<${NavButton} id=${id} current=${view} />`)}</nav>
      <div class="sidebar-foot"><${NavButton} id="settings" current=${view} /><${SyncDot} /></div>
    </aside>

    <header class="topbar">
      <img src="images/icon-192.png" alt="" width="28" height="28" />
      <strong>${VIEWS[view].label}</strong>
      <${SyncDot} />
      <button class="icon-btn" aria-label="Search" onClick=${() => setSearching(true)}><${Icon} name="search" /></button>
    </header>

    <main id="main" class=${'view-' + view}><${View} go=${go} /></main>

    <nav class="tabbar" aria-label="Sections">
      ${PHONE_NAV.map((id) => html`<${NavButton} id=${id} current=${view} compact />`)}
      <button class=${cx('nav-item', (more || !PHONE_NAV.includes(view)) && 'on')} onClick=${() => setMore(!more)} aria-expanded=${more}>
        <${Icon} name="more" size=${22} /><span>More</span></button>
    </nav>
    ${more && html`<div class="scrim" onClick=${() => setMore(false)}></div>
      <div class="more-sheet">${['database', 'wubbox', 'islands', 'settings'].map((id) => html`<${NavButton} id=${id} current=${view} />`)}</div>`}

    ${detail && html`<${DetailPanel} />`}
    <${SearchPalette} open=${searching} onClose=${() => setSearching(false)} go=${go} />
    <${Toasts} />
    <${UpdateBanner} />`;
}

const initial = viewFromHash();
if (initial) ui.view = initial;
applyTheme(ui.theme);
render(html`<${App} />`, document.getElementById('app'));
initSync();
registerSW();
