/**
 * Data Dragon and Community Dragon client for fetching TFT static data.
 *
 * Used by the pipeline's sync-static-data script to keep champion, item,
 * augment, and trait data up to date on patch days.
 */

import { DDRAGON_BASE_URL, CDRAGON_BASE_URL } from "@/lib/constants";

/** Fetch the current Data Dragon version */
export async function getCurrentVersion(): Promise<string> {
  const res = await fetch(`${DDRAGON_BASE_URL}/realms/na.json`);
  if (!res.ok) throw new Error(`Failed to fetch DDragon realm: ${res.status}`);
  const data = await res.json();
  return data.dd as string;
}

/** Fetch TFT champion data from Data Dragon */
export async function fetchChampions(version: string): Promise<unknown> {
  const res = await fetch(
    `${DDRAGON_BASE_URL}/cdn/${version}/data/en_US/tft-champion.json`
  );
  if (!res.ok) throw new Error(`Failed to fetch champions: ${res.status}`);
  return res.json();
}

/** Fetch TFT item data from Data Dragon */
export async function fetchItems(version: string): Promise<unknown> {
  const res = await fetch(
    `${DDRAGON_BASE_URL}/cdn/${version}/data/en_US/tft-item.json`
  );
  if (!res.ok) throw new Error(`Failed to fetch items: ${res.status}`);
  return res.json();
}

/** Fetch TFT augment data from Data Dragon */
export async function fetchAugments(version: string): Promise<unknown> {
  const res = await fetch(
    `${DDRAGON_BASE_URL}/cdn/${version}/data/en_US/tft-augments.json`
  );
  if (!res.ok) throw new Error(`Failed to fetch augments: ${res.status}`);
  return res.json();
}

/** Fetch TFT trait data from Data Dragon */
export async function fetchTraits(version: string): Promise<unknown> {
  const res = await fetch(
    `${DDRAGON_BASE_URL}/cdn/${version}/data/en_US/tft-trait.json`
  );
  if (!res.ok) throw new Error(`Failed to fetch traits: ${res.status}`);
  return res.json();
}

/**
 * Fetch the full TFT dataset from Community Dragon.
 * This is a large file (~20MB) with complete set data including
 * champion traits, augment details, and item compositions.
 */
export async function fetchCDragonTftData(): Promise<unknown> {
  const res = await fetch(`${CDRAGON_BASE_URL}/cdragon/tft/en_us.json`);
  if (!res.ok) throw new Error(`Failed to fetch CDragon data: ${res.status}`);
  return res.json();
}

/**
 * Extract current set data from the full CDragon response.
 * Returns champions with traits, items, augments, and traits for the latest set.
 */
export function extractCurrentSetData(
  cdragonData: Record<string, unknown>,
  setMutator: string
): {
  champions: unknown[];
  traits: unknown[];
  augments: unknown[];
  items: unknown[];
} | null {
  const setData = cdragonData.setData as Array<{
    mutator: string;
    champions: unknown[];
    traits: unknown[];
    augments: unknown[];
    items: unknown[];
  }>;

  const currentSet = setData?.find((s) => s.mutator === setMutator);
  if (!currentSet) return null;

  return {
    champions: currentSet.champions ?? [],
    traits: currentSet.traits ?? [],
    augments: currentSet.augments ?? [],
    items: (cdragonData.items as unknown[]) ?? [],
  };
}
