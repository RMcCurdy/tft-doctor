/**
 * Bootstrap Comp Definitions for TFT Set 16
 *
 * These define the known comp archetypes used by the classifier in Pass 1
 * (carry-first lookup). Each definition specifies:
 * - The primary carry champion
 * - Required traits (with minimum tier)
 * - Optional traits that boost confidence
 *
 * This is bootstrapped manually from the current meta and should be
 * updated each patch. Over time, Pass 3 (new comp discovery) can
 * suggest new definitions automatically.
 */

import type { CompDefinition } from "./types";

export const SET_16_COMP_DEFINITIONS: CompDefinition[] = [
  // ── S Tier ──────────────────────────────────────────────────────────

  {
    id: "void-belveth",
    name: "Void Bel'Veth",
    primaryCarry: "TFT16_BelVeth",
    secondaryCarry: "TFT16_KaiSa",
    requiredTraits: { Void: 1, Slayer: 1 },
    optionalTraits: ["Bruiser", "Juggernaut"],
  },
  {
    id: "ionia-yone",
    name: "Ionia Slayer Yone",
    primaryCarry: "TFT16_Yone",
    requiredTraits: { Ionia: 1, Slayer: 1 },
    optionalTraits: ["Quickstriker", "Defender"],
  },
  {
    id: "targon-aphelios",
    name: "Targon Aphelios Carry",
    primaryCarry: "TFT16_Aphelios",
    requiredTraits: { Targon: 1 },
    optionalTraits: ["Longshot", "Invoker"],
  },

  // ── A Tier ──────────────────────────────────────────────────────────

  {
    id: "yordle-veigar",
    name: "6 Yordle Arcanists",
    primaryCarry: "TFT16_Veigar",
    requiredTraits: { Yordle: 1, Arcanist: 1 },
    optionalTraits: ["Defender", "Invoker"],
    requiresEmblem: "Yordle",
  },
  {
    id: "zaun-jinx",
    name: "Zaun Gunslingers",
    primaryCarry: "TFT16_Jinx",
    requiredTraits: { Zaun: 1, Gunslinger: 1 },
    optionalTraits: ["Piltover", "Juggernaut"],
  },
  {
    id: "demacia-garen",
    name: "Demacia Defenders",
    primaryCarry: "TFT16_Garen",
    secondaryCarry: "TFT16_Lux",
    requiredTraits: { Demacia: 1, Defender: 1 },
    optionalTraits: ["Invoker", "Arcanist"],
  },
  {
    id: "demacia-lux",
    name: "Demacia Lux Carry",
    primaryCarry: "TFT16_Lux",
    requiredTraits: { Demacia: 1, Arcanist: 1 },
    optionalTraits: ["Defender", "Invoker"],
  },
  {
    id: "shadow-isles-kalista",
    name: "Shadow Isles Kalista",
    primaryCarry: "TFT16_Kalista",
    requiredTraits: { "Shadow Isles": 1, Vanquisher: 1 },
    optionalTraits: ["Quickstriker", "Warden"],
  },

  // ── B Tier ──────────────────────────────────────────────────────────

  {
    id: "noxus-draven",
    name: "Noxus Draven Carry",
    primaryCarry: "TFT16_Draven",
    requiredTraits: { Noxus: 1, Quickstriker: 1 },
    optionalTraits: ["Slayer", "Juggernaut"],
  },
  {
    id: "freljord-lissandra",
    name: "Freljord Bruisers",
    primaryCarry: "TFT16_Lissandra",
    requiredTraits: { Freljord: 1, Invoker: 1 },
    optionalTraits: ["Bruiser", "Warden"],
  },
  {
    id: "bilgewater-mf",
    name: "Bilgewater Miss Fortune",
    primaryCarry: "TFT16_MissFortune",
    requiredTraits: { Bilgewater: 1, Gunslinger: 1 },
    optionalTraits: ["Bruiser", "Disruptor"],
  },
  {
    id: "noxus-ambessa",
    name: "Noxus Ambessa Carry",
    primaryCarry: "TFT16_Ambessa",
    requiredTraits: { Noxus: 1, Vanquisher: 1 },
    optionalTraits: ["Slayer", "Defender"],
  },
  {
    id: "void-kaisa",
    name: "Void Kai'Sa Carry",
    primaryCarry: "TFT16_KaiSa",
    requiredTraits: { Void: 1 },
    optionalTraits: ["Longshot", "Disruptor"],
  },
  {
    id: "ixtal-nidalee",
    name: "Ixtal Nidalee Carry",
    primaryCarry: "TFT16_Nidalee",
    requiredTraits: { Ixtal: 1 },
    optionalTraits: ["Bruiser", "Warden"],
  },
  {
    id: "piltover-seraphine",
    name: "Piltover Disruptors",
    primaryCarry: "TFT16_Seraphine",
    requiredTraits: { Piltover: 1, Disruptor: 1 },
    optionalTraits: ["Invoker", "Defender"],
  },

  // ── Reroll Comps ────────────────────────────────────────────────────

  {
    id: "reroll-briar",
    name: "Briar Reroll",
    primaryCarry: "TFT16_Briar",
    requiredTraits: { Noxus: 1, Slayer: 1 },
    isReroll: true,
  },
  {
    id: "reroll-caitlyn",
    name: "Caitlyn Reroll",
    primaryCarry: "TFT16_Caitlyn",
    requiredTraits: { Piltover: 1, Longshot: 1 },
    isReroll: true,
  },
  {
    id: "reroll-jhin",
    name: "Jhin Reroll",
    primaryCarry: "TFT16_Jhin",
    requiredTraits: { Ionia: 1, Gunslinger: 1 },
    isReroll: true,
  },

  // ── 5-Cost Carries ──────────────────────────────────────────────────

  {
    id: "asol-carry",
    name: "Aurelion Sol Carry",
    primaryCarry: "TFT16_AurelionSol",
    requiredTraits: { Targon: 1 },
    optionalTraits: ["Invoker"],
  },
  {
    id: "sett-carry",
    name: "Sett Boss Carry",
    primaryCarry: "TFT16_Sett",
    requiredTraits: { Ionia: 1 },
    optionalTraits: ["Slayer", "Quickstriker"],
  },
  {
    id: "aatrox-carry",
    name: "Aatrox Darkin Carry",
    primaryCarry: "TFT16_Aatrox",
    requiredTraits: { Slayer: 1 },
    optionalTraits: ["Darkin", "Ionia", "Noxus"],
  },

  // ── Auto-Discovered Comps (from match data analysis) ─────────────────

  {
    id: "auto-mel",
    name: "Mel Carry",
    primaryCarry: "TFT16_Mel",
    requiredTraits: { Noxus: 1, Magus: 1, Juggernaut: 1 },
  },
  {
    id: "auto-thresh",
    name: "Thresh Carry",
    primaryCarry: "TFT16_Thresh",
    requiredTraits: { ShadowIsles: 1, Warden: 1, Vanquisher: 1 },
  },
  {
    id: "auto-leblanc",
    name: "LeBlanc Carry",
    primaryCarry: "TFT16_Leblanc",
    requiredTraits: { Noxus: 1, Defender: 1, Invoker: 1 },
  },
  {
    id: "auto-sylas",
    name: "Sylas Carry",
    primaryCarry: "TFT16_Sylas",
    requiredTraits: { SylasTrait: 1, Sorcerer: 1, Defender: 1 },
  },
  {
    id: "auto-darius",
    name: "Darius Carry",
    primaryCarry: "TFT16_Darius",
    requiredTraits: { Noxus: 1, Defender: 1 },
  },
  {
    id: "auto-warwick",
    name: "Warwick Carry",
    primaryCarry: "TFT16_Warwick",
    requiredTraits: { Zaun: 1, Rapidfire: 1 },
  },
  {
    id: "auto-ziggs",
    name: "Ziggs Carry",
    primaryCarry: "TFT16_Ziggs",
    requiredTraits: { Yordle: 1, Sorcerer: 1 },
  },
  {
    id: "auto-azir",
    name: "Azir Carry",
    primaryCarry: "TFT16_Azir",
    requiredTraits: { Emperor: 1, Shurima: 1 },
    heroAugment: { augmentId: "TFT16_Augment_Shurima_SecretsOfTheSands", augmentName: "Secrets of the Sands" },
  },
  {
    id: "auto-kindred",
    name: "Kindred Carry",
    primaryCarry: "TFT16_Kindred",
    requiredTraits: { KindredUnique: 1, Rapidfire: 1 },
  },
  {
    id: "auto-annietibbers",
    name: "Annie & Tibbers Carry",
    primaryCarry: "TFT16_AnnieTibbers",
    requiredTraits: { DarkChild: 1, Sorcerer: 1 },
  },
  {
    id: "auto-shyvana",
    name: "Shyvana Carry",
    primaryCarry: "TFT16_Shyvana",
    requiredTraits: { ShyvanaUnique: 1, Juggernaut: 1 },
  },
  {
    id: "auto-zilean",
    name: "Zilean Carry",
    primaryCarry: "TFT16_Zilean",
    requiredTraits: { Chronokeeper: 1, Invoker: 1 },
  },
  {
    id: "auto-lucian",
    name: "Lucian & Senna Carry",
    primaryCarry: "TFT16_Lucian",
    requiredTraits: { Soulbound: 1 },
  },
  {
    id: "auto-annie",
    name: "Annie Carry",
    primaryCarry: "TFT16_Annie",
    requiredTraits: { DarkChild: 1, Sorcerer: 1 },
  },
  {
    id: "auto-ryze",
    name: "Ryze Carry",
    primaryCarry: "TFT16_Ryze",
    requiredTraits: { RuneMage: 1, Magus: 1 },
  },
  {
    id: "auto-brock",
    name: "Brock Carry",
    primaryCarry: "TFT16_Brock",
    requiredTraits: { Explorer: 1, Defender: 1 },
  },
  {
    id: "auto-thex",
    name: "T-Hex Carry",
    primaryCarry: "TFT16_THex",
    requiredTraits: { HexMech: 1, Piltover: 1 },
  },
  {
    id: "auto-fiddlesticks",
    name: "Fiddlesticks Carry",
    primaryCarry: "TFT16_Fiddlesticks",
    requiredTraits: { Harvester: 1, Warden: 1 },
  },
  {
    id: "auto-fizz",
    name: "Fizz Carry",
    primaryCarry: "TFT16_Fizz",
    requiredTraits: { Yordle: 1, Sorcerer: 1 },
    isReroll: true,
  },
  {
    id: "auto-xerath",
    name: "Xerath Carry",
    primaryCarry: "TFT16_Xerath",
    requiredTraits: { Shurima: 1, XerathUnique: 1 },
  },
  {
    id: "auto-volibear",
    name: "Volibear Carry",
    primaryCarry: "TFT16_Volibear",
    requiredTraits: { Brawler: 1 },
  },
  {
    id: "auto-renekton",
    name: "Renekton Carry",
    primaryCarry: "TFT16_Renekton",
    requiredTraits: { Shurima: 1 },
  },
  {
    id: "auto-rumble",
    name: "Rumble (Artillery Barrage)",
    primaryCarry: "TFT16_Rumble",
    requiredTraits: { Yordle: 1 },
    isReroll: true,
    heroAugment: { augmentId: "TFT16_Augment_RumbleCarry", augmentName: "Artillery Barrage" },
  },
  {
    id: "auto-ornn",
    name: "Ornn Carry",
    primaryCarry: "TFT16_Ornn",
    requiredTraits: { Blacksmith: 1, Warden: 1 },
  },
  {
    id: "auto-swain",
    name: "Swain Carry",
    primaryCarry: "TFT16_Swain",
    requiredTraits: { Noxus: 1, Sorcerer: 1 },
  },
  {
    id: "auto-viego",
    name: "Viego (The Ruined King)",
    primaryCarry: "TFT16_Viego",
    requiredTraits: { ShadowIsles: 1 },
    heroAugment: { augmentId: "TFT16_Augment_ShadowIsles_RuinedKing", augmentName: "The Ruined King" },
  },
  {
    id: "auto-braum",
    name: "Braum Carry",
    primaryCarry: "TFT16_Braum",
    requiredTraits: { Warden: 1 },
  },
];
