/**
 * Generate Comp Archetypes from Champion/Trait Data
 *
 * Creates ~30 realistic comp archetypes by combining trait synergies
 * with appropriate champions, carries, and items.
 *
 * Run: npx tsx pipeline/generate-comps.ts
 */

import "dotenv/config";
import { db } from "../src/lib/db";
import { compArchetypes } from "../src/lib/db/schema";
import { eq } from "drizzle-orm";
import { logger } from "./utils/logger";

import championsData from "../mock/champions.json";
import itemsData from "../mock/items.json";
import traitsData from "../mock/traits.json";

const PATCH_ID = 1;

interface Champion {
  id: string;
  name: string;
  cost: number;
  traits: string[];
}

interface TraitDef {
  id: string;
  name: string;
  breakpoints: { minUnits: number; style: string }[];
}

const champions = championsData as Champion[];
const traits = traitsData as TraitDef[];

// Map trait display name → internal ID and breakpoints
const traitLookup = new Map<string, TraitDef>();
for (const t of traits) {
  traitLookup.set(t.name, t);
}

// Map trait name → champions with that trait
const traitChampions = new Map<string, Champion[]>();
for (const c of champions) {
  for (const t of c.traits) {
    if (!traitChampions.has(t)) traitChampions.set(t, []);
    traitChampions.get(t)!.push(c);
  }
}

// Offensive items for carries
const CARRY_ITEMS = [
  "TFT_Item_InfinityEdge",
  "TFT_Item_JeweledGauntlet",
  "TFT_Item_GiantSlayer",
  "TFT_Item_Deathcap",
  "TFT_Item_GuinsoosRageblade",
  "TFT_Item_LastWhisper",
  "TFT_Item_HandOfJustice",
  "TFT_Item_HextechGunblade",
  "TFT_Item_Bloodthirster",
  "TFT_Item_StatikkShiv",
];

// Tank items for frontline
const TANK_ITEMS = [
  "TFT_Item_WarmogsArmor",
  "TFT_Item_DragonsClaw",
  "TFT_Item_Redemption",
  "TFT_Item_SunfireCape",
  "TFT_Item_GargoyleStoneplate",
  "TFT_Item_BrambleVest",
];

function pickRandom<T>(arr: T[], count: number): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

function getBreakpointStyle(traitName: string, unitCount: number): string {
  const def = traitLookup.get(traitName);
  if (!def) return "bronze";
  let style = "bronze";
  for (const bp of def.breakpoints) {
    if (unitCount >= bp.minUnits) style = bp.style;
  }
  return style;
}

function getBreakpointReached(traitName: string, unitCount: number): number {
  const def = traitLookup.get(traitName);
  if (!def) return unitCount;
  let reached = 0;
  for (const bp of def.breakpoints) {
    if (unitCount >= bp.minUnits) reached = bp.minUnits;
  }
  return reached || unitCount;
}

function getMaxBreakpoint(traitName: string): number {
  const def = traitLookup.get(traitName);
  if (!def || def.breakpoints.length === 0) return 1;
  return def.breakpoints[def.breakpoints.length - 1].minUnits;
}

interface CompDef {
  name: string;
  primaryTrait: string;
  secondaryTrait?: string;
  targetSize: number;
  carryIndex: number;
  /** Champion ID that MUST be included and set as carry */
  requiredChampion?: string;
}

// Define 30 comp archetypes
const COMP_DEFS: CompDef[] = [
  { name: "6 Yordle Arcanists", primaryTrait: "Yordle", secondaryTrait: "Arcanist", targetSize: 8, carryIndex: -2, requiredChampion: "TFT16_Veigar" },
  { name: "Void Bel'Veth", primaryTrait: "Void", secondaryTrait: "Slayer", targetSize: 8, carryIndex: -3, requiredChampion: "TFT16_BelVeth" },
  { name: "Ionia Slayer Yone", primaryTrait: "Ionia", secondaryTrait: "Slayer", targetSize: 8, carryIndex: -2, requiredChampion: "TFT16_Yone" },
  { name: "Zaun Gunslingers", primaryTrait: "Zaun", secondaryTrait: "Gunslinger", targetSize: 8, carryIndex: -3, requiredChampion: "TFT16_Jinx" },
  { name: "Demacia Defenders", primaryTrait: "Demacia", secondaryTrait: "Defender", targetSize: 8, carryIndex: -2, requiredChampion: "TFT16_Garen" },
  { name: "Noxus Draven Carry", primaryTrait: "Noxus", secondaryTrait: "Quickstriker", targetSize: 8, carryIndex: -3, requiredChampion: "TFT16_Draven" },
  { name: "Freljord Bruisers", primaryTrait: "Freljord", secondaryTrait: "Bruiser", targetSize: 8, carryIndex: -2, requiredChampion: "TFT16_Volibear" },
  { name: "Targon Aphelios", primaryTrait: "Targon", secondaryTrait: "Longshot", targetSize: 7, carryIndex: -4, requiredChampion: "TFT16_Aphelios" },
  { name: "Bilgewater Pirates", primaryTrait: "Bilgewater", secondaryTrait: "Vanquisher", targetSize: 8, carryIndex: -2, requiredChampion: "TFT16_MissFortune" },
  { name: "Shadow Isles Reapers", primaryTrait: "Shadow Isles", secondaryTrait: "Slayer", targetSize: 7, carryIndex: -2 },
  { name: "Piltover Tech", primaryTrait: "Piltover", secondaryTrait: "Invoker", targetSize: 7, carryIndex: -2, requiredChampion: "TFT16_THex" },
  { name: "Ixtal Explorers", primaryTrait: "Ixtal", secondaryTrait: "Bruiser", targetSize: 7, carryIndex: -2 },
  { name: "Shurima Ascended", primaryTrait: "Shurima", secondaryTrait: "Disruptor", targetSize: 7, carryIndex: -1, requiredChampion: "TFT16_Xerath" },
  { name: "Juggernaut Frontline", primaryTrait: "Juggernaut", secondaryTrait: "Defender", targetSize: 8, carryIndex: -1 },
  { name: "Invoker Mages", primaryTrait: "Invoker", secondaryTrait: "Arcanist", targetSize: 8, carryIndex: -2 },
  { name: "Warden Wall", primaryTrait: "Warden", secondaryTrait: "Bruiser", targetSize: 8, carryIndex: -1 },
  { name: "Longshot Snipers", primaryTrait: "Longshot", secondaryTrait: "Gunslinger", targetSize: 7, carryIndex: -2 },
  { name: "Quickstriker Assassins", primaryTrait: "Quickstriker", secondaryTrait: "Slayer", targetSize: 7, carryIndex: -1 },
  { name: "Disruptor Control", primaryTrait: "Disruptor", secondaryTrait: "Invoker", targetSize: 7, carryIndex: -1, requiredChampion: "TFT16_Mel" },
  { name: "Vanquisher Bruisers", primaryTrait: "Vanquisher", secondaryTrait: "Bruiser", targetSize: 8, carryIndex: -1 },
  { name: "Gunslinger MF Carry", primaryTrait: "Gunslinger", secondaryTrait: "Bilgewater", targetSize: 8, carryIndex: -2, requiredChampion: "TFT16_MissFortune" },
  { name: "Arcanist Annie", primaryTrait: "Arcanist", secondaryTrait: "Juggernaut", targetSize: 8, carryIndex: -1, requiredChampion: "TFT16_Annie" },
  { name: "Defender Garen", primaryTrait: "Defender", secondaryTrait: "Demacia", targetSize: 8, carryIndex: -3, requiredChampion: "TFT16_Garen" },
  { name: "Bruiser Volibear", primaryTrait: "Bruiser", secondaryTrait: "Freljord", targetSize: 8, carryIndex: -1, requiredChampion: "TFT16_Volibear" },
  { name: "Slayer Aatrox", primaryTrait: "Slayer", secondaryTrait: "Noxus", targetSize: 8, carryIndex: -1, requiredChampion: "TFT16_Aatrox" },
  { name: "Void Kai'Sa", primaryTrait: "Void", secondaryTrait: "Longshot", targetSize: 7, carryIndex: -2, requiredChampion: "TFT16_Kaisa" },
  { name: "Ionia Sett Reroll", primaryTrait: "Ionia", secondaryTrait: "Bruiser", targetSize: 8, carryIndex: -1, requiredChampion: "TFT16_Sett" },
  { name: "Zaun Singed Tech", primaryTrait: "Zaun", secondaryTrait: "Juggernaut", targetSize: 7, carryIndex: -2, requiredChampion: "TFT16_Singed" },
  { name: "Noxus Ambessa", primaryTrait: "Noxus", secondaryTrait: "Vanquisher", targetSize: 8, carryIndex: -2, requiredChampion: "TFT16_Ambessa" },
  { name: "Yordle Reroll", primaryTrait: "Yordle", secondaryTrait: "Defender", targetSize: 8, carryIndex: -3, requiredChampion: "TFT16_Tristana" },
];

function buildComp(def: CompDef) {
  const primaryChamps = traitChampions.get(def.primaryTrait) ?? [];
  const secondaryChamps = def.secondaryTrait ? (traitChampions.get(def.secondaryTrait) ?? []) : [];

  // Prioritize: champions with BOTH traits > primary-only > secondary-only > fillers
  const bothTraits: Champion[] = [];
  const primaryOnly: Champion[] = [];
  const secondaryOnly: Champion[] = [];

  const primarySet = new Set(primaryChamps.map((c) => c.id));
  const secondarySet = new Set(secondaryChamps.map((c) => c.id));

  for (const c of primaryChamps) {
    if (secondarySet.has(c.id)) {
      bothTraits.push(c);
    } else {
      primaryOnly.push(c);
    }
  }
  for (const c of secondaryChamps) {
    if (!primarySet.has(c.id)) {
      secondaryOnly.push(c);
    }
  }

  // Sort each group by cost descending (prefer higher cost for stronger comps)
  const byCostDesc = (a: Champion, b: Champion) => b.cost - a.cost;
  bothTraits.sort(byCostDesc);
  primaryOnly.sort(byCostDesc);
  secondaryOnly.sort(byCostDesc);

  // Fill the comp: required champion first, then both-trait, then alternate
  const selected = new Map<string, Champion>();

  // Guarantee the required champion is included
  if (def.requiredChampion) {
    const required = champions.find((c) => c.id === def.requiredChampion);
    if (required) selected.set(required.id, required);
  }

  for (const c of bothTraits) selected.set(c.id, c);
  // Interleave primary and secondary to ensure both traits are well-represented
  let pi = 0, si = 0;
  while (selected.size < def.targetSize && (pi < primaryOnly.length || si < secondaryOnly.length)) {
    if (pi < primaryOnly.length && selected.size < def.targetSize) {
      selected.set(primaryOnly[pi].id, primaryOnly[pi]);
      pi++;
    }
    if (si < secondaryOnly.length && selected.size < def.targetSize) {
      selected.set(secondaryOnly[si].id, secondaryOnly[si]);
      si++;
    }
  }

  // If still under target, fill with highest-cost remaining champions
  if (selected.size < def.targetSize) {
    const remaining = champions
      .filter((c) => !selected.has(c.id))
      .sort(byCostDesc);
    for (const c of remaining) {
      if (selected.size >= def.targetSize) break;
      selected.set(c.id, c);
    }
  }

  // Sort by cost ascending for display
  const sortedChamps = [...selected.values()].sort((a, b) => a.cost - b.cost);

  // Trim to target size (remove lowest cost first, but never remove required champion)
  while (sortedChamps.length > def.targetSize) {
    const removeIdx = sortedChamps.findIndex((c) => c.id !== def.requiredChampion);
    if (removeIdx === -1) break;
    sortedChamps.splice(removeIdx, 1);
  }

  // Determine carry: required champion if set, otherwise by cost index
  const carry = def.requiredChampion
    ? sortedChamps.find((c) => c.id === def.requiredChampion) ?? sortedChamps[sortedChamps.length - 1]
    : sortedChamps[Math.max(0, Math.min(sortedChamps.length + def.carryIndex, sortedChamps.length - 1))];

  // Count traits
  const traitCounts = new Map<string, number>();
  for (const c of sortedChamps) {
    for (const t of c.traits) {
      traitCounts.set(t, (traitCounts.get(t) ?? 0) + 1);
    }
  }

  // Build traits array — include all traits that hit at least one breakpoint
  const compTraits = [...traitCounts.entries()]
    .filter(([traitName, count]) => {
      const traitDef = traitLookup.get(traitName);
      if (!traitDef) return false;
      return traitDef.breakpoints.some((bp) => count >= bp.minUnits);
    })
    .sort((a, b) => {
      // Sort by style tier: chromatic > gold > silver > bronze
      const styleOrder: Record<string, number> = { chromatic: 0, gold: 1, silver: 2, bronze: 3 };
      const aStyle = getBreakpointStyle(a[0], a[1]);
      const bStyle = getBreakpointStyle(b[0], b[1]);
      const orderDiff = (styleOrder[aStyle] ?? 4) - (styleOrder[bStyle] ?? 4);
      if (orderDiff !== 0) return orderDiff;
      return b[1] - a[1];
    })
    .map(([traitName, count]) => ({
      traitId: traitLookup.get(traitName)?.id ?? `TFT16_${traitName}`,
      traitName,
      activeUnits: count,
      breakpointReached: getBreakpointReached(traitName, count),
      maxBreakpoint: getMaxBreakpoint(traitName),
      style: getBreakpointStyle(traitName, count),
    }));

  // Build core champions
  const coreChampions = sortedChamps.map((c) => ({
    championId: c.id,
    championName: c.name,
    starLevel: c.cost <= 2 ? 3 : 2,
    recommendedItems:
      c.id === carry.id
        ? pickRandom(CARRY_ITEMS, 3)
        : c.cost <= 2
          ? pickRandom(TANK_ITEMS, 2)
          : [],
    isCarry: c.id === carry.id,
  }));

  // Generate realistic stats
  const baseAvg = 3.0 + Math.random() * 2.0;
  const stats = {
    avgPlacement: parseFloat(baseAvg.toFixed(2)),
    top4Rate: parseFloat((0.35 + (5.0 - baseAvg) * 0.12 + Math.random() * 0.1).toFixed(3)),
    winRate: parseFloat((0.05 + (5.0 - baseAvg) * 0.05 + Math.random() * 0.05).toFixed(3)),
    playRate: parseFloat((0.01 + Math.random() * 0.08).toFixed(3)),
    sampleSize: Math.floor(200 + Math.random() * 3000),
  };

  return {
    name: def.name,
    traits: compTraits,
    coreChampions,
    flexChampions: [],
    carry,
    stats,
  };
}

async function generateAndSeed() {
  logger.info("Generating comp archetypes...", { count: COMP_DEFS.length });

  // Clear existing
  await db.delete(compArchetypes).where(eq(compArchetypes.patchId, PATCH_ID));
  logger.info("Cleared existing comp archetypes");

  for (const def of COMP_DEFS) {
    const comp = buildComp(def);

    await db.insert(compArchetypes).values({
      patchId: PATCH_ID,
      compName: comp.name,
      traitSignature: comp.traits,
      coreChampions: comp.coreChampions,
      flexSlots: null,
      primaryCarry: comp.carry.id,
      secondaryCarry: null,
      isReroll: def.name.includes("Reroll"),
      requiresEmblem: null,
      avgPlacement: comp.stats.avgPlacement.toFixed(2),
      top4Rate: comp.stats.top4Rate.toFixed(3),
      winRate: comp.stats.winRate.toFixed(3),
      playRate: comp.stats.playRate.toFixed(3),
      sampleSize: comp.stats.sampleSize,
    });

    logger.info(`Generated: ${comp.name}`, {
      champions: comp.coreChampions.length,
      traits: comp.traits.length,
      carry: comp.carry.name,
      avgPlacement: comp.stats.avgPlacement,
    });
  }

  logger.info("Comp generation complete", { total: COMP_DEFS.length });
}

generateAndSeed()
  .then(() => {
    logger.info("Done");
    process.exit(0);
  })
  .catch((err) => {
    logger.error("Failed", {
      error: err instanceof Error ? err.message : String(err),
      stack: err instanceof Error ? err.stack : undefined,
    });
    process.exit(1);
  });
