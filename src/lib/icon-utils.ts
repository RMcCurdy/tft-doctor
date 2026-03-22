import { CDRAGON_BASE_URL } from "@/lib/constants";

/**
 * Convert a CDragon .tex asset path to a CDN image URL.
 *
 * Example:
 *   "ASSETS/UX/TraitIcons/Trait_Icon_6_Arcanist.tex"
 *   → "https://raw.communitydragon.org/latest/game/assets/ux/traiticons/trait_icon_6_arcanist.png"
 */
export function texPathToUrl(texPath: string): string {
  const pngPath = texPath.toLowerCase().replace(/\.tex$/, ".png");
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
