import { html, useEffect, useRef } from './lib.js';
import { islands, GROUPS, RARITIES, isWildcard, wildcardElement, byName } from './data.js';
import { portraitSrc, elementSrc, islandIconSrc, cx, pct } from './util.js';
import { toasts, dismissToast, openDetail, isAvailable, zapNeedsFor, wubNeedsFor } from './store.js';

const PATHS = {
  collection: 'M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z',
  breed: 'M12 21c-4 0-7-3-7-7.5S8.5 3 12 3s7 6 7 10.5S16 21 12 21z',
  available: 'M12 7v5l3 2M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z',
  database: 'M4 6c0-1.7 3.6-3 8-3s8 1.3 8 3-3.6 3-8 3-8-1.3-8-3zM4 6v6c0 1.7 3.6 3 8 3s8-1.3 8-3V6M4 12v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6',
  zap: 'M13 2 4 14h7l-1 8 9-12h-7z',
  wubbox: 'M3 7.5 12 3l9 4.5v9L12 21l-9-4.5zM3 7.5 12 12l9-4.5M12 12v9',
  islands: 'M3 18c3-2 6-2 9 0s6 2 9 0M5 15c1-5 4-8 7-8s6 3 7 8M12 7V3m0 0 3 2',
  settings: 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z',
  search: 'M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM21 21l-4.3-4.3',
  close: 'M18 6 6 18M6 6l12 12',
  check: 'M20 6 9 17l-5-5',
  plus: 'M12 5v14M5 12h14',
  minus: 'M5 12h14',
  swap: 'M7 4 3 8l4 4M3 8h14M17 20l4-4-4-4M21 16H7',
  trash: 'M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6',
  edit: 'M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z',
  sync: 'M21 12a9 9 0 0 1-15.5 6.2L3 16M3 12a9 9 0 0 1 15.5-6.2L21 8M21 3v5h-5M3 21v-5h5',
  upload: 'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12',
  download: 'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3',
  grip: 'M9 6h.01M9 12h.01M9 18h.01M15 6h.01M15 12h.01M15 18h.01',
  chevron: 'm9 18 6-6-6-6',
  down: 'm6 9 6 6 6-6',
  up: 'm18 15-6-6-6 6',
  info: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 16v-4M12 8h.01',
  external: 'M15 3h6v6M10 14 21 3M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6',
  sun: 'M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10zM12 1v2M12 21v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M1 12h2M21 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4',
  moon: 'M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z',
  more: 'M5 12h.01M12 12h.01M19 12h.01',
  image: 'M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2zM8.5 10a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zM21 15l-5-5L5 21',
  sparkle: 'M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z',
  user: 'M20 21a8 8 0 0 0-16 0M12 13a4 4 0 1 0 0-8 4 4 0 0 0 0 8z',
  fast: 'M13 19l7-7-7-7M5 19l7-7-7-7',
  egg: 'M12 21c-4 0-7-3-7-7.5S8.5 3 12 3s7 6 7 10.5S16 21 12 21z',
};

export const Icon = ({ name, size = 18, class: c }) => html`
  <svg class=${cx('icon', c)} width=${size} height=${size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
    stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d=${PATHS[name]} /></svg>`;

export const MonImg = ({ m, island, size = 48 }) => html`
  <img class="mon-img" src=${portraitSrc(m, island)} width=${size} height=${size} loading="lazy" decoding="async" alt=""
    onError=${(e) => e.currentTarget.classList.add('missing')} />`;

export const ElemIcons = ({ list, size = 16, max = 6 }) => html`
  <span class="elems">${list.slice(0, max).map((el) => html`
    <img src=${elementSrc(el)} width=${size} height=${size} alt=${el} title=${el} loading="lazy"
      onError=${(e) => (e.currentTarget.style.visibility = 'hidden')} />`)}</span>`;

export const Times = ({ t, skin }) => t && html`<span class="times">
  <span class="t-normal" title=${skin ? 'Breeding time (with island skin)' : 'Breeding time'}>${t.time}</span>
  <span class="t-enh" title="Enhanced breeding time"><${Icon} name="fast" size=${12} />${t.enhanced}</span>
  ${skin && html`<span class="t-skin" title="Island skin: 10% faster"><${Icon} name="sparkle" size=${12} /></span>`}</span>`;

export const Rarity = ({ r }) => html`<span class=${'rar rar-' + r.toLowerCase()}>${r}</span>`;

export function TokenImg({ token, island, size = 28 }) {
  const m = byName.get(token);
  if (m) return html`<${MonImg} m=${m} island=${island} size=${size} />`;
  const el = isWildcard(token) && wildcardElement(token);
  if (el) return html`<img class="token-img" src=${elementSrc(el)} width=${size} height=${size} alt="" />`;
  return html`<span class="token-img any" style=${{ width: size, height: size }}>?</span>`;
}

export const MonLink = ({ name, island, children }) => html`
  <button class="link" onClick=${(e) => { e.stopPropagation(); openDetail(name, island); }}>${children || name}</button>`;

// one zap tag: names the target if there's only one, otherwise the total still needed
export function StatusTags({ m, island }) {
  const avail = isAvailable(m.name);
  const zaps = zapNeedsFor(m.name);
  const wubs = wubNeedsFor(m.name).filter((w) => !island || w.island === island);
  if (!avail && !zaps.length && !wubs.length) return null;
  const zapTotal = zaps.reduce((n, z) => n + z.still, 0);
  const zapTitle = ['Needed for zapping:', ...zaps.map((z) => `${z.zap.monster} (${z.zap.island}): ${z.still}`)].join('\n');
  return html`<span class="tags">
    ${avail && html`<span class="tag tag-avail">Available</span>`}
    ${zaps.length > 0 && html`<span class="tag tag-zap" title=${zapTitle}>
      ${zaps.length === 1 ? `${zaps[0].zap.monster} ×${zapTotal}` : `Zap ×${zapTotal}`}</span>`}
    ${wubs.length > 0 && html`<span class="tag tag-wub" title=${wubs.map((w) => `${w.island} (${w.type})`).join(', ')}>
      ${'Wubbox' + (wubs.length > 1 ? ' ×' + wubs.length : '')}</span>`}
  </span>`;
}

export const IslandIcon = ({ name, size = 22 }) => html`<img class="isl-ico" src=${islandIconSrc(name)} alt="" loading="lazy"
  style=${{ width: Math.round(size * 4 / 3), height: size }} onError=${(e) => (e.currentTarget.style.visibility = 'hidden')} />`;

export const Progress = ({ value, max, tone }) => {
  const p = Math.min(100, pct(value, max));
  return html`<div class=${cx('progress', tone, p >= 100 && 'done')} role="progressbar" aria-valuenow=${p} aria-valuemin="0" aria-valuemax="100">
    <span style=${{ width: p + '%' }}></span></div>`;
};

export const Empty = ({ icon = 'sparkle', title, children }) => html`
  <div class="empty"><${Icon} name=${icon} size=${28} /><strong>${title}</strong>${children && html`<p>${children}</p>`}</div>`;

export const Chip = ({ on, onClick, children, tone }) => html`
  <button class=${cx('chip', on && 'on', tone)} aria-pressed=${!!on} onClick=${onClick}>${children}</button>`;

export function Segmented({ value, options, onChange }) {
  return html`<div class="segmented" role="tablist">
    ${options.map(([v, label]) => html`<button role="tab" aria-selected=${value === v} class=${value === v ? 'on' : ''}
      onClick=${() => onChange(v)}>${label}</button>`)}</div>`;
}

export function RarityChips({ value, onChange, present = RARITIES }) {
  return html`<div class="chips">${RARITIES.filter((r) => present.includes(r)).map((r) => html`
    <${Chip} on=${value === r} tone=${'rar-' + r.toLowerCase()} onClick=${() => onChange(value === r ? '' : r)}>${r}<//>`)}</div>`;
}

export function SearchBox({ value, onInput, placeholder = 'Search…', autofocus }) {
  return html`<label class="search">
    <${Icon} name="search" size=${16} />
    <input type="search" value=${value} placeholder=${placeholder} autofocus=${autofocus}
      onInput=${(e) => onInput(e.currentTarget.value)} />
    ${value && html`<button class="icon-btn sm" aria-label="Clear" onClick=${() => onInput('')}><${Icon} name="close" size=${14} /></button>`}
  </label>`;
}

// count(island) returns [done, total], or null to hide that island
export function IslandPicker({ value, onChange, count }) {
  const groups = GROUPS.map((g) => [g, islands.filter((i) => i.group === g && count(i.name))]).filter(([, l]) => l.length);
  return html`
    <select class="island-select" value=${value} onChange=${(e) => onChange(e.currentTarget.value)} aria-label="Island">
      ${groups.map(([g, list]) => html`<optgroup label=${g}>${list.map((i) => {
        const [a, b] = count(i.name);
        return html`<option value=${i.name}>${i.name} (${a}/${b})</option>`;
      })}</optgroup>`)}
    </select>
    <nav class="island-list" aria-label="Islands">
      ${groups.map(([g, list]) => html`
        <div class="island-group">${g}</div>
        ${list.map((i) => {
          const [a, b] = count(i.name);
          return html`<button class=${cx('island-item', value === i.name && 'on', a >= b && 'complete')} onClick=${() => onChange(i.name)}>
            <span class="isl-name"><${IslandIcon} name=${i.name} />${i.name}</span><span class="count">${a}/${b}</span></button>`;
        })}`)}
    </nav>`;
}

export function Dialog({ open, onClose, title, children, wide, footer }) {
  const ref = useRef();
  useEffect(() => {
    const d = ref.current;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);
  return html`<dialog ref=${ref} class=${cx('dialog', wide && 'wide')} onClose=${onClose}
    onClick=${(e) => e.target === ref.current && onClose()}>
    ${open && html`
      <header><h2>${title}</h2>
        <button class="icon-btn" aria-label="Close" onClick=${onClose}><${Icon} name="close" /></button></header>
      <div class="dialog-body">${children}</div>
      ${footer && html`<footer>${footer}</footer>`}`}
  </dialog>`;
}

export function Toasts() {
  return html`<div class="toasts" aria-live="polite">${toasts.map((t) => html`
    <div class=${cx('toast', t.tone)} key=${t.id}>
      <span>${t.text}</span>
      ${t.action && html`<button onClick=${() => { t.onAction(); dismissToast(t.id); }}>${t.action}</button>`}
      <button class="icon-btn sm" aria-label="Dismiss" onClick=${() => dismissToast(t.id)}><${Icon} name="close" size=${14} /></button>
    </div>`)}</div>`;
}

export function Stepper({ value, max, onChange, label }) {
  const set = (v) => onChange(Math.max(0, Math.min(max ?? 9999, v)));
  return html`<div class="stepper" aria-label=${label}>
    <button aria-label=${'Less ' + label} disabled=${value <= 0} onClick=${() => set(value - 1)}><${Icon} name="minus" size=${14} /></button>
    <input type="number" inputmode="numeric" min="0" max=${max} value=${value}
      onChange=${(e) => set(parseInt(e.currentTarget.value, 10) || 0)} />
    <button aria-label=${'More ' + label} disabled=${max != null && value >= max} onClick=${() => set(value + 1)}><${Icon} name="plus" size=${14} /></button>
  </div>`;
}
