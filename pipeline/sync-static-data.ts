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

  // Check if we already have data for this version
  const [existing] = await db
    .select()
    .from(staticData)
    .where(
      and(
        eq(staticData.patchVersion, patchVersion),
        eq(staticData.dataType, "champions")
      )
    )
    .limit(1);

  if (existing) {
    logger.info("Static data already synced for this patch", { patchVersion });
    return;
  }

  // Fetch all data types
  const fetchers: Record<string, () => Promise<unknown>> = {
    champions: () => fetchChampions(version),
    items: () => fetchItems(version),
    augments: () => fetchAugments(version),
    traits: () => fetchTraits(version),
  };

  for (const dataType of DATA_TYPES) {
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
