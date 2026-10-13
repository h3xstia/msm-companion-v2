import { html, useState } from '../lib.js';
import { islandByName, ISLAND_TREE, wubbox, wubboxList, wubboxKey, WUBBOX_TYPES, onIsland } from '../data.js';
import { cx, pct, plural } from '../util.js';
import { islandIcon } from '../art.js';
import { save, ui, setUi, toast } from '../store.js';
import { islandCount } from './collection.js';
import { getIslandImage, setIslandImage, allIslandImages } from '../images.js';
import { Icon, Progress, Empty } from '../ui.js';

function compress(file, maxPx = 1920, quality = 0.8) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, maxPx / Math.max(img.width, img.height));
      const c = document.createElement('canvas');
      c.width = Math.round(img.width * scale); c.height = Math.round(img.height * scale);
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(img.src);
      resolve(c.toDataURL('image/jpeg', quality));
    };
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}

function wubboxSummary(name) {
  if (!wubbox[name]) return [];
  return WUBBOX_TYPES.map((t) => {
    const { list, required } = wubboxList(name, t);
    if (!list.length) return null;
    const b = save.boxed[wubboxKey(name, t)] || {};
    return { type: t, n: Math.min(required, list.filter((x) => b[x]).length), required };
  }).filter(Boolean);
}

function IslandDetail({ name, go }) {
  const [big, setBig] = useState(false);
  const img = getIslandImage(name);
  const [owned, total] = islandCount(name) || [0, 0];
  const wubs = wubboxSummary(name);
  const zaps = save.zaps.filter((z) => z.island === name);
  const info = islandByName.get(name);
  const upload = () => {
    const inp = document.createElement('input');
    inp.type = 'file'; inp.accept = 'image/*';
    inp.onchange = async () => {
      const f = inp.files[0];
      if (!f) return;
      try {
        await setIslandImage(name, await compress(f));
      } catch { toast("Couldn't read that image", { tone: 'error' }); }
    };
    inp.click();
  };
  return html`<section class="pane">
    <button class="btn ghost sm back" onClick=${() => setUi('isl', { island: '' })}><${Icon} name="chevron" class="flip" size=${16} />All islands</button>
    <header class="pane-head"><img class="island-icon-lg" src=${islandIcon(name)} alt="" onError=${(e) => (e.currentTarget.style.display = 'none')} /><div class="grow"><h1>${name}</h1>
      <p class="muted">${info.group} island · ${plural(total, 'monster')}${info.teleportLevel ? ` · ${info.teleportName || 'Teleport'} from level ${info.teleportLevel}` : ''}</p></div>
      <div class="head-actions">
        <button class="btn" onClick=${() => { setUi('col', { island: name }); go('collection'); }}><${Icon} name="collection" size=${16} />Collection</button>
        ${wubs.length > 0 && html`<button class="btn" onClick=${() => { setUi('wub', { island: name }); go('wubbox'); }}><${Icon} name="wubbox" size=${16} />Wubbox</button>`}
      </div>
    </header>
    <div class="island-stats">
      <div class="stat"><span class="muted small">Collection</span><strong>${owned}/${total}</strong><${Progress} value=${owned} max=${total} /></div>
      ${wubs.map((w) => html`<div class="stat"><span class="muted small">${w.type[0].toUpperCase() + w.type.slice(1)} Wubbox</span>
        <strong>${w.n}/${w.required}</strong><${Progress} value=${w.n} max=${w.required} tone="wub" /></div>`)}
      ${zaps.length > 0 && html`<div class="stat"><span class="muted small">Zap targets</span><strong>${zaps.length}</strong>
        <button class="link" onClick=${() => go('zapping')}>Open Zapping</button></div>`}
    </div>
    <div class="section-head"><h2>Island plan</h2>
      ${img && html`<div class="head-actions"><button class="btn ghost sm" onClick=${upload}><${Icon} name="upload" size=${14} />Replace</button>
        <button class="btn ghost sm danger" onClick=${() => setIslandImage(name, null)}><${Icon} name="trash" size=${14} />Remove</button></div>`}</div>
    ${img
      ? html`<button class=${cx('plan-img', big && 'big')} onClick=${() => setBig(!big)} aria-label="Toggle full size"><img src=${img} alt=${name + ' plan'} /></button>`
      : html`<button class="dropzone" onClick=${upload}><${Icon} name="image" size=${28} /><strong>Upload a plan or screenshot</strong>
          <span class="muted small">PNG or JPG · saved on this device only</span></button>`}
  </section>`;
}

export function IslandsView({ go }) {
  const sel = ui.isl.island;
  if (sel && islandByName.has(sel)) return html`<${IslandDetail} name=${sel} go=${go} />`;
  const images = allIslandImages();
  return html`<section class="pane">
    <header class="pane-head"><div><h1>Islands</h1><p class="muted">Your progress on every island. Open one to add your island plan.</p></div></header>
    ${ISLAND_TREE.map((t) => html`<h2 class="timeline-title">${t.name}</h2>${t.groups.map((grp) => {
      const list = grp.islands.filter((i) => onIsland.get(i.name)?.length);
      if (!list.length) return null;
      return html`<div class="section-head"><h2>${grp.name}</h2></div>
        <div class="island-grid">${list.map((i) => {
          const [a, b] = islandCount(i.name);
          const wubs = wubboxSummary(i.name);
          return html`<button class=${cx('island-card', a >= b && 'complete')} key=${i.name} onClick=${() => setUi('isl', { island: i.name })}>
            <div class="island-thumb"><img src=${islandIcon(i.name)} alt="" loading="lazy" onError=${(e) => (e.currentTarget.style.visibility = 'hidden')} />
              ${images[i.name] && html`<span class="plan-badge" title="Has an island plan"><${Icon} name="image" size=${12} /></span>`}</div>
            <div class="island-card-body">
              <strong>${i.name}</strong>
              <span class="muted small">${a}/${b} owned · ${pct(a, b)}%</span>
              <${Progress} value=${a} max=${b} />
              ${wubs.length > 0 && html`<span class="wub-mini">${wubs.map((w) => html`<span class=${cx('rar-' + w.type, w.n >= w.required && 'full')} title=${w.type + ' Wubbox'}>${w.n}/${w.required}</span>`)}</span>`}
            </div>
          </button>`;
        })}</div>`;
    })}`)}
  </section>`;
}
