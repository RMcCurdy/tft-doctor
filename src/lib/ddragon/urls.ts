/** Data Dragon and Community Dragon URL helpers for champion/item/augment/trait icons */

import { DDRAGON_BASE_URL, CDRAGON_BASE_URL } from "@/lib/constants";

/** Current TFT set version — update when a new set releases */
let cachedVersion: string | null = null;

/**
 * Get the current Data Dragon version.
 * In mock mode or when cached, returns the cached version.
 * Otherwise fetches from Riot's realm endpoint.
 */
export async function getDDragonVersion(): Promise<string> {
  if (cachedVersion) return cachedVersion;

  try {
    const res = await fetch(`${DDRAGON_BASE_URL}/realms/na.json`);
    const data = await res.json();
    cachedVersion = data.dd as string;
    return cachedVersion;
  } catch {
    // Fallback to a known recent version
    return "15.7.1";
  }
}

/** Set the DDragon version (useful for testing and mock mode) */
export function setDDragonVersion(version: string): void {
  cachedVersion = version;
}

/** Get champion icon URL */
export function getChampionIconUrl(championId: string, version: string): string {
  // DDragon TFT champion icons use a cleaned ID format
  const cleanId = championId.replace("TFT13_", "").replace("TFT14_", "");
  return `${DDRAGON_BASE_URL}/cdn/${version}/img/tft-champion/${cleanId}.png`;
}

/** Get item icon URL */
export function getItemIconUrl(itemId: string, version: string): string {
  return `${DDRAGON_BASE_URL}/cdn/${version}/img/tft-item/${itemId}.png`;
}

/** Get trait icon URL from Community Dragon (more reliable for traits) */
export function getTraitIconUrl(traitId: string): string {
  const cleanId = traitId.toLowerCase().replace("set13_", "").replace("set14_", "");
  return `${CDRAGON_BASE_URL}/game/assets/ux/traiticons/trait_icon_${cleanId}.png`;
}

/**
 * Get augment icon URL from Community Dragon.
 * Augment icons are not reliably available in DDragon, so we use CDragon.
 */
export function getAugmentIconUrl(augmentId: string): string {
  const cleanId = augmentId.toLowerCase();
  return `${CDRAGON_BASE_URL}/game/assets/ux/tft/championsplashes/${cleanId}.png`;
}

/**
 * Generic icon URL resolver — determines the right CDN path based on entity type.
 */
export function getIconUrl(
  type: "champion" | "item" | "augment" | "trait",
  id: string,
  version: string
): string {
  switch (type) {
    case "champion":
      return getChampionIconUrl(id, version);
    case "item":
      return getItemIconUrl(id, version);
    case "augment":
      return getAugmentIconUrl(id);
    case "trait":
      return getTraitIconUrl(id);
  }
}
