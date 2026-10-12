// Wubbox requirements: the monsters each Wubbox needs boxed, per island.
// common / rare / epic = the three Wubbox types. Names must match monsters.js exactly.
// rareCount (optional) = only this many from the rare list are needed (Wublin Island).

MSM.wubbox = {
  "Plant Island": {
    common: ["Potbelly", "Noggin", "Toe Jammer", "Mammott", "Shrubb", "Oaktopus", "Furcorn", "Fwog", "Drumpler", "Maw", "Pummel", "Clamble", "Bowgart", "T-Rox", "Entbrat"],
    rare: ["Rare Potbelly", "Rare Noggin", "Rare Toe Jammer", "Rare Mammott", "Rare Shrubb", "Rare Oaktopus", "Rare Furcorn", "Rare Fwog", "Rare Drumpler", "Rare Maw", "Rare Pummel", "Rare Clamble", "Rare Bowgart", "Rare T-Rox", "Rare Entbrat"],
    epic: ["Epic Potbelly", "Epic Noggin", "Epic Toe Jammer", "Epic Mammott", "Epic Shrubb", "Epic Oaktopus", "Epic Furcorn", "Epic Fwog", "Epic Drumpler", "Epic Maw", "Epic Pummel", "Epic Clamble", "Epic Bowgart", "Epic T-Rox", "Epic Entbrat"],
  },
  "Cold Island": {
    common: ["Tweedle", "Potbelly", "Toe Jammer", "Mammott", "Dandidoo", "Quibble", "Pango", "Oaktopus", "Furcorn", "Maw", "Spunge", "Thumpies", "Congle", "Bowgart", "Deedge"],
    rare: ["Rare Tweedle", "Rare Potbelly", "Rare Toe Jammer", "Rare Mammott", "Rare Dandidoo", "Rare Quibble", "Rare Pango", "Rare Oaktopus", "Rare Furcorn", "Rare Maw", "Rare Spunge", "Rare Thumpies", "Rare Congle", "Rare Bowgart", "Rare Deedge"],
    epic: ["Epic Tweedle", "Epic Potbelly", "Epic Toe Jammer", "Epic Mammott", "Epic Dandidoo", "Epic Quibble", "Epic Pango", "Epic Oaktopus", "Epic Furcorn", "Epic Maw", "Epic Spunge", "Epic Thumpies", "Epic Congle", "Epic Bowgart", "Epic Deedge"],
  },
  "Air Island": {
    common: ["Tweedle", "Noggin", "Toe Jammer", "Mammott", "Cybop", "Quibble", "Pango", "Fwog", "Drumpler", "Maw", "Scups", "PomPom", "Congle", "T-Rox", "Riff"],
    rare: ["Rare Tweedle", "Rare Noggin", "Rare Toe Jammer", "Rare Mammott", "Rare Cybop", "Rare Quibble", "Rare Pango", "Rare Fwog", "Rare Drumpler", "Rare Maw", "Rare Scups", "Rare PomPom", "Rare Congle", "Rare T-Rox", "Rare Riff"],
    epic: ["Epic Tweedle", "Epic Noggin", "Epic Toe Jammer", "Epic Mammott", "Epic Cybop", "Epic Quibble", "Epic Pango", "Epic Fwog", "Epic Drumpler", "Epic Maw", "Epic Scups", "Epic PomPom", "Epic Congle", "Epic T-Rox", "Epic Riff"],
  },
  "Water Island": {
    common: ["Tweedle", "Potbelly", "Noggin", "Toe Jammer", "Dandidoo", "Cybop", "Quibble", "Shrubb", "Oaktopus", "Fwog", "Reedling", "Spunge", "Scups", "Pummel", "Shellbeat"],
    rare: ["Rare Tweedle", "Rare Potbelly", "Rare Noggin", "Rare Toe Jammer", "Rare Dandidoo", "Rare Cybop", "Rare Quibble", "Rare Shrubb", "Rare Oaktopus", "Rare Fwog", "Rare Reedling", "Rare Spunge", "Rare Scups", "Rare Pummel", "Rare Shellbeat"],
    epic: ["Epic Tweedle", "Epic Potbelly", "Epic Noggin", "Epic Toe Jammer", "Epic Dandidoo", "Epic Cybop", "Epic Quibble", "Epic Shrubb", "Epic Oaktopus", "Epic Fwog", "Epic Reedling", "Epic Spunge", "Epic Scups", "Epic Pummel", "Epic Shellbeat"],
  },
  "Earth Island": {
    common: ["Tweedle", "Potbelly", "Noggin", "Mammott", "Dandidoo", "Cybop", "Pango", "Shrubb", "Furcorn", "Drumpler", "Reedling", "Thumpies", "PomPom", "Clamble", "Quarrister"],
    rare: ["Rare Tweedle", "Rare Potbelly", "Rare Noggin", "Rare Mammott", "Rare Dandidoo", "Rare Cybop", "Rare Pango", "Rare Shrubb", "Rare Furcorn", "Rare Drumpler", "Rare Reedling", "Rare Thumpies", "Rare PomPom", "Rare Clamble", "Rare Quarrister"],
    epic: ["Epic Tweedle", "Epic Potbelly", "Epic Noggin", "Epic Mammott", "Epic Dandidoo", "Epic Cybop", "Epic Pango", "Epic Shrubb", "Epic Furcorn", "Epic Drumpler", "Epic Reedling", "Epic Thumpies", "Epic PomPom", "Epic Clamble", "Epic Quarrister"],
  },
  "Fire Haven": {
    common: ["Tweedle", "Potbelly", "Noggin", "Kayna", "Dandidoo", "Cybop", "Glowl", "Shrubb", "Flowah", "Stogg", "Reedling", "Barrb", "Floogull", "Repatillo", "Tring"],
    rare: ["Rare Tweedle", "Rare Potbelly", "Rare Noggin", "Rare Kayna", "Rare Dandidoo", "Rare Cybop", "Rare Glowl", "Rare Shrubb", "Rare Flowah", "Rare Stogg", "Rare Reedling", "Rare Barrb", "Rare Floogull", "Rare Repatillo", "Rare Tring"],
    epic: ["Epic Tweedle", "Epic Potbelly", "Epic Noggin", "Epic Kayna", "Epic Dandidoo", "Epic Cybop", "Epic Glowl", "Epic Shrubb", "Epic Flowah", "Epic Stogg", "Epic Reedling", "Epic Barrb", "Epic Floogull", "Epic Repatillo", "Epic Tring"],
  },
  "Fire Oasis": {
    common: ["Tweedle", "Toe Jammer", "Mammott", "Kayna", "Quibble", "Pango", "Glowl", "Maw", "Phangler", "Boskus", "Congle", "Whaddle", "Woolabee", "Wynq", "Sneyser"],
    rare: ["Rare Tweedle", "Rare Toe Jammer", "Rare Mammott", "Rare Kayna", "Rare Quibble", "Rare Pango", "Rare Glowl", "Rare Maw", "Rare Phangler", "Rare Boskus", "Rare Congle", "Rare Whaddle", "Rare Woolabee", "Rare Wynq", "Rare Sneyser"],
    epic: ["Epic Tweedle", "Epic Toe Jammer", "Epic Mammott", "Epic Kayna", "Epic Quibble", "Epic Pango", "Epic Glowl", "Epic Maw", "Epic Phangler", "Epic Boskus", "Epic Congle", "Epic Whaddle", "Epic Woolabee", "Epic Wynq", "Epic Sneyser"],
  },
  "Ethereal Island": {
    common: ["Ghazt", "Grumpyre", "Reebro", "Jeeode", "Humbug", "Whisp", "Nebulob", "Sox", "Jellbilly", "Arackulele", "Boodoo", "Kazilleon", "Bellowfish", "Dragong", "Fung Pray"],
    rare: ["Rare Ghazt", "Rare Grumpyre", "Rare Reebro", "Rare Jeeode", "Rare Humbug", "Rare Whisp", "Rare Nebulob", "Rare Sox", "Rare Jellbilly", "Rare Arackulele", "Rare Boodoo", "Rare Kazilleon", "Rare Bellowfish", "Rare Dragong", "Rare Fung Pray"],
    epic: ["Epic Ghazt", "Epic Grumpyre", "Epic Reebro", "Epic Jeeode", "Epic Humbug", "Epic Whisp", "Epic Nebulob", "Epic Sox", "Epic Jellbilly", "Epic Arackulele", "Epic Boodoo", "Epic Kazilleon", "Epic Bellowfish", "Epic Dragong", "Epic Fung Pray"],
  },
  "Mirror Plant Island": {
    common: ["Potbelly", "Noggin", "Toe Jammer", "Mammott", "Shrubb", "Oaktopus", "Furcorn", "Fwog", "Drumpler", "Maw", "Pummel", "Clamble", "Bowgart", "T-Rox", "Entbrat"],
    rare: ["Rare Potbelly", "Rare Noggin", "Rare Toe Jammer", "Rare Mammott", "Rare Shrubb", "Rare Oaktopus", "Rare Furcorn", "Rare Fwog", "Rare Drumpler", "Rare Maw", "Rare Pummel", "Rare Clamble", "Rare Bowgart", "Rare T-Rox", "Rare Entbrat"],
    epic: ["Epic Potbelly", "Epic Noggin", "Epic Toe Jammer", "Epic Mammott", "Epic Shrubb", "Epic Oaktopus", "Epic Furcorn", "Epic Fwog", "Epic Drumpler", "Epic Maw", "Epic Pummel", "Epic Clamble", "Epic Bowgart", "Epic T-Rox", "Epic Entbrat"],
  },
  "Mirror Cold Island": {
    common: ["Tweedle", "Potbelly", "Toe Jammer", "Mammott", "Dandidoo", "Quibble", "Pango", "Oaktopus", "Furcorn", "Maw", "Spunge", "Thumpies", "Congle", "Bowgart", "Deedge"],
    rare: ["Rare Tweedle", "Rare Potbelly", "Rare Toe Jammer", "Rare Mammott", "Rare Dandidoo", "Rare Quibble", "Rare Pango", "Rare Oaktopus", "Rare Furcorn", "Rare Maw", "Rare Spunge", "Rare Thumpies", "Rare Congle", "Rare Bowgart", "Rare Deedge"],
    epic: ["Epic Tweedle", "Epic Potbelly", "Epic Toe Jammer", "Epic Mammott", "Epic Dandidoo", "Epic Quibble", "Epic Pango", "Epic Oaktopus", "Epic Furcorn", "Epic Maw", "Epic Spunge", "Epic Thumpies", "Epic Congle", "Epic Bowgart", "Epic Deedge"],
  },
  "Mirror Air Island": {
    common: ["Tweedle", "Noggin", "Toe Jammer", "Mammott", "Cybop", "Quibble", "Pango", "Fwog", "Drumpler", "Maw", "Scups", "PomPom", "Congle", "T-Rox", "Riff"],
    rare: ["Rare Tweedle", "Rare Noggin", "Rare Toe Jammer", "Rare Mammott", "Rare Cybop", "Rare Quibble", "Rare Pango", "Rare Fwog", "Rare Drumpler", "Rare Maw", "Rare Scups", "Rare PomPom", "Rare Congle", "Rare T-Rox", "Rare Riff"],
    epic: ["Epic Tweedle", "Epic Noggin", "Epic Toe Jammer", "Epic Mammott", "Epic Cybop", "Epic Quibble", "Epic Pango", "Epic Fwog", "Epic Drumpler", "Epic Maw", "Epic Scups", "Epic PomPom", "Epic Congle", "Epic T-Rox", "Epic Riff"],
  },
  "Mirror Water Island": {
    common: ["Tweedle", "Potbelly", "Noggin", "Toe Jammer", "Dandidoo", "Cybop", "Quibble", "Shrubb", "Oaktopus", "Fwog", "Reedling", "Spunge", "Scups", "Pummel", "Shellbeat"],
    rare: ["Rare Tweedle", "Rare Potbelly", "Rare Noggin", "Rare Toe Jammer", "Rare Dandidoo", "Rare Cybop", "Rare Quibble", "Rare Shrubb", "Rare Oaktopus", "Rare Fwog", "Rare Reedling", "Rare Spunge", "Rare Scups", "Rare Pummel", "Rare Shellbeat"],
    epic: ["Epic Tweedle", "Epic Potbelly", "Epic Noggin", "Epic Toe Jammer", "Epic Dandidoo", "Epic Cybop", "Epic Quibble", "Epic Shrubb", "Epic Oaktopus", "Epic Fwog", "Epic Reedling", "Epic Spunge", "Epic Scups", "Epic Pummel", "Epic Shellbeat"],
  },
  "Mirror Earth Island": {
    common: ["Tweedle", "Potbelly", "Noggin", "Mammott", "Dandidoo", "Cybop", "Pango", "Shrubb", "Furcorn", "Drumpler", "Reedling", "Thumpies", "PomPom", "Clamble", "Quarrister"],
    rare: ["Rare Tweedle", "Rare Potbelly", "Rare Noggin", "Rare Mammott", "Rare Dandidoo", "Rare Cybop", "Rare Pango", "Rare Shrubb", "Rare Furcorn", "Rare Drumpler", "Rare Reedling", "Rare Thumpies", "Rare PomPom", "Rare Clamble", "Rare Quarrister"],
    epic: ["Epic Tweedle", "Epic Potbelly", "Epic Noggin", "Epic Mammott", "Epic Dandidoo", "Epic Cybop", "Epic Pango", "Epic Shrubb", "Epic Furcorn", "Epic Drumpler", "Epic Reedling", "Epic Thumpies", "Epic PomPom", "Epic Clamble", "Epic Quarrister"],
  },
  "Gold Island": {
    common: ["Potbelly", "Oaktopus", "Furcorn", "Reedling", "Spunge", "Entbrat", "Mammott", "Pango", "Maw", "Thumpies", "Clamble", "Deedge", "Tweedle", "Dandidoo", "Cybop", "PomPom", "Scups", "Riff", "Toe Jammer", "Quibble", "Fwog", "Congle", "Bowgart", "Shellbeat", "Noggin", "Shrubb", "Drumpler", "Pummel", "T-Rox", "Quarrister"],
    rare: ["Rare Potbelly", "Rare Oaktopus", "Rare Furcorn", "Rare Reedling", "Rare Spunge", "Rare Entbrat", "Rare Mammott", "Rare Pango", "Rare Maw", "Rare Thumpies", "Rare Clamble", "Rare Deedge", "Rare Tweedle", "Rare Dandidoo", "Rare Cybop", "Rare PomPom", "Rare Scups", "Rare Riff", "Rare Toe Jammer", "Rare Quibble", "Rare Fwog", "Rare Congle", "Rare Bowgart", "Rare Shellbeat", "Rare Noggin", "Rare Shrubb", "Rare Drumpler", "Rare Pummel", "Rare T-Rox", "Rare Quarrister"],
    epic: ["Epic Potbelly", "Epic Oaktopus", "Epic Furcorn", "Epic Reedling", "Epic Spunge", "Epic Entbrat", "Epic Mammott", "Epic Pango", "Epic Maw", "Epic Thumpies", "Epic Clamble", "Epic Deedge", "Epic Tweedle", "Epic Dandidoo", "Epic Cybop", "Epic PomPom", "Epic Scups", "Epic Riff", "Epic Toe Jammer", "Epic Quibble", "Epic Fwog", "Epic Congle", "Epic Bowgart", "Epic Shellbeat", "Epic Noggin", "Epic Shrubb", "Epic Drumpler", "Epic Pummel", "Epic T-Rox", "Epic Quarrister"],
  },
  "Wublin Island": {
    common: ["Brump", "Zynth", "Poewk", "Thwok", "Dwumrohl", "Zuuker", "Screemu", "Tympa", "Dermit", "Gheegur", "Whajje", "Creepuscule", "Blipsqueak", "Scargo", "Astropod", "Pixolotl", "Bona-Petite", "Maulch", "Fleechwurm"],
    rare: ["Rare Brump", "Rare Zynth", "Rare Poewk", "Rare Thwok", "Rare Dwumrohl", "Rare Zuuker", "Rare Screemu", "Rare Tympa", "Rare Dermit", "Rare Gheegur", "Rare Whajje", "Rare Creepuscule", "Rare Blipsqueak", "Rare Scargo", "Rare Astropod", "Rare Pixolotl", "Rare Bona-Petite", "Rare Maulch", "Rare Fleechwurm"],
    rareCount: 10,
  },
};
