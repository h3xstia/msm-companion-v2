import { html, useState } from '../lib.js';
import { monsters, classes, elements, islands, RARITIES, HOW, entryFor } from '../data.js';
import { cx, matches } from '../util.js';
import { ui, setUi, isOwned, isAvailable, zapNeedsFor, wubNeedsFor, missingIslands, openDetail } from '../store.js';
import { EntryRow } from '../overlays.js';
import { Icon, MonImg, ElemIcons, Rarity, StatusTags, Chip, SearchBox, Empty } from '../ui.js';

const STATUSES = [
  ['avail', 'Available now'],
  ['needed', 'Not owned'],
  ['zap', 'Needed for zapping'],
  ['wub', 'Needed for Wubbox'],
];
const PAGE = 80;

function statusOk(m, s, island) {
  if (s === 'avail') return isAvailable(m.name);
  if (s === 'needed') return island ? !isOwned(island, m.name) : missingIslands(m).length > 0;
  if (s === 'zap') return zapNeedsFor(m.name).length > 0;
  if (s === 'wub') return wubNeedsFor(m.name).some((w) => !island || w.island === island);
  return true;
}

function Row({ m, island, open, onToggle }) {
  const entries = island ? m.islands.filter((e) => e.island === island) : m.islands;
  const ownedN = m.islands.filter((e) => isOwned(e.island, m.name)).length;
  const hows = [...new Set(m.islands.map((e) => e.how))];
  const expanded = open || !!island;
  return html`<div class=${cx('db-row', expanded && 'open')}>
    <div class="db-head">
      <button class="db-mon" onClick=${() => openDetail(m.name, entries[0]?.island)}>
        <${MonImg} m=${m} island=${entries[0]?.island} size=${44} />
        <span class="db-name"><strong>${m.name}</strong><${StatusTags} m=${m} island=${island} /></span>
      </button>
      <span class="db-col"><${Rarity} r=${m.rarity} /></span>
      <span class="db-col class-tag">${m.class}</span>
      <span class="db-col"><${ElemIcons} list=${m.elements} size=${18} /></span>
      <span class="db-col hows">${hows.map((h) => html`<span class=${'how how-' + (HOW[h]?.tone || 'other')}>${HOW[h]?.label || h}</span>`)}</span>
      <span class=${cx('db-col owned-count', ownedN === m.islands.length && 'all')}>${ownedN}/${m.islands.length}</span>
      ${!island && html`<button class="icon-btn sm" aria-expanded=${open} aria-label=${(open ? 'Hide' : 'Show') + ' islands'} onClick=${onToggle}>
        <${Icon} name=${open ? 'up' : 'down'} /></button>`}
    </div>
    ${expanded && html`<div class="entries">${entries.map((e) => html`<${EntryRow} key=${e.island} m=${m} e=${e} />`)}</div>`}
  </div>`;
}

export function DatabaseView() {
  const f = ui.db;
  const [open, setOpen] = useState({});
  const [limit, setLimit] = useState(PAGE);
  const upd = (patch) => { setUi('db', patch); setLimit(PAGE); };
  const list = monsters.filter((m) => matches(m.name, f.q) && (!f.rarity || m.rarity === f.rarity) &&
    (!f.cls || m.class === f.cls) && (!f.elem || m.elements.includes(f.elem)) &&
    (!f.island || entryFor(m, f.island)) && f.status.every((s) => statusOk(m, s, f.island)));
  const anyFilter = !!(f.q || f.rarity || f.cls || f.elem || f.island || f.status.length);

  return html`<section class="pane">
    <header class="pane-head"><div><h1>Database</h1><p class="muted">${list.length} of ${monsters.length} monsters</p></div></header>
    <div class="filters">
      <${SearchBox} value=${f.q} onInput=${(v) => upd({ q: v })} />
      <select value=${f.rarity} onChange=${(e) => upd({ rarity: e.currentTarget.value })} aria-label="Rarity">
        <option value="">All rarities</option>${RARITIES.map((r) => html`<option>${r}</option>`)}</select>
      <select value=${f.cls} onChange=${(e) => upd({ cls: e.currentTarget.value })} aria-label="Class">
        <option value="">All classes</option>${classes.map((c) => html`<option>${c}</option>`)}</select>
      <select value=${f.elem} onChange=${(e) => upd({ elem: e.currentTarget.value })} aria-label="Element">
        <option value="">All elements</option>${elements.map((c) => html`<option>${c}</option>`)}</select>
      <select value=${f.island} onChange=${(e) => upd({ island: e.currentTarget.value })} aria-label="Island">
        <option value="">All islands</option>${islands.map((i) => html`<option>${i.name}</option>`)}</select>
    </div>
    <div class="toolbar">
      <div class="chips">${STATUSES.map(([k, label]) => html`<${Chip} on=${f.status.includes(k)} tone=${'st-' + k}
        onClick=${() => upd({ status: f.status.includes(k) ? f.status.filter((x) => x !== k) : [...f.status, k] })}>${label}<//>`)}</div>
      ${anyFilter && html`<button class="btn ghost sm" onClick=${() => upd({ q: '', rarity: '', cls: '', elem: '', island: '', status: [] })}>Clear filters</button>`}
    </div>
    ${list.length
      ? html`<div class="db-list">
          <div class="db-legend"><span>Monster</span><span>Rarity</span><span>Class</span><span>Elements</span><span>How to get</span><span>Owned</span></div>
          ${list.slice(0, limit).map((m) => html`<${Row} key=${m.name} m=${m} island=${f.island} open=${open[m.name]}
            onToggle=${() => setOpen({ ...open, [m.name]: !open[m.name] })} />`)}
        </div>
        ${list.length > limit && html`<button class="btn block" onClick=${() => setLimit(limit + PAGE * 2)}>Show more (${list.length - limit} left)</button>`}`
      : html`<${Empty} icon="database" title="No monsters match">Try removing a filter.<//>`}
  </section>`;
}
