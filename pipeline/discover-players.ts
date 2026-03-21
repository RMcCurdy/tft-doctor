/**
 * Player Discovery Pipeline
 *
 * Fetches Challenger, Grandmaster, and Master ladders from configured regions
 * and upserts all players into the database.
 *
 * Run: npx tsx pipeline/discover-players.ts
 * Schedule: Every 12 hours via GitHub Actions
 */

import { RiotClient } from "../src/lib/riot/client";
import { upsertPlayers, getPlayerCount } from "../src/lib/db/queries/players";
import { logger } from "./utils/logger";
import type { RiotRegion } from "../src/types/riot";

// Regions to scrape — start with the most active/competitive ones
const REGIONS: RiotRegion[] = ["na1", "euw1", "kr"];

// Tiers to fetch
const TIERS = ["challenger", "grandmaster", "master"] as const;

async function discoverPlayers() {
  const startTime = Date.now();
  logger.info("Starting player discovery", { regions: REGIONS });

  const client = new RiotClient();
  let totalDiscovered = 0;

  for (const region of REGIONS) {
    logger.info(`Discovering players in ${region}`);

    for (const tier of TIERS) {
      try {
        const league = await fetchLeague(client, region, tier);

        if (!league?.entries?.length) {
          logger.warn(`No entries for ${tier} in ${region}`);
          continue;
        }

        const playerRows = league.entries
          .filter((entry) => entry.puuid && entry.puuid.length > 0)
          .map((entry) => ({
            puuid: entry.puuid,
            summonerName: undefined, // League endpoint doesn't return names
            region,
            tier: tier.toUpperCase(),
            leaguePoints: entry.leaguePoints,
          }));

        await upsertPlayers(playerRows);
        totalDiscovered += playerRows.length;

        logger.info(`Discovered ${playerRows.length} ${tier} players`, {
          region,
          tier,
          count: playerRows.length,
        });
      } catch (err) {
        logger.error(`Failed to fetch ${tier} league for ${region}`, {
          region,
          tier,
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }
  }

  const totalInDb = await getPlayerCount();
  const durationMs = Date.now() - startTime;

  logger.info("Player discovery complete", {
    totalDiscovered,
    totalInDb,
    durationMs,
    regionsProcessed: REGIONS.length,
  });
}

async function fetchLeague(
  client: RiotClient,
  region: RiotRegion,
  tier: (typeof TIERS)[number]
) {
  switch (tier) {
    case "challenger":
      return client.getChallengerLeague(region);
    case "grandmaster":
      return client.getGrandmasterLeague(region);
    case "master":
      return client.getMasterLeague(region);
  }
}

// ─── Entry Point ────────────────────────────────────────────────────────────

discoverPlayers()
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
