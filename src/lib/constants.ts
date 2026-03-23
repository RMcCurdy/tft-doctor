/** App-wide constants, thresholds, and configuration values */

/** Minimum sample size before showing a recommendation */
export const MIN_SAMPLE_SIZE = 50;

/** Minimum sample size for "high confidence" label */
export const HIGH_CONFIDENCE_THRESHOLD = 200;

/** Minimum sample size for "medium confidence" label */
export const MEDIUM_CONFIDENCE_THRESHOLD = 100;

/** Minimum trait overlap ratio to classify a board into a comp (Pass 2) */
export const MIN_TRAIT_OVERLAP = 0.6;

/** Carry score threshold for secondary carry detection */
export const SECONDARY_CARRY_THRESHOLD = 50;

/** Minimum items on a unit for it to be considered a secondary carry */
export const SECONDARY_CARRY_MIN_ITEMS = 2;

/** Percentage of unclassified matches to trigger new comp discovery (Pass 3) */
export const UNCLASSIFIED_THRESHOLD = 0.1;

/** Minimum boards in a cluster to suggest a new comp archetype */
export const NEW_COMP_MIN_BOARDS = 100;

/** Cache TTL for in-memory LRU (ms) */
export const RECOMMENDATION_CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes

/** Max entries in in-memory LRU cache */
export const RECOMMENDATION_CACHE_MAX_SIZE = 200;

/** ISR revalidation period for comp/meta pages (seconds) */
export const ISR_REVALIDATE_SECONDS = 3600; // 1 hour

/** Data Dragon base URL */
export const DDRAGON_BASE_URL = "https://ddragon.leagueoflegends.com";

/** Community Dragon base URL */
export const CDRAGON_BASE_URL = "https://raw.communitydragon.org/latest";

/** Riot API base URLs by region */
export const RIOT_API_REGIONS: Record<string, string> = {
  na1: "https://na1.api.riotgames.com",
  euw1: "https://euw1.api.riotgames.com",
  kr: "https://kr.api.riotgames.com",
  jp1: "https://jp1.api.riotgames.com",
  oc1: "https://oc1.api.riotgames.com",
  br1: "https://br1.api.riotgames.com",
};

/** Riot API routing regions for match endpoints */
export const RIOT_ROUTING_REGIONS: Record<string, string> = {
  americas: "https://americas.api.riotgames.com",
  europe: "https://europe.api.riotgames.com",
  asia: "https://asia.api.riotgames.com",
  sea: "https://sea.api.riotgames.com",
};

/** Map platform region to routing region */
export const REGION_TO_ROUTING: Record<string, string> = {
  na1: "americas",
  br1: "americas",
  la1: "americas",
  la2: "americas",
  euw1: "europe",
  tr1: "europe",
  ru: "europe",
  kr: "asia",
  jp1: "asia",
  oc1: "sea",
  ph2: "sea",
  sg2: "sea",
  th2: "sea",
  tw2: "sea",
  vn2: "sea",
};

/** Summoned/spawned units that should be excluded from comp lineups.
 *  These are not purchasable from the shop and appear via trait activation.
 *  Riot API returns inconsistent casing — store lowercase and check via isSummonedUnit(). */
const SUMMONED_UNIT_IDS_LOWER = new Set([
  "tft16_atakhan",
]);

/** @deprecated Use isSummonedUnit() for case-insensitive matching */
export const SUMMONED_UNIT_IDS = new Set([
  "TFT16_Atakhan",
  "tft16_atakhan",
]);

/** Case-insensitive check for summoned/spawned units */
export function isSummonedUnit(characterId: string): boolean {
  return SUMMONED_UNIT_IDS_LOWER.has(characterId.toLowerCase());
}

/** Items classified as offensive (for carry identification) */
export const OFFENSIVE_ITEM_IDS = new Set([
  "TFT_Item_InfinityEdge",
  "TFT_Item_JeweledGauntlet",
  "TFT_Item_GiantSlayer",
  "TFT_Item_Deathcap",
  "TFT_Item_GuinsoosRageblade",
  "TFT_Item_StatikkShiv",
  "TFT_Item_LastWhisper",
  "TFT_Item_HandOfJustice",
  "TFT_Item_HextechGunblade",
  "TFT_Item_ArchangelsStaff",
  "TFT_Item_Bloodthirster",
  "TFT_Item_TitansResolve",
  "TFT_Item_NashorsTooth",
]);

/** Items classified as defensive/tank (for tank identification) */
export const DEFENSIVE_ITEM_IDS = new Set([
  "TFT_Item_SunfireCape",
  "TFT_Item_WarmogsArmor",
  "TFT_Item_DragonsClaw",
  "TFT_Item_BrambleVest",
  "TFT_Item_Redemption",
  "TFT_Item_GargoyleStoneplate",
  "TFT_Item_IonicSpark",
  "TFT_Item_ZephyrGale",
  "TFT_Item_FrozenHeart",
  "TFT_Item_Crownguard",
  "TFT_Item_SteraksGage",
]);

/** Base component items — not completed, should never be recommended */
export const COMPONENT_ITEM_IDS = new Set([
  "TFT_Item_BFSword",
  "TFT_Item_RecurveBow",
  "TFT_Item_NeedlesslyLargeRod",
  "TFT_Item_TearOfTheGoddess",
  "TFT_Item_ChainVest",
  "TFT_Item_NegatronCloak",
  "TFT_Item_GiantsBelt",
  "TFT_Item_SparringGloves",
  "TFT_Item_Spatula",
]);

/** Returns true if the item is a completed item (not a component) */
export function isCompletedItem(itemId: string): boolean {
  return itemId.length > 0 && !COMPONENT_ITEM_IDS.has(itemId);
}

/** Thief's Gloves consumes all 3 item slots — must be the sole recommended item */
export const THIEFS_GLOVES_ID = "TFT_Item_ThiefsGloves";

/** Game stages where augments are offered */
export const AUGMENT_STAGES = ["2-1", "3-2", "4-2"] as const;

/** All game stages for the stage selector */
export const GAME_STAGES = [
  "2-1", "2-2", "2-3", "2-5", "2-6", "2-7",
  "3-1", "3-2", "3-3", "3-5", "3-6", "3-7",
  "4-1", "4-2", "4-3", "4-5", "4-6", "4-7",
  "5-1", "5-2", "5-3", "5-5", "5-6", "5-7",
  "6-1", "6-2", "6-3", "6-5", "6-6", "6-7",
] as const;
