// Islands
// The order here is the order islands appear in the app.
//
//   name           must match the island names used in monsters.js
//   group          sidebar section: "Natural" | "Fire" | "Magical" | "Special" | "Zapping"
//                  "Other" | "Mirror" | "Islet"
//   elements       optional - the elements that can be bred on this island (used by the Breed Sim)
//   teleportLevel  optional - player level needed to teleport monsters here
//   teleportName   optional - what the game calls teleporting here (default "Teleport")

window.MSM = window.MSM || {};

MSM.islands = [
  { name: "Plant Island",               group: "Natural", elements: ["Plant", "Cold", "Water", "Earth"] },
  { name: "Cold Island",                group: "Natural", elements: ["Air", "Plant", "Water", "Cold"] },
  { name: "Air Island",                 group: "Natural", elements: ["Air", "Earth", "Water", "Cold"] },
  { name: "Water Island",               group: "Natural", elements: ["Air", "Plant", "Earth", "Water"] },
  { name: "Earth Island",               group: "Natural", elements: ["Air", "Plant", "Earth", "Cold"] },
  { name: "Fire Haven",                 group: "Fire",    elements: ["Air", "Plant", "Earth", "Fire"] },
  { name: "Fire Oasis",                 group: "Fire",    elements: ["Air", "Water", "Cold", "Fire"] },
  { name: "Light Island",               group: "Magical", elements: ["Plant", "Cold", "Fire", "Light"] },
  { name: "Psychic Island",             group: "Magical", elements: ["Plant", "Water", "Fire", "Psychic"] },
  { name: "Faerie Island",              group: "Magical", elements: ["Earth", "Cold", "Fire", "Faerie"] },
  { name: "Bone Island",                group: "Magical", elements: ["Earth", "Water", "Fire", "Bone"] },
  { name: "Shugabush Island",           group: "Special", teleportLevel: 15 },
  { name: "bbli$zard Island",           group: "Special" },
  { name: "Ethereal Island",            group: "Special", teleportLevel: 15, elements: ["Plasma", "Shadow", "Mech", "Crystal", "Poison"] },
  { name: "Mythical Island",            group: "Special", teleportLevel: 15 },
  { name: "Magical Sanctum",            group: "Special", teleportLevel: 15, elements: ["Psychic", "Bone", "Light", "Faerie"] },
  { name: "Seasonal Shanty",            group: "Special", teleportLevel: 15 },
  { name: "Amber Island",               group: "Zapping" },
  { name: "Wublin Island",              group: "Zapping" },
  { name: "Celestial Island",           group: "Zapping" },
  { name: "Colossingum",                group: "Other", teleportLevel: 5 },
  { name: "Gold Island",                group: "Other", teleportLevel: 15 },
  { name: "Ethereal Workshop",          group: "Other" },
  { name: "Magical Nexus",              group: "Other", teleportLevel: 18, teleportName: "Transpose" },
  { name: "Major Paironormal Carnival", group: "Special", teleportLevel: 18, elements: ["Control", "Hoax", "Ruin", "Depths"] },
  { name: "Mirror Plant Island",        group: "Mirror",  elements: ["Plant", "Cold", "Water", "Earth"] },
  { name: "Mirror Cold Island",         group: "Mirror",  elements: ["Air", "Plant", "Water", "Cold"] },
  { name: "Mirror Air Island",          group: "Mirror",  elements: ["Air", "Earth", "Water", "Cold"] },
  { name: "Mirror Water Island",        group: "Mirror",  elements: ["Air", "Plant", "Earth", "Water"] },
  { name: "Mirror Earth Island",        group: "Mirror",  elements: ["Air", "Plant", "Earth", "Cold"] },
  { name: "Mirror Light Island",        group: "Mirror",  elements: ["Plant", "Cold", "Fire", "Light"] },
  { name: "Mirror Psychic Island",      group: "Mirror",  elements: ["Plant", "Water", "Fire", "Psychic"] },
  { name: "Mirror Faerie Island",       group: "Mirror",  elements: ["Earth", "Cold", "Fire", "Faerie"] },
  { name: "Mirror Bone Island",         group: "Mirror",  elements: ["Earth", "Water", "Fire", "Bone"] },
  { name: "Minor Paironormal Carnival", group: "Special" },
  { name: "Plasma Islet",               group: "Islet" },
  { name: "Mech Islet",                 group: "Islet" },
  { name: "Shadow Islet",               group: "Islet" },
  { name: "Crystal Islet",              group: "Islet" },
];
