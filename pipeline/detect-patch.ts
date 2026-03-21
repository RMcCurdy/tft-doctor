/**
 * Patch Detection Pipeline
 *
 * Checks Data Dragon for the current game version and updates the
 * patches table. Should run before other pipeline scripts.
 *
 * Run: npx tsx pipeline/detect-patch.ts
 * Schedule: Daily via GitHub Actions
 */

import { getCurrentVersion } from "../src/lib/ddragon/client";
import {
  getCurrentPatch,
  upsertPatch,
  markPatchAsCurrent,
  getPatchByVersion,
} from "../src/lib/db/queries/patches";
import { logger } from "./utils/logger";

async function detectPatch() {
  logger.info("Checking for new patch...");

  const version = await getCurrentVersion();
  // DDragon version is like "16.6.1" — we want "16.6" for the patch
  const patchVersion = version.split(".").slice(0, 2).join(".");
  // Set number: first part of the version
  const setNumber = parseInt(patchVersion.split(".")[0], 10);

  logger.info(`Data Dragon version: ${version}, patch: ${patchVersion}`);

  const currentPatch = await getCurrentPatch();

  if (currentPatch?.patchVersion === patchVersion) {
    logger.info("Patch is up to date, no changes needed", {
      patchVersion,
      matchCount: currentPatch.matchCount,
    });
    return;
  }

  // Either no patch exists or a new one was detected
  if (currentPatch) {
    logger.info(`New patch detected! ${currentPatch.patchVersion} → ${patchVersion}`);
  } else {
    logger.info(`First patch setup: ${patchVersion}`);
  }

  const patch = await upsertPatch({
    patchVersion,
    setNumber,
    releaseDate: new Date(),
    isCurrent: true,
  });

  if (patch) {
    // Look up the ID for the newly inserted/existing patch
    const patchRow = await getPatchByVersion(patchVersion);
    if (patchRow) {
      await markPatchAsCurrent(patchRow.id);
    }
  }

  logger.info("Patch updated successfully", { patchVersion, setNumber });
}

// ─── Entry Point ────────────────────────────────────────────────────────────

detectPatch()
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
