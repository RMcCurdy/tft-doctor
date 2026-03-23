/**
 * Continuous NA Match Ingestion
 *
 * Discovers Challenger and Grandmaster players in NA, then continuously
 * loops through them in small batches, fetching recent matches.
 *
 * Respects dev API key rate limits (20 req/sec, 100 req/2min) via the
 * built-in token bucket rate limiter in RiotClient. Every API call goes
 * through acquire() which automatically waits when either limit window
 * is exhausted — no artificial delays needed.
 *
 * Run: npx tsx pipeline/ingest-na-continuous.ts
 * Expected duration: ~2 hours for a full pass of all NA Challenger + GM players
 */

import { RiotClient, RiotApiError } from "../src/lib/riot/client";
import type { RateLimitConfig } from "./utils/rate-limiter";
import {
  upsertPlayers,
  getPlayersForIngestion,
  markPlayerFetched,
  getPlayerCountByRegionAndTiers,
} from "../src/lib/db/queries/players";
import {
  matchExists,
  insertMatch,
  insertParticipants,
} from "../src/lib/db/queries/matches";
import {
  getCurrentPatch,
  upsertPatch,
  markPatchAsCurrent,
  getPatchByVersion,
  incrementMatchCount,
} from "../src/lib/db/queries/patches";
import { getCurrentVersion } from "../src/lib/ddragon/client";
import { logger } from "./utils/logger";
import type { RiotRegion } from "../src/types/riot";

// ─── Configuration ──────────────────────────────────────────────────────────

const REGION: RiotRegion = "na1";
const TARGET_TIERS = ["CHALLENGER", "GRANDMASTER"];
const BATCH_SIZE = 20; // Logging checkpoint — rate limiter handles pacing
const MATCHES_PER_PLAYER = 10;

// 10% safety margin under Riot's dev key limits (20/s, 100/2min)
// Avoids 429s from clock drift or Riot counting differently
const SAFE_DEV_LIMITS: RateLimitConfig = {
  shortLimit: 18,
  shortWindowMs: 1_000,
  longLimit: 90,
  longWindowMs: 120_000,
};

// ─── Graceful Shutdown ──────────────────────────────────────────────────────

let shutdownRequested = false;

function setupGracefulShutdown() {
  const handler = () => {
    if (shutdownRequested) {
      logger.warn("Force shutdown requested. Exiting immediately.");
      process.exit(1);
    }
    shutdownRequested = true;
    logger.info("Shutdown requested. Finishing current batch...");
  };
  process.on("SIGINT", handler);
  process.on("SIGTERM", handler);
}

// ─── Phase 1: Ensure Patch Exists ───────────────────────────────────────────

async function ensurePatch(): Promise<{ id: number; patchVersion: string }> {
  logger.info("Checking for current patch...");

  const existing = await getCurrentPatch();
  if (existing) {
    logger.info(`Current patch: ${existing.patchVersion} (id=${existing.id})`);
    return { id: existing.id, patchVersion: existing.patchVersion };
  }

  // No patch in DB — detect from DDragon
  logger.info("No current patch found. Detecting from Data Dragon...");
  const version = await getCurrentVersion();
  const patchVersion = version.split(".").slice(0, 2).join(".");
  const setNumber = parseInt(patchVersion.split(".")[0], 10);

  const patch = await upsertPatch({
    patchVersion,
    setNumber,
    releaseDate: new Date(),
    isCurrent: true,
  });

  // Mark as current
  const patchRow = await getPatchByVersion(patchVersion);
  if (patchRow) {
    await markPatchAsCurrent(patchRow.id);
    logger.info(`Created and activated patch ${patchVersion} (id=${patchRow.id})`);
    return { id: patchRow.id, patchVersion };
  }

  // Fallback — should not happen
  if (patch) {
    return { id: patch.id, patchVersion };
  }

  throw new Error("Failed to create patch record");
}

// ─── Phase 2: Discover Players ──────────────────────────────────────────────

async function discoverNAPlayers(client: RiotClient): Promise<number> {
  logger.info("Discovering NA Challenger and Grandmaster players...");

  let totalDiscovered = 0;

  for (const tier of TARGET_TIERS) {
    try {
      const league =
        tier === "CHALLENGER"
          ? await client.getChallengerLeague(REGION)
          : await client.getGrandmasterLeague(REGION);

      if (!league?.entries?.length) {
        logger.warn(`No entries for ${tier} in ${REGION}`);
        continue;
      }

      const playerRows = league.entries
        .filter((entry) => entry.puuid && entry.puuid.length > 0)
        .map((entry) => ({
          puuid: entry.puuid,
          summonerName: undefined,
          region: REGION,
          tier,
          leaguePoints: entry.leaguePoints,
        }));

      await upsertPlayers(playerRows);
      totalDiscovered += playerRows.length;

      logger.info(`Discovered ${playerRows.length} ${tier} players`);
    } catch (err) {
      logger.error(`Failed to fetch ${tier} league`, {
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  return totalDiscovered;
}

// ─── Phase 3: Continuous Ingestion Loop ─────────────────────────────────────

async function ingestLoop(
  client: RiotClient,
  patchId: number,
  totalPlayers: number
) {
  let playersProcessed = 0;
  let cumulativeNewMatches = 0;
  let cumulativeSkipped = 0;
  let iteration = 0;

  while (!shutdownRequested) {
    iteration++;

    const batch = await getPlayersForIngestion(
      REGION,
      BATCH_SIZE,
      TARGET_TIERS
    );

    if (batch.length === 0) {
      logger.info("No more players to process. All done!");
      break;
    }

    let batchNewMatches = 0;
    let batchSkipped = 0;
    const batchMatchIdsSeen = new Set<string>();

    for (const player of batch) {
      try {
        const matchIds = await client.getMatchIds(
          REGION,
          player.puuid,
          MATCHES_PER_PLAYER
        );

        for (const matchId of matchIds) {
          // Deduplicate within this batch
          if (batchMatchIdsSeen.has(matchId)) continue;
          batchMatchIdsSeen.add(matchId);

          try {
            // Skip if already in DB
            if (await matchExists(matchId)) {
              batchSkipped++;
              continue;
            }

            const matchData = await client.getMatchAuto(matchId);
            const info = matchData.info;

            // Only ingest ranked TFT games
            if (info.queue_id !== 1100) {
              batchSkipped++;
              continue;
            }

            await insertMatch({
              matchId: matchData.metadata.match_id,
              patchId,
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
            batchNewMatches++;
          } catch (err) {
            if (err instanceof RiotApiError && err.statusCode === 404) {
              continue; // Match deleted or unavailable
            }
            logger.warn(`Failed to ingest match ${matchId}`, {
              error: err instanceof Error ? err.message : String(err),
            });
          }
        }
      } catch (err) {
        if (err instanceof RiotApiError && err.statusCode === 404) {
          // Player transferred or banned — skip but still mark as fetched
        } else {
          logger.warn(`Failed to get match IDs for player ${player.puuid.slice(0, 8)}...`, {
            error: err instanceof Error ? err.message : String(err),
          });
        }
      }

      // Advance cursor so this player isn't re-fetched next iteration
      await markPlayerFetched(player.puuid);
      playersProcessed++;
    }

    cumulativeNewMatches += batchNewMatches;
    cumulativeSkipped += batchSkipped;

    const progress = totalPlayers > 0
      ? ((playersProcessed / totalPlayers) * 100).toFixed(1)
      : "?";

    logger.info(`Batch ${iteration} complete`, {
      playersInBatch: batch.length,
      playersProcessed,
      totalPlayers,
      progress: `${progress}%`,
      batchNewMatches,
      batchSkipped,
      cumulativeNewMatches,
      rateLimits: client.rateLimitStats,
    });

    // Check if we've processed all players
    if (playersProcessed >= totalPlayers) {
      logger.info("All players processed!");
      break;
    }

    // Check for shutdown between batches
    if (shutdownRequested) break;
  }

  return { playersProcessed, cumulativeNewMatches, cumulativeSkipped };
}

// ─── Main ───────────────────────────────────────────────────────────────────

async function main() {
  const startTime = Date.now();
  setupGracefulShutdown();

  logger.info("=== Continuous NA Ingestion Starting ===");
  logger.info(`Config: batch=${BATCH_SIZE}, matchesPerPlayer=${MATCHES_PER_PLAYER}, rateLimits=${SAFE_DEV_LIMITS.shortLimit}/s+${SAFE_DEV_LIMITS.longLimit}/2min (10% buffer)`);

  // Phase 1: Ensure patch exists
  const patch = await ensurePatch();

  // Phase 2: Discover players
  const client = new RiotClient(undefined, { rateLimits: SAFE_DEV_LIMITS });
  const discovered = await discoverNAPlayers(client);
  const totalPlayers = await getPlayerCountByRegionAndTiers(REGION, TARGET_TIERS);

  logger.info(`Player pool: ${totalPlayers} total (${discovered} just discovered/updated)`);

  if (totalPlayers === 0) {
    logger.warn("No players found. Check API key and network connectivity.");
    return;
  }

  // Phase 3: Continuous ingestion
  const stats = await ingestLoop(client, patch.id, totalPlayers);

  // Phase 4: Summary
  if (stats.cumulativeNewMatches > 0) {
    await incrementMatchCount(patch.id, stats.cumulativeNewMatches);
  }

  const durationMs = Date.now() - startTime;
  const durationMin = (durationMs / 60_000).toFixed(1);

  logger.info("=== Ingestion Complete ===", {
    playersProcessed: stats.playersProcessed,
    totalPlayers,
    newMatches: stats.cumulativeNewMatches,
    skippedMatches: stats.cumulativeSkipped,
    durationMinutes: durationMin,
    patchVersion: patch.patchVersion,
  });

  if (stats.cumulativeNewMatches > 0) {
    logger.info("Next step: npx tsx pipeline/aggregate-comps.ts");
  }
}

// ─── Entry Point ────────────────────────────────────────────────────────────

main()
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
