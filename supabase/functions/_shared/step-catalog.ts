export const STEP_ITEMS = [
  { id: "sword", type: "weapon", set: "Royal", effects: { xp: .10 } },
  { id: "axe", type: "weapon", set: "Goblin", effects: { coins: .15 } },
  { id: "dagger", type: "weapon", effects: { xp: .03 } },
  { id: "doomblade", type: "weapon", set: "Royal", effects: { xp: .10, coins: .05 } },
  { id: "helmet", type: "armor", set: "Royal", effects: { coins: .10 } },
  { id: "armor", type: "armor", set: "Goblin", effects: { coins: .05, xp: .05 } },
  { id: "cloak", type: "armor", effects: { xp: .10, rare: .05 } },
  { id: "cap", type: "armor", effects: { coins: .02 } },
  { id: "goblin", type: "companion", effects: { coins: .05 } },
  { id: "dragon", type: "companion", effects: { xp: .10 } },
  { id: "cat", type: "companion", effects: { coins: .10 } },
  { id: "demon", type: "companion", effects: { xp: .15 } },
] as const;

export const STEP_RELICS = [
  { id: "hinge_relic", rarity: "Common", effects: { xp: .01 } },
  { id: "mimic_eye", rarity: "Rare", effects: { rare: .01 } },
  { id: "gilded_tooth", rarity: "Rare", effects: { coins: .01 } },
  { id: "dragon_scale_relic", rarity: "Epic", effects: { xp: .02 } },
  { id: "royal_seal", rarity: "Epic", effects: { coins: .02 } },
  { id: "void_shard", rarity: "Legendary", effects: { coins: .02, xp: .02, rare: .02 } },
] as const;
