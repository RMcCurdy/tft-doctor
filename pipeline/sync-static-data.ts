/**
 * Static Data Sync Pipeline
 *
 * Fetches champion, item, augment, and trait data from Data Dragon
 * and Community Dragon, then stores it in the static_data table.
 *
 * Run: npx tsx pipeline/sync-static-data.ts
 * Schedule: Daily via GitHub Actions (checks for version changes)
 */

import {
  getCurrentVersion,
  fetchChampions,
  fetchItems,
  fetchAugments,
  fetchTraits,
  fetchCDragonTftData,
} from "../src/lib/ddragon/client";
import { db } from "../src/lib/db";
import { staticData } from "../src/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { logger } from "./utils/logger";

const DATA_TYPES = ["champions", "items", "augments", "traits"] as const;

async function syncStaticData() {
  logger.info("Starting static data sync...");

  const version = await getCurrentVersion();
  const patchVersion = version.split(".").slice(0, 2).join(".");

  logger.info(`Current version: ${version} (patch ${patchVersion})`);

  // Check which data types already exist for this patch
  const existingRows = await db
    .select({ dataType: staticData.dataType })
    .from(staticData)
    .where(eq(staticData.patchVersion, patchVersion));
  const existingTypes = new Set(existingRows.map((r) => r.dataType));

  const allSynced = DATA_TYPES.every((dt) => existingTypes.has(dt));
  if (allSynced) {
    logger.info("Static data already synced for this patch", { patchVersion });
    return;
  }

  // Fetch all data types
  // Items: merge DDragon items with CDragon items (CDragon has Bilgewater shop items, artifacts, etc.)
  // Normalize into flat array format: [{ id, name, icon }]
  const fetchMergedItems = async () => {
    const ddragonRaw = await fetchItems(version) as Record<string, unknown>;
    // DDragon returns { type, version, data: { [key]: { id, name, image: { full } } } }
    const ddragonData = (ddragonRaw.data ?? ddragonRaw) as Record<string, Record<string, unknown>>;

    // Normalize DDragon items into flat array
    const items: Array<Record<string, unknown>> = [];
    const seenIds = new Set<string>();

    for (const entry of Object.values(ddragonData)) {
      const id = entry.id as string;
      if (!id || seenIds.has(id)) continue;
      seenIds.add(id);

      const image = entry.image as Record<string, unknown> | undefined;
      items.push({
        id,
        name: entry.name as string,
        icon: image?.full as string ?? "",
      });
    }

    // Supplement with CDragon items (Bilgewater shop items, etc.)
    try {
      logger.info("Supplementing items from Community Dragon...");
      const cdragonData = await fetchCDragonTftData() as Record<string, unknown>;
      const cdragonItems = (cdragonData.items as Array<Record<string, unknown>>) ?? [];

      let added = 0;
      for (const item of cdragonItems) {
        const apiName = (item.apiName ?? item.id) as string;
        if (!apiName || seenIds.has(apiName)) continue;
        // Only include TFT16 items (current set), skip augments
        if (!apiName.startsWith("TFT16_Item_")) continue;

        seenIds.add(apiName);
        items.push({
          id: apiName,
          name: item.name as string,
          icon: item.icon as string,
        });
        added++;
      }
      logger.info(`Added ${added} items from CDragon`);
    } catch (err) {
      logger.warn("Failed to fetch CDragon items, using DDragon only", {
        error: err instanceof Error ? err.message : String(err),
      });
    }

    return items;
  };

  const fetchers: Record<string, () => Promise<unknown>> = {
    champions: () => fetchChampions(version),
    items: fetchMergedItems,
    augments: () => fetchAugments(version),
    traits: () => fetchTraits(version),
  };

  for (const dataType of DATA_TYPES) {
    if (existingTypes.has(dataType)) {
      logger.info(`${dataType} already synced, skipping`);
      continue;
    }
    try {
      logger.info(`Fetching ${dataType}...`);
      const data = await fetchers[dataType]();

      await db
        .insert(staticData)
        .values({
          patchVersion,
          dataType,
          data: data as Record<string, unknown>,
        })
        .onConflictDoNothing();

      logger.info(`Stored ${dataType} for patch ${patchVersion}`);
    } catch (err) {
      logger.error(`Failed to fetch ${dataType}`, {
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  logger.info("Static data sync complete", { patchVersion });
}

// ─── Entry Point ────────────────────────────────────────────────────────────

syncStaticData()
  .then(() => {
    logger.info("Pipeline finished successfully");
    process.exit(0);
  })
  .catch((err) => {
    logger.error("Pipeline failed", {
      error: err instanceof Error ? err.message : String(err),
      stack: err instanceof Error ? err.stack : undefined,
    });
    process.exit(1);
  });
