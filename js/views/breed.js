import { html, useMemo, useRef, useState } from '../lib.js';
import { byName, islands, onIsland } from '../data.js';
import { entryTimes, cx, matches, plural } from '../util.js';
import { ui, setUi, useStore, isOwned, isAvailable, openDetail } from '../store.js';
import { computeOffspring, sharesIsland, parentCandidates, breedable } from '../breeding.js';
import { suggestPairs, planParents } from '../planner.js';
import { wikiStale } from '../wiki.js';
import { skinOn, islandIcon } from '../art.js';
import { Icon, MonImg, ElemIcons, Rarity, Chip, Empty, Times, Segmented, IslandPicker } from '../ui.js';

function ParentPicker({ slot, label, other }) {
  const value = byName.get(ui.breed[slot]);
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const [sel, setSel] = useState(0);
  const input = useRef();
  // only show parents that work with the other one
  const compatible = useMemo(() => other ? parentCandidates.filter((m) => sharesIsland(other, m)) : parentCandidates, [other]);
  const hits = useMemo(() => {
    const ql = q.trim().toLowerCase();
    const list = compatible.filter((m) => matches(m.name, q));
    list.sort(ql ? (a, b) => a.name.toLowerCase().indexOf(ql) - b.name.toLowerCase().indexOf(ql) || a.name.localeCompare(b.name)
      : (a, b) => a.name.localeCompare(b.name));
    return list.slice(0, 40);
  }, [q, compatible]);
  const choose = (m) => { setUi('breed', { [slot]: m.name }); setQ(''); setOpen(false); };

  if (value) {
    return html`<div class="parent">
      <div class="parent-label">${label}</div>
      <div class=${'parent-card rar-edge-' + value.rarity.toLowerCase()}>
        <button class="parent-img" onClick=${() => openDetail(value.name)} aria-label=${'Details for ' + value.name}><${MonImg} m=${value} size=${64} /></button>
        <div class="parent-info"><strong>${value.name}</strong>
          <div class="meta"><${Rarity} r=${value.rarity} /><${ElemIcons} list=${value.elements} size=${18} /></div></div>
        <button class="btn ghost sm" onClick=${() => { setUi('breed', { [slot]: '' }); setTimeout(() => input.current?.focus(), 30); }}>Change</button>
      </div>
    </div>`;
  }
  const onKey = (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setOpen(true); setSel((s) => Math.min(s + 1, hits.length - 1)); }
    if (e.key === 'ArrowUp') { e.preventDefault(); setSel((s) => Math.max(s - 1, 0)); }
    if (e.key === 'Enter' && hits[sel]) choose(hits[sel]);
    if (e.key === 'Escape') setOpen(false);
  };
  return html`<div class="parent">
    <div class="parent-label">${label}</div>
    <div class="combobox">
      <label class="search big"><${Icon} name="search" />
        <input ref=${input} type="search" placeholder="Choose a monster…" value=${q} role="combobox" aria-expanded=${open}
          onInput=${(e) => { setQ(e.currentTarget.value); setOpen(true); setSel(0); }}
          onFocus=${() => setOpen(true)} onBlur=${() => setTimeout(() => setOpen(false), 150)} onKeyDown=${onKey} /></label>
      ${open && hits.length > 0 && html`<div class="combo-list" role="listbox">
        ${hits.map((m, i) => html`<button role="option" aria-selected=${i === sel} class=${cx('combo-item', i === sel && 'on')}
          onMouseDown=${(e) => { e.preventDefault(); choose(m); }} onMouseEnter=${() => setSel(i)}>
          <${MonImg} m=${m} size=${32} /><span>${m.name}</span><${Rarity} r=${m.rarity} /></button>`)}
      </div>`}
    </div>
  </div>`;
}

function ResultCard({ o }) {
  const { m } = o;
  return html`<button class=${'result-card rar-edge-' + m.rarity.toLowerCase()} onClick=${() => openDetail(m.name, o.islands[0])}>
    <div class="result-top">
      <${MonImg} m=${m} island=${o.islands[0]} size=${52} />
      <div><strong>${m.name}</strong>
        ${isAvailable(m.name) && html`<span class="tag tag-avail">Available</span>`}
        <${ElemIcons} list=${m.elements} size=${16} /></div>
    </div>
    <ul class="result-islands">${o.islands.map((isl) => {
      const t = entryTimes(o.entries[isl], skinOn(isl));
      const owned = isOwned(isl, m.name);
      return html`<li class=${owned ? 'owned' : ''}><span>${owned && html`<${Icon} name="check" size=${12} />`}${isl}</span>
        <${Times} t=${t} skin=${skinOn(isl)} /></li>`;
    })}</ul>
  </button>`;
}

const ModeSwitch = () => html`<${Segmented} value=${ui.breed.mode} options=${[['sim', 'Sim'], ['suggest', 'Suggest']]}
  onChange=${(mode) => setUi('breed', { mode })} />`;

// islands where something can actually be bred
function planCount(island) {
  const all = onIsland.get(island) || [];
  if (!all.some(({ e }) => breedable(e))) return null;
  return [all.filter(({ m }) => isOwned(island, m.name)).length, all.length];
}

function PlanCard({ pair, rank, island }) {
  const { p1, p2, useful, total, others } = pair;
  return html`<article class="plan-card">
    <header class="plan-head">
      <span class="plan-rank">${rank}</span>
      <span class="plan-parents">
        <button class="parent-pic" title=${p1.name} aria-label=${p1.name} onClick=${() => openDetail(p1.name, island)}><${MonImg} m=${p1} island=${island} size=${44} /></button>
        <span class="plus">+</span>
        <button class="parent-pic" title=${p2.name} aria-label=${p2.name} onClick=${() => openDetail(p2.name, island)}><${MonImg} m=${p2} island=${island} size=${44} /></button>
      </span>
      <div class="plan-title"><strong>${p1.name} + ${p2.name}</strong>
        <span class="muted small">${useful.length} of ${plural(total, 'result')} useful${others ? ` · ${plural(others, 'other pair')} give the same` : ''}</span></div>
      <button class="btn ghost sm" onClick=${() => setUi('breed', { p1: p1.name, p2: p2.name, island, mode: 'sim' })}>Open in Sim</button>
    </header>
    <div class="plan-outcomes">${useful.map((o) => html`<button class="plan-outcome" key=${o.m.name} onClick=${() => openDetail(o.m.name, island)}>
      <${MonImg} m=${o.m} island=${island} size=${36} />
      <span class="plan-name"><strong>${o.m.name}</strong><${Rarity} r=${o.m.rarity} /></span>
      <span class="tags">${o.limited && html`<span class="tag tag-avail">Available</span>`}${o.needs.map((n) => html`<span class=${'tag tag-' + n.kind} title=${n.title}>${n.label}</span>`)}</span>
    </button>`)}</div>
  </article>`;
}

function SuggestView() {
  const island = ui.breed.planIsland;
  const version = useStore();
  const pairs = useMemo(() => suggestPairs(island), [island, version]);
  const parents = planParents(island).length;
  return html`<div class="split">
    <${IslandPicker} value=${island} count=${planCount} onChange=${(v) => setUi('breed', { planIsland: v })} />
    <section class="pane">
      <header class="pane-head">
        <div class="head-title">
          <img class="island-icon-lg" src=${islandIcon(island)} alt="" onError=${(e) => (e.currentTarget.style.display = 'none')} />
          <div><h1>Breed Sim</h1><p class="muted">Best pairs to breed on ${island}</p></div>
        </div>
        <div class="head-actions"><${ModeSwitch} /></div>
      </header>
      ${wikiStale() && html`<div class="notice">Availability hasn't been synced lately, so rares and epics may be missing. Sync it on the Available tab.</div>`}
      ${pairs.length
        ? html`<div class="plan-list">${pairs.map((p, i) => html`<${PlanCard} key=${p.p1.name + p.p2.name} pair=${p} rank=${i + 1} island=${island} />`)}</div>
          <p class="hint">Pairs are ranked by what you still need here: new monsters, Wubbox progress and tracked zaps. Available rares and epics count extra.</p>`
        : parents < 2
          ? html`<${Empty} icon="egg" title="Not enough parents">Mark at least two monsters as owned on ${island} in Collection.<//>`
          : html`<${Empty} icon="egg" title="Nothing to suggest">Nothing you can breed here right now is needed.<//>`}
    </section>
  </div>`;
}

export const BreedView = () => (ui.breed.mode === 'suggest' ? html`<${SuggestView} />` : html`<${SimView} />`);

function SimView() {
  const p1 = byName.get(ui.breed.p1), p2 = byName.get(ui.breed.p2);
  const offspring = useMemo(() => computeOffspring(p1, p2), [p1, p2]);
  const found = new Set(offspring.flatMap((o) => o.islands));
  const islandsList = islands.map((i) => i.name).filter((n) => found.has(n));
  const isl = islandsList.includes(ui.breed.island) ? ui.breed.island : '';
  const shown = isl ? offspring.filter((o) => o.islands.includes(isl)).map((o) => ({ ...o, islands: [isl] })) : offspring;
  const groups = ['Common', 'Rare', 'Epic'].map((r) => [r, shown.filter((o) => o.m.rarity === r)]).filter(([, l]) => l.length);

  return html`<section class="pane">
    <header class="pane-head"><div><h1>Breed Sim</h1><p class="muted">Pick two parents to see what they can make.</p></div>
      <div class="head-actions"><${ModeSwitch} /></div></header>
    <div class="parents">
      <${ParentPicker} slot="p1" label="Parent 1" other=${p2} />
      <button class="icon-btn swap" aria-label="Swap parents" title="Swap parents"
        onClick=${() => setUi('breed', { p1: ui.breed.p2, p2: ui.breed.p1 })}><${Icon} name="swap" /></button>
      <${ParentPicker} slot="p2" label="Parent 2" other=${p1} />
    </div>
    ${!p1 || !p2
      ? html`<${Empty} title="Choose two parents" art=${html`<div class="breed-art" aria-hidden="true">
          <span class=${cx('slot', p1 && 'filled')}>${p1 ? html`<${MonImg} m=${p1} size=${52} />` : '?'}</span><span class="op">+</span>
          <span class=${cx('slot', p2 && 'filled')}>${p2 ? html`<${MonImg} m=${p2} size=${52} />` : '?'}</span><span class="op">=</span>
          <span class="slot egg"><${Icon} name="egg" size=${28} /></span></div>`}>
          Pick a monster in each box above to see everything they can breed, and on which islands.<//>`
      : !offspring.length
        ? html`<${Empty} icon="egg" title="No offspring">These two can't breed anything together.<//>`
        : html`
          <div class="toolbar">
            <span class="muted">${plural(offspring.length, 'possible result')}</span>
            ${islandsList.length > 1 && html`<div class="chips scroll">
              <${Chip} on=${!isl} onClick=${() => setUi('breed', { island: '' })}>All islands<//>
              ${islandsList.map((i) => html`<${Chip} on=${isl === i} onClick=${() => setUi('breed', { island: i })}>${i}<//>`)}
            </div>`}
          </div>
          ${groups.map(([r, list]) => html`<div class="section-head"><span class=${'rar rar-' + r.toLowerCase()}>${r}</span>
              <span class="muted">${plural(list.length, 'monster')}</span></div>
            <div class="result-grid">${list.map((o) => html`<${ResultCard} key=${o.m.name} o=${o} />`)}</div>`)}`}
  </section>`;
}
