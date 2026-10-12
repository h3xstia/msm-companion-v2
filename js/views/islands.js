import { html, useState } from '../lib.js';
import { islands, islandByName, GROUPS, wubbox, wubboxList, wubboxKey, WUBBOX_TYPES, onIsland } from '../data.js';
import { cx, pct, plural, islandIconSrc } from '../util.js';
import { save, ui, setUi, toast } from '../store.js';
import { islandCount } from './collection.js';
import { Icon, Progress, Empty } from '../ui.js';

const IMG_PREFIX = 'msm2:img:';
export const getIslandImage = (name) => { try { return localStorage.getItem(IMG_PREFIX + name); } catch { return null; } };
export function setIslandImage(name, dataUrl) {
  try {
    if (dataUrl) localStorage.setItem(IMG_PREFIX + name, dataUrl); else localStorage.removeItem(IMG_PREFIX + name);
    return true;
  } catch { return false; }
}
export function allIslandImages() {
  const out = {};
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k.startsWith(IMG_PREFIX)) out[k.slice(IMG_PREFIX.length)] = localStorage.getItem(k);
    }
  } catch { /* ignore */ }
  return out;
}

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
  const [, bump] = useState(0);
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
        let data = await compress(f);
        if (!setIslandImage(name, data)) data = await compress(f, 1280, 0.7);
        if (!setIslandImage(name, data)) throw new Error('too large');
        bump((x) => x + 1);
      } catch { toast("Couldn't save that image, try a smaller one", { tone: 'error' }); }
    };
    inp.click();
  };
  return html`<section class="pane">
    <button class="btn ghost sm back" onClick=${() => setUi('isl', { island: '' })}><${Icon} name="chevron" class="flip" size=${16} />All islands</button>
    <header class="pane-head"><img class="island-icon-lg" src=${islandIconSrc(name)} alt="" onError=${(e) => (e.currentTarget.style.display = 'none')} /><div class="grow"><h1>${name}</h1>
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
        <button class="btn ghost sm danger" onClick=${() => { setIslandImage(name, null); bump((x) => x + 1); }}><${Icon} name="trash" size=${14} />Remove</button></div>`}</div>
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
    ${GROUPS.map((g) => {
      const list = islands.filter((i) => i.group === g && onIsland.get(i.name)?.length);
      if (!list.length) return null;
      return html`<div class="section-head"><h2>${g}</h2></div>
        <div class="island-grid">${list.map((i) => {
          const [a, b] = islandCount(i.name);
          const wubs = wubboxSummary(i.name);
          return html`<button class=${cx('island-card', a >= b && 'complete')} key=${i.name} onClick=${() => setUi('isl', { island: i.name })}>
            <div class="island-thumb"><img src=${islandIconSrc(i.name)} alt="" loading="lazy" onError=${(e) => (e.currentTarget.style.visibility = 'hidden')} />
              ${images[i.name] && html`<span class="plan-badge" title="Has an island plan"><${Icon} name="image" size=${12} /></span>`}</div>
            <div class="island-card-body">
              <strong>${i.name}</strong>
              <span class="muted small">${a}/${b} owned · ${pct(a, b)}%</span>
              <${Progress} value=${a} max=${b} />
              ${wubs.length > 0 && html`<span class="wub-mini">${wubs.map((w) => html`<span class=${cx('rar-' + w.type, w.n >= w.required && 'full')} title=${w.type + ' Wubbox'}>${w.n}/${w.required}</span>`)}</span>`}
            </div>
          </button>`;
        })}</div>`;
    })}
  </section>`;
}
