/**
 * Riot API endpoint URL builders for TFT.
 *
 * Platform regions (na1, euw1, kr) are used for league/summoner endpoints.
 * Routing regions (americas, europe, asia) are used for match endpoints.
 */

import {
  RIOT_API_REGIONS,
  RIOT_ROUTING_REGIONS,
  REGION_TO_ROUTING,
} from "@/lib/constants";
import type { RiotRegion, RiotRoutingRegion } from "@/types/riot";

function platformUrl(region: RiotRegion): string {
  return RIOT_API_REGIONS[region] ?? RIOT_API_REGIONS.na1;
}

function routingUrl(region: RiotRegion): string {
  const routing = REGION_TO_ROUTING[region] ?? "americas";
  return RIOT_ROUTING_REGIONS[routing];
}

// ─── League Endpoints ───────────────────────────────────────────────────────

/** Get all Challenger TFT players for a region */
export function getChallengerLeague(region: RiotRegion): string {
  return `${platformUrl(region)}/tft/league/v1/challenger`;
}

/** Get all Grandmaster TFT players for a region */
export function getGrandmasterLeague(region: RiotRegion): string {
  return `${platformUrl(region)}/tft/league/v1/grandmaster`;
}

/** Get all Master TFT players for a region */
export function getMasterLeague(region: RiotRegion): string {
  return `${platformUrl(region)}/tft/league/v1/master`;
}

// ─── Match Endpoints ────────────────────────────────────────────────────────

/** Get recent match IDs for a player (uses routing region) */
export function getMatchIdsByPuuid(
  region: RiotRegion,
  puuid: string,
  count = 20
): string {
  return `${routingUrl(region)}/tft/match/v1/matches/by-puuid/${puuid}/ids?count=${count}`;
}

/** Get full match data by match ID (uses routing region) */
export function getMatchById(region: RiotRegion, matchId: string): string {
  return `${routingUrl(region)}/tft/match/v1/matches/${matchId}`;
}

// ─── Summoner Endpoints ─────────────────────────────────────────────────────

/** Get summoner by PUUID */
export function getSummonerByPuuid(region: RiotRegion, puuid: string): string {
  return `${platformUrl(region)}/tft/summoner/v1/summoners/by-puuid/${puuid}`;
}

// ─── Routing Helpers ────────────────────────────────────────────────────────

/** Get the routing region for a platform region */
export function getRoutingRegion(region: RiotRegion): RiotRoutingRegion {
  return (REGION_TO_ROUTING[region] ?? "americas") as RiotRoutingRegion;
}

/** Determine the platform region from a match ID prefix (e.g., "NA1_123" → "na1") */
export function regionFromMatchId(matchId: string): RiotRegion {
  const prefix = matchId.split("_")[0]?.toLowerCase();
  // Map match ID prefixes to platform regions
  const prefixMap: Record<string, RiotRegion> = {
    na1: "na1",
    euw1: "euw1",
    kr: "kr",
    jp1: "jp1",
    oc1: "oc1",
    br1: "br1",
    la1: "la1",
    la2: "la2",
    tr1: "tr1",
    ru: "ru",
  };
  return prefixMap[prefix] ?? "na1";
}
