import { html } from '../lib.js';
import { onIsland, entryDetails, howLabel } from '../data.js';
import { entryTimes, cx, matches, pct, plural } from '../util.js';
import { save, ui, setUi, commit, isOwned, openDetail } from '../store.js';
import { Icon, MonImg, ElemIcons, StatusTags, Progress, IslandPicker, RarityChips, SearchBox, Empty, Chip } from '../ui.js';

export const islandCount = (island) => {
  const list = onIsland.get(island) || [];
  return list.length ? [list.filter(({ m }) => isOwned(island, m.name)).length, list.length] : null;
};

function howLine(m, e) {
  if (e.combo) return e.combo.join(' + ');
  return [howLabel(e), ...entryDetails(m, e)].join(' · ');
}

function MonsterCard({ m, e, island }) {
  const owned = isOwned(island, m.name);
  const t = entryTimes(e, !!save.skins[island]);
  const toggle = () => commit((s) => {
    const row = (s.owned[island] ||= {});
    if (owned) delete row[m.name]; else row[m.name] = 1;
  });
  return html`<div class=${cx('mon-card', owned && 'owned')}>
    <button class="mon-card-hit" aria-pressed=${owned} aria-label=${(owned ? 'Owned: ' : 'Not owned: ') + m.name} onClick=${toggle}></button>
    <div class="mon-card-img"><${MonImg} m=${m} island=${island} size=${56} />
      <span class="owned-check"><${Icon} name="check" size=${12} /></span></div>
    <div class="mon-card-body">
      <div class="mon-card-name">${m.name}</div>
      <div class="mon-card-meta"><span class=${'dot rar-' + m.rarity.toLowerCase()} title=${m.rarity}></span><${ElemIcons} list=${m.elements} size=${15} /></div>
      <div class="mon-card-how" title=${howLine(m, e)}>${howLine(m, e)}</div>
      ${t && html`<div class="mon-card-time">${t.time} <span>· ${t.enhanced}</span></div>`}
      <${StatusTags} m=${m} island=${island} />
    </div>
    <button class="icon-btn sm mon-card-info" aria-label=${'Details for ' + m.name} onClick=${() => openDetail(m.name, island)}>
      <${Icon} name="info" size=${16} /></button>
  </div>`;
}

export function CollectionView() {
  const { island, rarity, hideOwned, q } = ui.col;
  const all = onIsland.get(island) || [];
  const owned = all.filter(({ m }) => isOwned(island, m.name)).length;
  const breeding = all.some(({ e }) => e.time);
  const skin = !!save.skins[island];
  const present = [...new Set(all.map(({ m }) => m.rarity))];
  const list = all.filter(({ m }) =>
    (!rarity || m.rarity === rarity) && (!hideOwned || !isOwned(island, m.name)) && matches(m.name, q));

  const markAll = (value) => commit((s) => {
    const row = (s.owned[island] ||= {});
    for (const { m } of list) { if (value) row[m.name] = 1; else delete row[m.name]; }
  }, { undoable: value ? `Marked ${plural(list.length, 'monster')} owned` : `Cleared ${plural(list.length, 'monster')}` });

  return html`<div class="split">
    <${IslandPicker} value=${island} count=${islandCount} onChange=${(v) => setUi('col', { island: v })} />
    <section class="pane">
      <header class="pane-head">
        <div>
          <h1>${island}</h1>
          <p class="muted">${owned} of ${all.length} owned · ${pct(owned, all.length)}%</p>
        </div>
        ${breeding && html`<${Chip} on=${skin} onClick=${() => commit((s) => { s.skins[island] = !skin; })}>
          <${Icon} name="sparkle" size=${14} /> Island skin${skin ? ' on' : ''}<//>`}
      </header>
      <${Progress} value=${owned} max=${all.length} />
      <div class="toolbar">
        <${SearchBox} value=${q} placeholder=${'Search ' + island + '…'} onInput=${(v) => setUi('col', { q: v })} />
        <${RarityChips} value=${rarity} present=${present} onChange=${(v) => setUi('col', { rarity: v })} />
        <${Chip} on=${hideOwned} onClick=${() => setUi('col', { hideOwned: !hideOwned })}>Hide owned<//>
        <div class="toolbar-end">
          ${list.length > 0 && html`<button class="btn ghost sm" onClick=${() => markAll(list.some(({ m }) => !isOwned(island, m.name)))}>
            ${list.some(({ m }) => !isOwned(island, m.name)) ? 'Mark all owned' : 'Unmark all'}</button>`}
        </div>
      </div>
      ${list.length
        ? html`<div class="card-grid">${list.map(({ m, e }) => html`<${MonsterCard} key=${m.name} m=${m} e=${e} island=${island} />`)}</div>`
        : html`<${Empty} title=${all.length ? 'No monsters match' : 'No monsters on this island'}>
            ${hideOwned && owned === all.length ? 'You own everything here!' : 'Try clearing the filters.'}<//>`}
      <p class="hint">Tap a card to mark it owned. Tap <${Icon} name="info" size=${12} /> for details.</p>
    </section>
  </div>`;
}
