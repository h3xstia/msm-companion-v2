// Islands
// Grouped like the MSM wiki's Islands page. Timelines and groups show in the order they first appear here,
// and islands show in this order inside each group.
//
//   name           must match the island names used in monsters.js
//   timeline       optional - "Mirror" for mirror timeline islands (default is the main timeline)
//   group          the section the island is listed under (any name, e.g. "Natural", "Mirror Magical")
//   elements       optional - the elements that can be bred on this island (used by the Breed Sim)
//   teleportLevel  optional - player level needed to teleport monsters here
//   teleportName   optional - what the game calls teleporting here (default "Teleport")
//   skin           optional - seasonal island skin. Its art is images/islands/<island> (<skin>).webp (icon)
//                  and images/islands/bg/<island> (<skin>).webp (background), all lowercase
//   vesselsMonthly optional - vessels here rotate monthly, so an available vessel ends at the end of the month
//   hideInAvailable optional - don't show this island on the Available tab's island icons
//   alwaysRarities optional - rarities that can always be got here (evolve, synthesize, teleport),
//                  so they're never marked "Available" for this island and are left off the Available tab

window.MSM = window.MSM || {};

MSM.islands = [
  // main timeline
  { name: "Plant Island",               group: "Natural", skin: "Spooktacle", elements: ["Plant", "Cold", "Water", "Earth"] },
  { name: "Cold Island",                group: "Natural", skin: "Festival of Yay", elements: ["Air", "Plant", "Water", "Cold"] },
  { name: "Air Island",                 group: "Natural", skin: "Season of Love", elements: ["Air", "Earth", "Water", "Cold"] },
  { name: "Water Island",               group: "Natural", skin: "Eggs-Travaganza", elements: ["Air", "Plant", "Earth", "Water"] },
  { name: "Earth Island",               group: "Natural", skin: "SummerSong", elements: ["Air", "Plant", "Earth", "Cold"] },

  { name: "Shugabush Island",           group: "Legendary", teleportLevel: 15 },
  { name: "bbli$zard Island",           group: "Legendary" },

  { name: "Fire Haven",                 group: "Fire", skin: "Feast-Ember", elements: ["Air", "Plant", "Earth", "Fire"] },
  { name: "Fire Oasis",                 group: "Fire", skin: "Perplexplore", elements: ["Air", "Water", "Cold", "Fire"] },

  { name: "Light Island",               group: "Magical", skin: "SkyPainting", elements: ["Plant", "Cold", "Fire", "Light"] },
  { name: "Psychic Island",             group: "Magical", skin: "MindBoggle", elements: ["Plant", "Water", "Fire", "Psychic"] },
  { name: "Faerie Island",              group: "Magical", skin: "Cloverspell", elements: ["Earth", "Cold", "Fire", "Faerie"] },
  { name: "Bone Island",                group: "Magical", skin: "Beat Hereafter", elements: ["Earth", "Water", "Fire", "Bone"] },

  { name: "Ethereal Island",            group: "Teleporting/Transposing", skin: "Life-Formula", teleportLevel: 15, elements: ["Plasma", "Shadow", "Mech", "Crystal", "Poison"] },
  { name: "Mythical Island",            group: "Teleporting/Transposing", teleportLevel: 15, alwaysRarities: ["Common"] },
  { name: "Magical Sanctum",            group: "Teleporting/Transposing", skin: "Crescendo Moon", teleportLevel: 15, elements: ["Psychic", "Bone", "Light", "Faerie"] },
  { name: "Magical Nexus",              group: "Teleporting/Transposing", teleportLevel: 18, teleportName: "Transpose", hideInAvailable: true },
  { name: "Major Paironormal Carnival", group: "Teleporting/Transposing", teleportLevel: 18, elements: ["Control", "Hoax", "Ruin", "Depths"] },
  { name: "Seasonal Shanty",            group: "Teleporting/Transposing", teleportLevel: 15, alwaysRarities: ["Common"] },

  { name: "Amber Island",               group: "Zapping", skin: "Echoes of Eco", alwaysRarities: ["Rare", "Epic"], vesselsMonthly: true },
  { name: "Wublin Island",              group: "Zapping" },
  { name: "Celestial Island",           group: "Zapping" },

  { name: "Colossingum",                group: "Other", teleportLevel: 5 },
  { name: "Gold Island",                group: "Other", skin: "Anniversary Month", teleportLevel: 15, hideInAvailable: true },
  { name: "Ethereal Workshop",          group: "Other", alwaysRarities: ["Rare", "Epic"] },

  // mirror timeline
  { name: "Mirror Plant Island",        timeline: "Mirror", group: "Mirror Natural", elements: ["Plant", "Cold", "Water", "Earth"] },
  { name: "Mirror Cold Island",         timeline: "Mirror", group: "Mirror Natural", elements: ["Air", "Plant", "Water", "Cold"] },
  { name: "Mirror Air Island",          timeline: "Mirror", group: "Mirror Natural", elements: ["Air", "Earth", "Water", "Cold"] },
  { name: "Mirror Water Island",        timeline: "Mirror", group: "Mirror Natural", elements: ["Air", "Plant", "Earth", "Water"] },
  { name: "Mirror Earth Island",        timeline: "Mirror", group: "Mirror Natural", elements: ["Air", "Plant", "Earth", "Cold"] },

  { name: "Plasma Islet",               timeline: "Mirror", group: "Ethereal Islet" },
  { name: "Mech Islet",                 timeline: "Mirror", group: "Ethereal Islet" },
  { name: "Shadow Islet",               timeline: "Mirror", group: "Ethereal Islet" },
  { name: "Crystal Islet",              timeline: "Mirror", group: "Ethereal Islet" },

  { name: "Mirror Light Island",        timeline: "Mirror", group: "Mirror Magical", elements: ["Plant", "Cold", "Fire", "Light"] },
  { name: "Mirror Psychic Island",      timeline: "Mirror", group: "Mirror Magical", elements: ["Plant", "Water", "Fire", "Psychic"] },
  { name: "Mirror Faerie Island",       timeline: "Mirror", group: "Mirror Magical", elements: ["Earth", "Cold", "Fire", "Faerie"] },
  { name: "Mirror Bone Island",         timeline: "Mirror", group: "Mirror Magical", elements: ["Earth", "Water", "Fire", "Bone"] },

  { name: "Minor Paironormal Carnival", timeline: "Mirror", group: "Transposing" },
];
