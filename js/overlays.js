import { html, useEffect, useMemo, useRef, useState } from './lib.js';
import { byName, monsters, islands, howLabel, HOW, entryDetails } from './data.js';
import { entryTimes, timeLeft, urgency, cx, matches } from './util.js';
import {
  save, detail, openDetail, closeDetail, isOwned, setOwned, isAvailable, zapNeedsFor, wubNeedsFor, setUi,
} from './store.js';
import { skinOn } from './art.js';
import { Icon, MonImg, ElemIcons, Rarity, TokenImg, MonLink, Dialog, Times } from './ui.js';

export function EntryRow({ m, e, toggle = true }) {
  const t = entryTimes(e, skinOn(e.island));
  const owned = isOwned(e.island, m.name);
  const details = entryDetails(m, e);
  return html`<div class=${cx('entry', owned && 'owned')}>
    <div class="entry-main">
      <div class="entry-island">${e.island}</div>
      <div class="entry-how">
        <span class=${'how how-' + (HOW[e.how]?.tone || 'other')}>${howLabel(e)}</span>
        ${e.combo && html`<span class="combo">${e.combo.map((p, i) => html`${i ? ' + ' : ''}${byName.has(p) ? html`<${MonLink} name=${p} island=${e.island} />` : p}`)}</span>`}
        ${details.map((d) => html`<span class="detail">${d}</span>`)}
      </div>
      ${e.eggs && html`<div class="egg-list">${e.eggs.map(([egg, n]) => html`
        <span class="egg-pill" title=${egg}><${TokenImg} token=${egg} island=${e.island} size=${20} />${egg} ×${n}</span>`)}
        ${e.limit && html`<span class="detail">Time limit: ${e.limit}</span>`}</div>`}
    </div>
    ${t && html`<div class="entry-time"><${Times} t=${t} skin=${skinOn(e.island)} /></div>`}
    ${toggle && html`<label class="owned-toggle" title=${owned ? 'Owned' : 'Mark owned'}>
      <input type="checkbox" checked=${owned} onChange=${(ev) => setOwned(e.island, m.name, ev.currentTarget.checked)} />
      <span><${Icon} name="check" size=${14} /></span></label>`}
  </div>`;
}

export function DetailPanel() {
  const m = detail && byName.get(detail.name);
  useEffect(() => {
    if (!m) return;
    const onKey = (e) => e.key === 'Escape' && closeDetail();
    addEventListener('keydown', onKey);
    return () => removeEventListener('keydown', onKey);
  }, [m]);
  if (!m) return null;
  const a = save.avail[m.name];
  const avail = isAvailable(m.name);
  const zaps = zapNeedsFor(m.name);
  const wubs = wubNeedsFor(m.name);
  const ownedN = m.islands.filter((e) => isOwned(e.island, m.name)).length;

  return html`<div class="scrim" onClick=${closeDetail}></div>
    <aside class="drawer" role="dialog" aria-label=${m.name}>
      <header class="drawer-head">
        <${MonImg} m=${m} island=${detail.island} size=${84} />
        <div class="drawer-title">
          <h2>${m.name}</h2>
          <div class="meta"><${Rarity} r=${m.rarity} /><span class="class-tag">${m.class}</span><${ElemIcons} list=${m.elements} size=${20} /></div>
          <div class="meta muted">Owned on ${ownedN} of ${m.islands.length} islands</div>
        </div>
        <button class="icon-btn" aria-label="Close" onClick=${closeDetail}><${Icon} name="close" /></button>
      </header>
      <div class="drawer-body">
        ${(avail || a || zaps.length > 0 || wubs.length > 0) && html`<section class="status-list">
          ${a && html`<div class=${cx('status', avail ? 'status-avail' : 'status-muted')}>
            <${Icon} name="available" size=${16} />
            ${a.chipless ? 'In the Starshop / vessels' : 'Available now'}
            ${a.until && html` · ${timeLeft(a.until - Date.now()) || 'expired'} left`}
            ${a.cats?.length ? html` · ${a.cats.join(', ')}` : ''}</div>`}
          ${zaps.map((z) => html`<div class="status status-zap"><${Icon} name="zap" size=${16} />
            ${z.zap.monster} still needs ${z.still}${z.via ? ` (as ${z.via})` : ''}</div>`)}
          ${wubs.map((w) => html`<div class="status status-wub"><${Icon} name="wubbox" size=${16} />
            ${w.island} · ${w.type} Wubbox</div>`)}
        </section>`}
        <h3>Islands</h3>
        <div class="entries">${m.islands.map((e) => html`<${EntryRow} m=${m} e=${e} key=${e.island} />`)}</div>
      </div>
    </aside>`;
}

export function SearchPalette({ open, onClose, go }) {
  const [q, setQ] = useState('');
  const [sel, setSel] = useState(0);
  const input = useRef();
  useEffect(() => { if (open) { setQ(''); setSel(0); setTimeout(() => input.current?.focus(), 30); } }, [open]);
  const results = useMemo(() => {
    if (!q.trim()) return [];
    const ql = q.trim().toLowerCase();
    const isl = islands.filter((i) => matches(i.name, q)).slice(0, 4).map((i) => ({ type: 'island', i }));
    const mons = monsters.filter((m) => matches(m.name, q))
      .sort((a, b) => a.name.toLowerCase().indexOf(ql) - b.name.toLowerCase().indexOf(ql) || a.name.length - b.name.length)
      .slice(0, 12).map((m) => ({ type: 'monster', m }));
    return [...mons, ...isl];
  }, [q]);
  const pick = (r) => {
    onClose();
    if (r.type === 'monster') openDetail(r.m.name);
    else { setUi('col', { island: r.i.name }); go('collection'); }
  };
  const onKey = (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setSel((s) => Math.min(s + 1, results.length - 1)); }
    if (e.key === 'ArrowUp') { e.preventDefault(); setSel((s) => Math.max(s - 1, 0)); }
    if (e.key === 'Enter' && results[sel]) pick(results[sel]);
  };
  return html`<${Dialog} open=${open} onClose=${onClose} title="Search">
    <label class="search big"><${Icon} name="search" />
      <input ref=${input} type="search" placeholder="Monster or island…" value=${q}
        onInput=${(e) => { setQ(e.currentTarget.value); setSel(0); }} onKeyDown=${onKey} /></label>
    <div class="palette-results">
      ${results.map((r, i) => html`<button class=${cx('palette-item', i === sel && 'on')} onMouseEnter=${() => setSel(i)} onClick=${() => pick(r)}>
        ${r.type === 'monster'
          ? html`<${MonImg} m=${r.m} size=${32} /><span>${r.m.name}</span><${Rarity} r=${r.m.rarity} />`
          : html`<span class="palette-icon"><${Icon} name="islands" /></span><span>${r.i.name}</span><small>Island</small>`}
      </button>`)}
      ${q && !results.length && html`<p class="muted pad">Nothing found.</p>`}
      ${!q && html`<p class="muted pad">Type to find any monster or island. Tip: press <kbd>/</kbd> anywhere.</p>`}
    </div>
  <//>`;
}

export function Deadline({ until, none = 'No deadline' }) {
  const u = urgency(until);
  return html`<span class=${'deadline dl-' + u}>${u === 'none' ? none : u === 'expired' ? 'Expired' : timeLeft(until - Date.now()) + ' left'}</span>`;
}
