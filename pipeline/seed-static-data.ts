/**
 * Seed Static Data from Mock JSON Files
 *
 * Populates the static_data table with champion, item, augment, trait,
 * emblem, and artifact data from the local mock JSON files.
 *
 * Run: npx tsx pipeline/seed-static-data.ts
 */

import "dotenv/config";
import { db } from "../src/lib/db";
import { staticData } from "../src/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { logger } from "./utils/logger";

import championsData from "../mock/champions.json";
import itemsData from "../mock/items.json";
import augmentsData from "../mock/augments.json";
import traitsData from "../mock/traits.json";
import emblemsData from "../mock/emblems.json";
import artifactsData from "../mock/artifacts.json";

const PATCH_VERSION = "16.6";

const DATA_TO_SEED: { dataType: string; data: unknown }[] = [
  { dataType: "champions", data: championsData },
  { dataType: "items", data: itemsData },
  { dataType: "augments", data: augmentsData },
  { dataType: "traits", data: traitsData },
  { dataType: "emblems", data: emblemsData },
  { dataType: "artifacts", data: artifactsData },
];

async function seedStaticData() {
  logger.info("Seeding static data from mock JSON files...", {
    patchVersion: PATCH_VERSION,
  });

  for (const { dataType, data } of DATA_TO_SEED) {
    const count = Array.isArray(data) ? data.length : 0;

    try {
      // Delete existing data for this patch + type, then insert fresh
      await db
        .delete(staticData)
        .where(
          and(
            eq(staticData.patchVersion, PATCH_VERSION),
            eq(staticData.dataType, dataType)
          )
        );

      await db.insert(staticData).values({
        patchVersion: PATCH_VERSION,
        dataType,
        data: data as Record<string, unknown>,
      });

      logger.info(`Seeded ${dataType}`, { count, patchVersion: PATCH_VERSION });
    } catch (err) {
      logger.error(`Failed to seed ${dataType}`, {
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  logger.info("Static data seeding complete", {
    patchVersion: PATCH_VERSION,
    dataTypes: DATA_TO_SEED.map((d) => d.dataType),
  });
}

seedStaticData()
  .then(() => {
    logger.info("Seed script finished successfully");
    process.exit(0);
  })
  .catch((err) => {
    logger.error("Seed script failed", {
      error: err instanceof Error ? err.message : String(err),
      stack: err instanceof Error ? err.stack : undefined,
    });
    process.exit(1);
  });
