
const UNIT = { d: 86400, h: 3600, m: 60, s: 1 };

export function parseTime(str) {
  if (!str) return 0;
  let total = 0;
  for (const [, v, u] of str.matchAll(/(\d+)\s*([dhms])/g)) total += Number(v) * UNIT[u];
  return total;
}

export function formatTime(secs) {
  secs = Math.max(0, Math.round(secs));
  const out = [];
  for (const [u, n] of Object.entries(UNIT)) {
    if (secs >= n) { out.push(Math.floor(secs / n) + u); secs %= n; }
  }
  return out.join(' ') || '0s';
}

// enhanced is 75% unless the data says otherwise
export function enhancedSecs(entry) {
  if (!entry.time) return 0;
  if (entry.enhanced) return parseTime(entry.enhanced);
  return Math.floor(parseTime(entry.time) * 0.75);
}

// island skins are 10% faster
export function entryTimes(entry, skin = false) {
  if (!entry || !entry.time) return null;
  const base = parseTime(entry.time);
  const enh = enhancedSecs(entry);
  if (!skin) return { time: formatTime(base), enhanced: formatTime(enh) };
  return { time: formatTime(base * 0.9), enhanced: formatTime(Math.max(0, enh - base * 0.1)) };
}

export function timeLeft(ms) {
  if (ms <= 0) return null;
  const d = Math.floor(ms / 86400000), h = Math.floor((ms % 86400000) / 3600000);
  if (d > 0) return d + 'd' + (h ? ' ' + h + 'h' : '');
  if (h > 0) return h + 'h';
  return Math.max(1, Math.ceil(ms / 60000)) + 'm';
}

export function urgency(until) {
  if (!until) return 'none';
  const ms = until - Date.now();
  if (ms <= 0) return 'expired';
  const days = ms / 86400000;
  return days <= 2 ? 'urgent' : days <= 5 ? 'soon' : 'ok';
}

// '10 Days' / 'End of Month' -> timestamp
export function suggestDeadline(limit) {
  if (!limit) return null;
  const m = limit.match(/^(\d+)\s*Days?$/i);
  if (m) return Date.now() + Number(m[1]) * 86400000;
  if (/end of month/i.test(limit)) {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth() + 1, 1).getTime();
  }
  return null;
}

const PORTRAITS = 'images/monster portrait squares/';

// epic wubbox looks different per island
const EPIC_WUBBOX = {
  'Plant Island': 'plant', 'Cold Island': 'cold', 'Air Island': 'air', 'Water Island': 'water',
  'Earth Island': 'earth', 'Fire Haven': 'haven', 'Fire Oasis': 'oasis', 'Ethereal Island': 'ethereal',
  'Gold Island': 'gold', 'Mirror Plant Island': 'plant', 'Mirror Cold Island': 'cold',
  'Mirror Air Island': 'air', 'Mirror Water Island': 'water', 'Mirror Earth Island': 'earth',
};

export function portraitFile(m, island) {
  if (m.img) return m.img;
  if (m.name === 'Epic Wubbox') return `wubbox - epic (${EPIC_WUBBOX[island] || 'plant'}).png`;
  const base = m.name.replace(/^(Rare|Epic|Adult)\s+/, '').replace(/'/g, '_').toLowerCase();
  const suffix = m.name.startsWith('Adult ') ? ' - adult'
    : m.rarity === 'Rare' ? ' - rare' : m.rarity === 'Epic' ? ' - epic' : '';
  return base + suffix + '.png';
}

export const portraitSrc = (m, island) => encodeURI(PORTRAITS + portraitFile(m, island)).replace(/\$/g, '%24');
export const elementSrc = (el) => encodeURI('images/elements/' + el.toLowerCase() + '.png');

export const plural = (n, word, many = word + 's') => `${n} ${n === 1 ? word : many}`;
export const cx = (...parts) => parts.filter(Boolean).join(' ');
export const pct = (a, b) => (b ? Math.round((a / b) * 100) : 0);

export function matches(name, query) {
  return !query || name.toLowerCase().includes(query.trim().toLowerCase());
}

export function debounce(fn, ms) {
  let t;
  return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
}

export function relTime(ts) {
  const mins = Math.round((Date.now() - ts) / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return mins + 'm ago';
  const h = Math.round(mins / 60);
  return h < 48 ? h + 'h ago' : Math.round(h / 24) + 'd ago';
}
