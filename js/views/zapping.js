import { html, useEffect, useMemo, useState } from '../lib.js';
import { byName, onIsland, ZAP_ISLANDS } from '../data.js';
import { cx, matches, pct, plural, suggestDeadline, urgency } from '../util.js';
import { save, ui, setUi, commit, isAvailable, zapTotals, zapEggs, openDetail, isOwned } from '../store.js';
import { Deadline } from '../overlays.js';
import { Icon, MonImg, TokenImg, Empty, Dialog, Segmented, SearchBox, Stepper } from '../ui.js';

const zapTargets = (island) => (onIsland.get(island) || []).filter(({ e }) => e.how === 'Zap');

function DeadlineFields({ days, hours, setDays, setHours }) {
  return html`<div class="duration">
    <label><input type="number" min="0" max="400" inputmode="numeric" value=${days} placeholder="0" onInput=${(e) => setDays(e.currentTarget.value)} /> days</label>
    <label><input type="number" min="0" max="23" inputmode="numeric" value=${hours} placeholder="0" onInput=${(e) => setHours(e.currentTarget.value)} /> hours</label>
  </div>`;
}
const toDeadline = (d, h) => {
  const ms = (parseInt(d, 10) || 0) * 86400000 + (parseInt(h, 10) || 0) * 3600000;
  return ms > 0 ? Date.now() + ms : null;
};
const fromDeadline = (until) => {
  if (!until) return ['', ''];
  const rem = Math.max(0, until - Date.now());
  return [String(Math.floor(rem / 86400000) || ''), String(Math.round((rem % 86400000) / 3600000) || '')];
};

function TrackDialog({ open, onClose }) {
  const [island, setIsland] = useState('Wublin Island');
  const [q, setQ] = useState('');
  const [pick, setPick] = useState(null);
  const [days, setDays] = useState('');
  const [hours, setHours] = useState('');
  useEffect(() => { if (open) { setQ(''); setPick(null); } }, [open]);
  const list = useMemo(() => zapTargets(island).filter(({ m }) => matches(m.name, q)), [island, q]);
  const choose = (m, e) => {
    setPick(m);
    const [d, h] = fromDeadline(suggestDeadline(e.limit));
    setDays(d); setHours(h);
  };
  const confirm = () => {
    commit((s) => s.zaps.push({ id: Date.now().toString(36), monster: pick.name, island, deadline: toDeadline(days, hours), sent: {}, bred: {} }));
    onClose();
  };
  const limitOf = pick && zapTargets(island).find(({ m }) => m === pick)?.e.limit;
  return html`<${Dialog} open=${open} onClose=${onClose} title=${pick ? 'Track ' + pick.name : 'Track a zap target'} wide
    footer=${pick ? html`<button class="btn ghost" onClick=${() => setPick(null)}>Back</button><button class="btn primary" onClick=${confirm}>Start tracking</button>`
      : html`<button class="btn ghost" onClick=${onClose}>Cancel</button>`}>
    ${!pick ? html`
      <${Segmented} value=${island} options=${ZAP_ISLANDS.map((i) => [i, i.replace(' Island', '')])} onChange=${(v) => { setIsland(v); setQ(''); }} />
      <${SearchBox} value=${q} onInput=${setQ} autofocus />
      <div class="pick-list">${list.map(({ m, e }) => html`<button class="pick-row" key=${m.name} onClick=${() => choose(m, e)}>
        <${MonImg} m=${m} island=${island} size=${36} /><span class="grow">${m.name}${isOwned(island, m.name) ? html` <span class="muted small">· owned</span>` : ''}</span>
        <span class="muted small">${e.limit || 'No time limit'} · ${plural(e.eggs.reduce((n, [, c]) => n + c, 0), 'egg')}</span></button>`)}
        ${!list.length && html`<p class="muted pad">No zap targets found.</p>`}</div>`
    : html`
      <div class="pick-summary"><${MonImg} m=${pick} island=${island} size=${64} />
        <div><strong>${pick.name}</strong><div class="muted">${island} · ${limitOf || 'No time limit'}</div></div></div>
      <p class="muted">Time left until it disappears (leave empty for no deadline):</p>
      <${DeadlineFields} days=${days} hours=${hours} setDays=${setDays} setHours=${setHours} />`}
  <//>`;
}

function EditDeadline({ zap, onClose }) {
  const [d0, h0] = fromDeadline(zap?.deadline);
  const [days, setDays] = useState(d0);
  const [hours, setHours] = useState(h0);
  useEffect(() => { const [d, h] = fromDeadline(zap?.deadline); setDays(d); setHours(h); }, [zap]);
  return html`<${Dialog} open=${!!zap} onClose=${onClose} title="Change deadline"
    footer=${html`<button class="btn ghost" onClick=${onClose}>Cancel</button>
      <button class="btn primary" onClick=${() => { commit((s) => { s.zaps.find((z) => z.id === zap.id).deadline = toDeadline(days, hours); }); onClose(); }}>Save</button>`}>
    <${DeadlineFields} days=${days} hours=${hours} setDays=${setDays} setHours=${setHours} />
  <//>`;
}

function EggRow({ z, egg, need }) {
  const sent = z.sent[egg] || 0, bred = z.bred[egg] || 0;
  const done = sent >= need;
  const partial = !done && sent + bred > 0;
  const avail = !done && byName.has(egg) && isAvailable(egg);
  const set = (field, v) => commit((s) => { s.zaps.find((x) => x.id === z.id)[field][egg] = v; });
  return html`<div class=${cx('egg', done && 'done', partial && 'partial', avail && 'avail')}>
    <div class="egg-head">
      <button class="egg-img" onClick=${() => byName.has(egg) && openDetail(egg, z.island)} aria-label=${egg}>
        <${TokenImg} token=${egg} island=${z.island} size=${36} /></button>
      <div class="egg-name"><strong>${egg}</strong>
        <span class="muted small">${done ? 'Done' : `${Math.max(0, need - sent - bred)} to go`} · needs ${need}${avail ? ' · ' : ''}${avail && html`<span class="tag tag-avail">Available</span>`}</span></div>
    </div>
    <div class="egg-counts">
      <label><span>Sent</span><${Stepper} label="sent" value=${sent} max=${need} onChange=${(v) => set('sent', v)} /></label>
      <label><span>Bred</span><${Stepper} label="bred" value=${bred} max=${need} onChange=${(v) => set('bred', v)} /></label>
    </div>
  </div>`;
}

function ZapCard({ z, index, count, drag, onEditDeadline }) {
  const m = byName.get(z.monster);
  const eggs = zapEggs(z);
  const t = zapTotals(z);
  const collapsed = !!ui.zap.collapsed[z.id];
  const move = (dir) => commit((s) => { const [it] = s.zaps.splice(index, 1); s.zaps.splice(index + dir, 0, it); });
  if (!m) return null;
  return html`<article class=${cx('zap-card', 'zap-' + urgency(z.deadline), drag.over === z.id && 'drag-over')}
    onDragOver=${(e) => { e.preventDefault(); drag.setOver(z.id); }} onDrop=${(e) => { e.preventDefault(); drag.drop(z.id); }}>
    <header class="zap-head">
      <span class="grip" draggable="true" title="Drag to reorder" onDragStart=${() => drag.start(z.id)} onDragEnd=${drag.end}><${Icon} name="grip" /></span>
      <button class="zap-title" onClick=${() => setUi('zap', { collapsed: { ...ui.zap.collapsed, [z.id]: !collapsed } })} aria-expanded=${!collapsed}>
        <${MonImg} m=${m} island=${z.island} size=${48} />
        <span><strong>${m.name}</strong><span class="muted small">${z.island}</span></span>
      </button>
      <button class="deadline-btn" onClick=${() => onEditDeadline(z)} title="Change deadline"><${Deadline} until=${z.deadline} /></button>
      <div class="zap-tools">
        <button class="icon-btn sm" aria-label="Move up" disabled=${index === 0} onClick=${() => move(-1)}><${Icon} name="up" /></button>
        <button class="icon-btn sm" aria-label="Move down" disabled=${index === count - 1} onClick=${() => move(1)}><${Icon} name="down" /></button>
        <button class="icon-btn sm danger" aria-label=${'Stop tracking ' + m.name}
          onClick=${() => commit((s) => { s.zaps = s.zaps.filter((x) => x.id !== z.id); }, { undoable: `Stopped tracking ${m.name}` })}><${Icon} name="trash" /></button>
      </div>
    </header>
    <div class="zap-progress">
      <div class="progress split-bar"><span class="sent" style=${{ width: pct(t.sent, t.need) + '%' }}></span><span class="bred" style=${{ width: pct(t.bred, t.need) + '%' }}></span></div>
      <span class="small"><strong>${pct(t.have, t.need)}%</strong> · ${t.have}/${t.need} eggs
        (<span class="c-sent">${t.sent} sent</span>, <span class="c-bred">${t.bred} bred</span>)</span>
    </div>
    ${!collapsed && html`<div class="egg-grid">${eggs.map(([egg, need]) => html`<${EggRow} key=${egg} z=${z} egg=${egg} need=${need} />`)}</div>`}
  </article>`;
}

export function ZappingView() {
  const [tracking, setTracking] = useState(false);
  const [editing, setEditing] = useState(null);
  const [dragId, setDragId] = useState(null);
  const [over, setOver] = useState(null);
  const zaps = save.zaps;
  const drag = {
    over,
    setOver: (id) => dragId && id !== over && setOver(id),
    start: (id) => setDragId(id),
    end: () => { setDragId(null); setOver(null); },
    drop: (id) => {
      if (dragId && dragId !== id) commit((s) => {
        const from = s.zaps.findIndex((x) => x.id === dragId);
        const [it] = s.zaps.splice(from, 1);
        s.zaps.splice(s.zaps.findIndex((x) => x.id === id), 0, it);
      });
      setDragId(null); setOver(null);
    },
  };
  const urgent = zaps.filter((z) => urgency(z.deadline) === 'urgent').length;
  const expired = zaps.filter((z) => urgency(z.deadline) === 'expired').length;
  const done = zaps.filter((z) => { const t = zapTotals(z); return t.need && t.sent >= t.need; }).length;

  return html`<section class="pane">
    <header class="pane-head">
      <div><h1>Zapping</h1><p class="muted">
        ${plural(zaps.length, 'target')} tracked${urgent ? html` · <span class="c-warn">${urgent} ending soon</span>` : ''}${expired ? html` · <span class="danger">${expired} expired</span>` : ''}${done ? ` · ${done} complete` : ''}</p></div>
      <div class="head-actions"><button class="btn primary" onClick=${() => setTracking(true)}><${Icon} name="plus" size=${16} />Track</button></div>
    </header>
    ${zaps.length
      ? html`<div class="zap-list">${zaps.map((z, i) => html`<${ZapCard} key=${z.id} z=${z} index=${i} count=${zaps.length} drag=${drag} onEditDeadline=${setEditing} />`)}</div>
        <p class="hint">Sent = eggs already in the target. Bred = eggs you have ready to send. Drag the handle or use the arrows to reorder.</p>`
      : html`<${Empty} icon="zap" title="No zap targets yet">Track a Wublin, Amber or Celestial target to count the eggs it needs.
          <br /><button class="btn primary" onClick=${() => setTracking(true)}>Track a target</button><//>`}
    <${TrackDialog} open=${tracking} onClose=${() => setTracking(false)} />
    <${EditDeadline} zap=${editing} onClose=${() => setEditing(null)} />
  </section>`;
}
