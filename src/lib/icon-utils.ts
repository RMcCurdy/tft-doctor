import { CDRAGON_BASE_URL, DDRAGON_BASE_URL } from "@/lib/constants";

/**
 * Convert an icon path to a CDN image URL.
 * Handles both:
 * - CDragon .tex paths: "ASSETS/UX/TraitIcons/Trait_Icon_6_Arcanist.tex"
 * - DDragon filenames: "TFT_Item_InfinityEdge.png"
 */
export function texPathToUrl(iconPath: string): string {
  // CDragon .tex asset path (contains directory separators)
  if (iconPath.includes("/")) {
    const pngPath = iconPath.toLowerCase().replace(/\.tex$/, ".png");
    return `${CDRAGON_BASE_URL}/game/${pngPath}`;
  }

  // DDragon item/champion filename (e.g., "TFT_Item_InfinityEdge.png")
  if (iconPath.endsWith(".png")) {
    return `${DDRAGON_BASE_URL}/cdn/16.6.1/img/tft-item/${iconPath}`;
  }

  // Fallback: treat as CDragon path
  const pngPath = iconPath.toLowerCase().replace(/\.tex$/, ".png");
  return `${CDRAGON_BASE_URL}/game/${pngPath}`;
}

/**
 * Get a square portrait URL for a TFT champion by ID.
 * Used when we only have a champion ID (e.g., in CompChampion) and no .tex path.
 *
 * Example:
 *   "TFT16_Anivia"
 *   → "https://raw.communitydragon.org/latest/game/assets/characters/tft16_anivia/hud/tft16_anivia_square.tft_set16.png"
 */
export function getChampionSquareUrl(championId: string): string {
  const id = championId.toLowerCase();
  return `${CDRAGON_BASE_URL}/game/assets/characters/${id}/hud/${id}_square.tft_set16.png`;
}
