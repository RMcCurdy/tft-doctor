/**
 * Comp Aggregation Pipeline
 *
 * Reads unprocessed match participants, classifies each board into a
 * comp archetype using carry-based clustering, then computes aggregated
 * stats for comps, augments, emblems, and items.
 *
 * Run: npx tsx pipeline/aggregate-comps.ts
 * Schedule: After each match ingestion run via GitHub Actions
 */

import { db } from "../src/lib/db";
import { augmentStats, itemStats } from "../src/lib/db/schema";
import { getCurrentPatch } from "../src/lib/db/queries/patches";
import {
  getUnprocessedMatches,
  getParticipantsForMatches,
  markMatchesProcessed,
} from "../src/lib/db/queries/matches";
import { classifyBoards } from "../src/lib/clustering/comp-classifier";
import { SET_16_COMP_DEFINITIONS } from "../src/lib/clustering/comp-definitions";
import type { ParticipantBoard } from "../src/lib/clustering/types";
import type { ClassificationResult } from "../src/lib/clustering/types";
import type { RiotUnit, RiotTrait } from "../src/types/riot";
import { logger } from "./utils/logger";

const BATCH_SIZE = 500; // Process matches in batches

async function aggregateComps() {
  const startTime = Date.now();
  logger.info("Starting comp aggregation...");

  const currentPatch = await getCurrentPatch();
  if (!currentPatch) {
    logger.error("No current patch found. Run detect-patch first.");
    process.exit(1);
  }

  let totalMatchesProcessed = 0;
  let totalParticipants = 0;
  let batchNumber = 0;

  // Process all unprocessed matches in batches
  while (true) {
    const unprocessedMatches = await getUnprocessedMatches(currentPatch.id, BATCH_SIZE);
    if (unprocessedMatches.length === 0) {
      if (batchNumber === 0) {
        logger.info("No unprocessed matches found. Nothing to aggregate.");
      }
      break;
    }

    batchNumber++;
    logger.info(`Batch ${batchNumber}: processing ${unprocessedMatches.length} matches`);

    const matchIds = unprocessedMatches.map((m) => m.matchId);
    const rawParticipants = await getParticipantsForMatches(matchIds);

    logger.info(`Loaded ${rawParticipants.length} participants`);

    // Parse JSONB fields into typed boards
    const boards: ParticipantBoard[] = rawParticipants.map((p) => ({
      matchId: p.matchId,
      puuid: p.puuid ?? "",
      placement: p.placement,
      units: (typeof p.units === "string" ? JSON.parse(p.units) : p.units) as RiotUnit[],
      traits: (typeof p.traits === "string" ? JSON.parse(p.traits) : p.traits) as RiotTrait[],
      augments: (typeof p.augments === "string" ? JSON.parse(p.augments) : p.augments) as string[],
    }));

    // Classify all boards
    const { results, stats: classStats } = classifyBoards(boards, SET_16_COMP_DEFINITIONS);

    logger.info("Classification complete", {
      total: results.length,
      carryLookup: classStats.carryLookup,
      traitFallback: classStats.traitFallback,
      unclassified: classStats.unclassified,
      classificationRate: `${(((classStats.carryLookup + classStats.traitFallback) / results.length) * 100).toFixed(1)}%`,
    });

    // Aggregate augment stats
    await aggregateAugmentStats(results, boards, currentPatch.id);

    // Aggregate item stats
    await aggregateItemStats(results, boards, currentPatch.id);

    // Mark matches as processed
    await markMatchesProcessed(matchIds);

    totalMatchesProcessed += matchIds.length;
    totalParticipants += rawParticipants.length;
  }

  const durationMs = Date.now() - startTime;
  logger.info("Aggregation complete", {
    totalMatchesProcessed,
    totalParticipants,
    batches: batchNumber,
    durationMs,
  });
}

async function aggregateAugmentStats(
  results: ClassificationResult[],
  boards: ParticipantBoard[],
  patchId: number
) {
  // Collect augment → placement data (overall, not per-comp)
  const augmentPlacements: Record<string, number[]> = {};

  for (let i = 0; i < results.length; i++) {
    const board = boards[i];
    for (const augmentId of board.augments) {
      if (!augmentPlacements[augmentId]) augmentPlacements[augmentId] = [];
      augmentPlacements[augmentId].push(board.placement);
    }
  }

  let count = 0;
  for (const [augmentId, placements] of Object.entries(augmentPlacements)) {
    if (placements.length < 5) continue; // Skip very rare augments

    await db
      .insert(augmentStats)
      .values({
        patchId,
        augmentId,
        compArchetypeId: null, // overall stats
        avgPlacement: average(placements).toFixed(2),
        pickRate: (placements.length / results.length).toFixed(3),
        sampleSize: placements.length,
      })
      .onConflictDoNothing();
    count++;
  }

  logger.info(`Aggregated ${count} augment stats`);
}

async function aggregateItemStats(
  results: ClassificationResult[],
  boards: ParticipantBoard[],
  patchId: number
) {
  // Collect item → placement data
  const itemPlacements: Record<string, number[]> = {};

  for (let i = 0; i < results.length; i++) {
    const board = boards[i];
    for (const unit of board.units) {
      const items = unit.itemNames ?? [];
      for (const itemId of items) {
        if (!itemPlacements[itemId]) itemPlacements[itemId] = [];
        itemPlacements[itemId].push(board.placement);
      }
    }
  }

  let count = 0;
  for (const [itemId, placements] of Object.entries(itemPlacements)) {
    if (placements.length < 5) continue;

    await db
      .insert(itemStats)
      .values({
        patchId,
        itemId,
        compArchetypeId: null,
        carriedByChampion: null,
        avgPlacement: average(placements).toFixed(2),
        usageRate: (placements.length / results.length).toFixed(3),
        sampleSize: placements.length,
      })
      .onConflictDoNothing();
    count++;
  }

  logger.info(`Aggregated ${count} item stats`);
}

// ─── Utilities ──────────────────────────────────────────────────────────────

function average(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

// ─── Entry Point ────────────────────────────────────────────────────────────

aggregateComps()
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
