import { html, useEffect, useState } from '../lib.js';
import { byName, howLabel, entryDetails, islandByName, alwaysObtainable, zapEntry } from '../data.js';
import { suggestDeadline } from '../util.js';
import { cx, plural, relTime } from '../util.js';
import { save, commit, isAvailable, openDetail, purgeExpired, toast, setUi } from '../store.js';
import { syncFromWiki, wikiStale, WIKI_PAGE } from '../wiki.js';
import { Deadline } from '../overlays.js';
import { Icon, MonImg, Rarity, Empty, IslandIcon } from '../ui.js';

let autoTried = false;

// why it's on the list when it isn't plain breeding: a vessel to zap, or a starshop buy
function Reason({ m, a }) {
  const kind = a.kind || (a.chipless ? (a.cats || []).some((c) => /vessel/i.test(c)) ? 'vessel' : 'starshop' : null);
  if (kind === 'vessel') {
    const isl = zapEntry(m)?.island;
    const monthly = isl && islandByName.get(isl)?.vesselsMonthly;
    return html`<span class="reason reason-vessel" title=${isl ? `Vessel to zap on ${isl}` : 'Vessel'}>Vessel${isl ? ' · ' + isl.replace(' Island', '') : ''}</span>
      ${monthly && html`<${Deadline} until=${suggestDeadline('End of Month')} />`}`;
  }
  if (kind === 'starshop') return html`<span class="reason reason-starshop" title="Buy it in the Starshop">Starshop</span>`;
  return a.until ? html`<${Deadline} until=${a.until} />` : null;
}

function AvailCard({ name, go }) {
  const m = byName.get(name);
  const a = save.avail[name];
  if (!m) return null;
  return html`<div class=${cx('avail-card', a.chipless && 'chipless')}>
    <button class="avail-main" onClick=${() => openDetail(name)}>
      <${MonImg} m=${m} size=${52} />
      <div class="avail-info">
        <strong>${m.name}</strong>
        <div class="meta"><${Rarity} r=${m.rarity} /><${Reason} m=${m} a=${a} /></div>
      </div>
    </button>
    <div class="avail-islands">${m.islands.filter((e) => a.kind === 'vessel'
        ? e.how === 'Zap' // a vessel is only news for the island you zap it on
        : !islandByName.get(e.island)?.hideInAvailable && !alwaysObtainable(m, e.island)).map((e) => {
      const how = e.combo ? e.combo.join(' + ') : [howLabel(e), ...entryDetails(m, e)].join(' · ');
      return html`<button class="isl-btn" key=${e.island} title=${`${e.island}
${how}`} aria-label=${`${e.island}: ${how}. Open in Collection`}
        onClick=${() => { setUi('col', { island: e.island }); go('collection'); }}><${IslandIcon} name=${e.island} /></button>`;
    })}</div>
  </div>`;
}

export function AvailableView({ go }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const run = (silent) => {
    setBusy(true); setErr('');
    syncFromWiki()
      .then((cats) => !silent && toast(`Synced ${plural(cats.reduce((n, c) => n + c.portraits.length, 0), 'monster')} from the wiki`))
      .catch((e) => { setErr(e.message); if (!silent) toast('Wiki sync failed: ' + e.message, { tone: 'error' }); })
      .finally(() => setBusy(false));
  };
  useEffect(() => {
    purgeExpired();
    if (!autoTried && wikiStale()) { autoTried = true; run(true); }
  }, []);

  const names = Object.keys(save.avail).filter((n) => byName.has(n));
  const byCat = new Map();
  const manual = [];
  for (const n of names) {
    const a = save.avail[n];
    if (a.wiki && a.cats?.length) a.cats.forEach((c) => { if (!byCat.has(c)) byCat.set(c, []); byCat.get(c).push(n); });
    else manual.push(n);
  }
  const catOrder = [...(save.wiki?.cats || []), ...byCat.keys()].filter((c, i, arr) => byCat.has(c) && arr.indexOf(c) === i);
  const sortNames = (list) => list.sort((a, b) => {
    const ua = save.avail[a].until, ub = save.avail[b].until;
    if (ua && ub) return ua - ub;
    if (ua || ub) return ua ? -1 : 1;
    return a.localeCompare(b);
  });
  const nowCount = names.filter(isAvailable).length;
  const unknown = save.wiki?.unknown || [];

  return html`<section class="pane">
    <header class="pane-head">
      <div><h1>Available</h1><p class="muted">${nowCount} available now · seasonal, event and returning monsters</p></div>
      <div class="head-actions">
        <button class="btn" disabled=${busy} onClick=${() => run(false)}><${Icon} name="sync" size=${16} class=${busy ? 'spin' : ''} />${busy ? 'Syncing…' : 'Sync from wiki'}</button>
      </div>
    </header>
    <p class="muted small sync-line">
      ${save.wiki ? `Last wiki sync ${relTime(save.wiki.time)}` : 'Not synced yet'}
      · <a href=${WIKI_PAGE} target="_blank" rel="noopener">MSM Wiki <${Icon} name="external" size=${12} /></a>
      ${names.length > 0 && html` · <button class="link danger" onClick=${() => commit((s) => { s.avail = {}; }, { undoable: 'Cleared all availability' })}>Clear all</button>`}
      ${err && html` · <span class="danger">Sync failed: ${err}</span>`}
    </p>
    ${unknown.length > 0 && html`<div class="notice">
      <strong>${plural(unknown.length, 'monster')} on the wiki ${unknown.length === 1 ? "isn't" : "aren't"} in the database yet:</strong> ${unknown.join(', ')}.
      Add ${unknown.length === 1 ? 'it' : 'them'} to data/monsters.js to track ${unknown.length === 1 ? 'it' : 'them'}.</div>`}
    ${!names.length
      ? html`<${Empty} icon="available" title="Nothing marked yet">Sync from the wiki to see what's on sale right now.<//>`
      : html`${catOrder.map((c) => html`<div class="section-head"><h2>${c}</h2><span class="muted">${byCat.get(c).length}</span></div>
          <div class="avail-grid">${sortNames(byCat.get(c)).map((n) => html`<${AvailCard} key=${c + n} name=${n} go=${go} />`)}</div>`)}
        ${manual.length > 0 && html`<div class="section-head"><h2>Added by you</h2><span class="muted">${manual.length}</span></div>
          <div class="avail-grid">${sortNames(manual).map((n) => html`<${AvailCard} key=${n} name=${n} go=${go} />`)}</div>`}`}
  </section>`;
}
