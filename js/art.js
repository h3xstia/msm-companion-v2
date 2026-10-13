// island icons and backgrounds, switching to the seasonal version when that island's skin is on
import { islandByName } from './data.js';
import { save } from './store.js';

const path = (p) => encodeURI(p).replace(/\$/g, '%24');

export const skinName = (island) => islandByName.get(island)?.skin || null;
export const skinOn = (island) => !!save.skins[island] && !!skinName(island);

function file(island) {
  const name = island.toLowerCase();
  return skinOn(island) ? `${name} (${skinName(island).toLowerCase()}).webp` : `${name}.webp`;
}

export const islandIcon = (island) => path('images/islands/' + file(island));
export const islandBg = (island) => path('images/islands/bg/' + file(island));
