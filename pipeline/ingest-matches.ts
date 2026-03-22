/**
 * Match Ingestion Pipeline
 *
 * For each tracked player, fetches recent match IDs, deduplicates,
 * fetches full match data, and stores participants in the database.
 *
 * Run: npx tsx pipeline/ingest-matches.ts
 * Schedule: Every 6 hours via GitHub Actions
 */

import { RiotClient, RiotApiError } from "../src/lib/riot/client";
import { getPlayersForIngestion } from "../src/lib/db/queries/players";
import {
  matchExists,
  insertMatch,
  insertParticipants,
} from "../src/lib/db/queries/matches";
import { getCurrentPatch, incrementMatchCount } from "../src/lib/db/queries/patches";
import { logger } from "./utils/logger";
import type { RiotRegion } from "../src/types/riot";

// Regions to ingest matches from
const REGIONS: RiotRegion[] = ["na1", "euw1", "kr"];

// How many players to process per region per run
const PLAYERS_PER_REGION = 50;

// How many recent match IDs to fetch per player
const MATCHES_PER_PLAYER = 10;

async function ingestMatches() {
  const startTime = Date.now();
  logger.info("Starting match ingestion", { regions: REGIONS });

  const client = new RiotClient();
  const currentPatch = await getCurrentPatch();

  if (!currentPatch) {
    logger.warn(
      "No current patch found in DB. Run sync-static-data first to detect the current patch."
    );
    // Continue anyway — we'll store matches without a patch ID
  }

  let totalNewMatches = 0;
  let totalParticipants = 0;
  let totalSkipped = 0;

  for (const region of REGIONS) {
    const players = await getPlayersForIngestion(region, PLAYERS_PER_REGION);
    logger.info(`Processing ${players.length} players in ${region}`);

    // Collect all unique match IDs first
    const matchIdSet = new Set<string>();

    for (const player of players) {
      try {
        const matchIds = await client.getMatchIds(
          region,
          player.puuid,
          MATCHES_PER_PLAYER
        );
        matchIds.forEach((id) => matchIdSet.add(id));
      } catch (err) {
        if (err instanceof RiotApiError && err.statusCode === 404) {
          // Player might have transferred or been banned — skip
          continue;
        }
        logger.warn(`Failed to get match IDs for ${player.puuid}`, {
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }

    logger.info(`Found ${matchIdSet.size} unique match IDs in ${region}`);

    // Fetch and store each new match
    for (const matchId of matchIdSet) {
      try {
        // Skip if already ingested
        if (await matchExists(matchId)) {
          totalSkipped++;
          continue;
        }

        const matchData = await client.getMatchAuto(matchId);
        const info = matchData.info;

        // Only ingest ranked TFT games
        if (info.queue_id !== 1100) {
          totalSkipped++;
          continue;
        }

        // Extract patch version from game_version
        // Format: "Version 14.23.123.456" → "14.23"
        // TODO: use patchVersion for per-patch tracking
        extractPatchVersion(info.game_version);

        await insertMatch({
          matchId: matchData.metadata.match_id,
          patchId: currentPatch?.id ?? 0,
          gameVersion: info.game_version,
          gameDatetime: new Date(info.game_datetime),
          gameLengthSeconds: Math.round(info.game_length),
          queueId: info.queue_id,
          setNumber: info.tft_set_number,
        });

        const participantRows = info.participants.map((p) => ({
          matchId: matchData.metadata.match_id,
          puuid: p.puuid,
          placement: p.placement,
          level: p.level,
          goldLeft: p.gold_left,
          lastRound: p.last_round,
          playersEliminated: p.players_eliminated,
          augments: JSON.stringify(p.augments ?? []),
          traits: JSON.stringify(p.traits ?? []),
          units: JSON.stringify(p.units ?? []),
        }));

        await insertParticipants(participantRows);

        totalNewMatches++;
        totalParticipants += participantRows.length;

        if (totalNewMatches % 50 === 0) {
          logger.info(`Progress: ${totalNewMatches} new matches ingested`, {
            region,
            rateLimits: client.rateLimitStats,
          });
        }
      } catch (err) {
        if (err instanceof RiotApiError && err.statusCode === 404) {
          // Match might have been deleted — skip
          continue;
        }
        logger.warn(`Failed to ingest match ${matchId}`, {
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }

    logger.info(`Finished region ${region}`, {
      region,
      newMatches: totalNewMatches,
      skipped: totalSkipped,
    });
  }

  // Update patch match count
  if (currentPatch && totalNewMatches > 0) {
    await incrementMatchCount(currentPatch.id, totalNewMatches);
  }

  const durationMs = Date.now() - startTime;
  logger.info("Match ingestion complete", {
    totalNewMatches,
    totalParticipants,
    totalSkipped,
    durationMs,
  });
}

function extractPatchVersion(gameVersion: string): string {
  // "Version 14.23.123.456" → "14.23"
  const match = gameVersion.match(/(\d+\.\d+)/);
  return match?.[1] ?? "unknown";
}

// ─── Entry Point ────────────────────────────────────────────────────────────

ingestMatches()
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
