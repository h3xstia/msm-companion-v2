import { html } from '../lib.js';
import { byName, wubbox, wubboxList, wubboxKey, WUBBOX_TYPES } from '../data.js';
import { cx, pct, plural } from '../util.js';
import { save, ui, setUi, commit, openDetail } from '../store.js';
import { Icon, MonImg, ElemIcons, Progress, IslandPicker, Empty } from '../ui.js';

const TYPE_MONSTER = { common: 'Wubbox', rare: 'Rare Wubbox', epic: 'Epic Wubbox' };
const label = (t) => t[0].toUpperCase() + t.slice(1);

export function WubboxView() {
  const island = wubbox[ui.wub.island] ? ui.wub.island : Object.keys(wubbox)[0];
  const types = WUBBOX_TYPES.filter((t) => wubboxList(island, t).list.length);
  const type = types.includes(ui.wub.type) ? ui.wub.type : types[0];
  const { list, required } = wubboxList(island, type);
  const key = wubboxKey(island, type);
  const boxed = save.boxed[key] || {};
  const n = list.filter((x) => boxed[x]).length;
  const count = (isl, t = type) => {
    if (!wubbox[isl]) return null;
    const w = wubboxList(isl, t);
    if (!w.list.length) return t === type ? null : [0, 0]; // hide islands without this Wubbox type
    const b = save.boxed[wubboxKey(isl, t)] || {};
    return [Math.min(w.required, w.list.filter((x) => b[x]).length), w.required];
  };
  const toggle = (name) => commit((s) => {
    const row = (s.boxed[key] ||= {});
    if (row[name]) delete row[name]; else row[name] = 1;
  });
  const allBoxed = n === list.length;
  const setAll = () => commit((s) => {
    const row = (s.boxed[key] ||= {});
    list.forEach((x) => { if (allBoxed) delete row[x]; else row[x] = 1; });
  }, { undoable: allBoxed ? 'Unboxed all' : 'Boxed all' });

  return html`<div class="split">
    <${IslandPicker} value=${island} count=${count} onChange=${(v) => setUi('wub', { island: v })} />
    <section class="pane">
      <div class="wub-types" role="tablist">${types.map((t) => html`
        <button role="tab" aria-selected=${t === type} class=${cx('wub-type', t === type && 'on', 'rar-edge-' + (t === 'common' ? 'common' : t))}
          onClick=${() => setUi('wub', { type: t })}>
          <${MonImg} m=${byName.get(TYPE_MONSTER[t])} island=${island} size=${36} /><span>${label(t)}</span>
          <small>${count(island, t).join('/')}</small></button>`)}</div>
      <header class="pane-head wub-head">
        <${MonImg} m=${byName.get(TYPE_MONSTER[type])} island=${island} size=${72} />
        <div class="grow">
          <h1>${island}</h1>
          <p class="muted">${label(type)} Wubbox · ${Math.min(n, required)} of ${required} boxed · ${pct(Math.min(n, required), required)}%
            ${required < list.length ? ` · any ${required} of the ${list.length} below` : ''}</p>
          <${Progress} value=${Math.min(n, required)} max=${required} />
        </div>
      </header>
      <div class="toolbar">
        <span class="muted">${plural(Math.max(0, required - n), 'monster')} still to box</span>
        <div class="toolbar-end"><button class="btn ghost sm" onClick=${setAll}>${allBoxed ? 'Unbox all' : 'Box all'}</button></div>
      </div>
      ${list.length ? html`<div class="card-grid compact">${list.map((name) => {
        const m = byName.get(name);
        if (!m) return null;
        const on = !!boxed[name];
        return html`<div class=${cx('mon-card', on && 'owned')} key=${name}>
          <button class="mon-card-hit" aria-pressed=${on} aria-label=${(on ? 'Boxed: ' : 'Not boxed: ') + name} onClick=${() => toggle(name)}></button>
          <div class="mon-card-img"><${MonImg} m=${m} island=${island} size=${48} /><span class="owned-check"><${Icon} name="check" size=${12} /></span></div>
          <div class="mon-card-body">
            <div class="mon-card-name">${m.name}</div>
            <div class="mon-card-meta"><span class=${'dot rar-' + m.rarity.toLowerCase()}></span><${ElemIcons} list=${m.elements} size=${15} /></div>
          </div>
          <button class="icon-btn sm mon-card-info" aria-label=${'Details for ' + name} onClick=${() => openDetail(name, island)}><${Icon} name="info" size=${16} /></button>
        </div>`;
      })}</div>` : html`<${Empty} title="No Wubbox data for this island" />`}
      <p class="hint">Tap a monster once it's boxed.</p>
    </section>
  </div>`;
}
