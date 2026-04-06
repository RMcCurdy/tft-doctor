/**
 * Typed Riot API client for TFT endpoints.
 *
 * Handles:
 * - API key injection via headers
 * - Rate limiting (token bucket, respects 429 Retry-After)
 * - Automatic retries with exponential backoff for transient errors
 * - Typed responses for all TFT endpoints
 *
 * Usage:
 *   const client = new RiotClient(apiKey);
 *   const league = await client.getChallengerLeague("na1");
 *   const match = await client.getMatch("na1", "NA1_123456");
 */

import type {
  RiotMatchResponse,
  RiotLeagueResponse,
  RiotMatchIdList,
  RiotRegion,
} from "@/types/riot";
import * as endpoints from "./endpoints";
import { RateLimiter, DEV_KEY_LIMITS, PROD_KEY_LIMITS, type RateLimitConfig } from "../../../pipeline/utils/rate-limiter";

const MAX_RETRIES = 3;
const RETRY_BASE_MS = 1000;

export class RiotApiError extends Error {
  constructor(
    public statusCode: number,
    public statusText: string,
    public url: string
  ) {
    super(`Riot API ${statusCode} ${statusText}: ${url}`);
    this.name = "RiotApiError";
  }
}

export class RiotRateLimitError extends Error {
  constructor(
    public retryAfterSeconds: number,
    public url: string
  ) {
    super(
      `Riot API rate limit exceeded. Retry after ${retryAfterSeconds}s: ${url}`
    );
    this.name = "RiotRateLimitError";
  }
}

export class RiotClient {
  private apiKey: string;
  private rateLimiter: RateLimiter;

  constructor(apiKey?: string, options?: { production?: boolean; rateLimits?: RateLimitConfig }) {
    this.apiKey = apiKey ?? process.env.RIOT_API_KEY ?? "";
    if (!this.apiKey) {
      throw new Error(
        "RIOT_API_KEY is not set. Pass it to the constructor or set it in env vars."
      );
    }
    const defaultLimits = options?.production ? PROD_KEY_LIMITS : DEV_KEY_LIMITS;
    this.rateLimiter = new RateLimiter(options?.rateLimits ?? defaultLimits);
  }

  // ─── League Endpoints ───────────────────────────────────────────────────

  async getChallengerLeague(region: RiotRegion): Promise<RiotLeagueResponse> {
    return this.get(endpoints.getChallengerLeague(region));
  }

  async getGrandmasterLeague(region: RiotRegion): Promise<RiotLeagueResponse> {
    return this.get(endpoints.getGrandmasterLeague(region));
  }

  async getMasterLeague(region: RiotRegion): Promise<RiotLeagueResponse> {
    return this.get(endpoints.getMasterLeague(region));
  }

  // ─── Match Endpoints ──────────────────────────────────────────────────

  async getMatchIds(
    region: RiotRegion,
    puuid: string,
    count = 20
  ): Promise<RiotMatchIdList> {
    return this.get(endpoints.getMatchIdsByPuuid(region, puuid, count));
  }

  async getMatch(
    region: RiotRegion,
    matchId: string
  ): Promise<RiotMatchResponse> {
    return this.get(endpoints.getMatchById(region, matchId));
  }

  // ─── Convenience: Fetch match using region from match ID prefix ───────

  async getMatchAuto(matchId: string): Promise<RiotMatchResponse> {
    const region = endpoints.regionFromMatchId(matchId);
    return this.getMatch(region, matchId);
  }

  // ─── Rate Limiter Stats ───────────────────────────────────────────────

  get rateLimitStats() {
    return this.rateLimiter.stats;
  }

  // ─── Core Fetch ───────────────────────────────────────────────────────

  private async get<T>(url: string): Promise<T> {
    let lastError: Error | null = null;
    let lastRetryAfter = 10;

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      await this.rateLimiter.acquire();

      try {
        const res = await fetch(url, {
          headers: {
            "X-Riot-Token": this.apiKey,
            Accept: "application/json",
          },
          signal: AbortSignal.timeout(30_000),
        });

        // Rate limited — wait and retry
        if (res.status === 429) {
          lastRetryAfter = parseInt(
            res.headers.get("Retry-After") ?? "10",
            10
          );
          lastError = new RiotRateLimitError(lastRetryAfter, url);
          await this.rateLimiter.handleRateLimit(lastRetryAfter);
          continue;
        }

        // Transient server errors — retry with backoff
        if (res.status >= 500) {
          lastError = new RiotApiError(res.status, res.statusText, url);
          await sleep(RETRY_BASE_MS * Math.pow(2, attempt));
          continue;
        }

        // Client errors (400, 403, 404) — don't retry
        if (!res.ok) {
          throw new RiotApiError(res.status, res.statusText, url);
        }

        return (await res.json()) as T;
      } catch (err) {
        if (err instanceof RiotApiError) throw err;
        if (err instanceof RiotRateLimitError) throw err;

        // Network errors — retry
        lastError = err instanceof Error ? err : new Error(String(err));
        await sleep(RETRY_BASE_MS * Math.pow(2, attempt));
      }
    }

    // If we exhausted retries due to rate limiting, throw specific error
    if (lastError instanceof RiotRateLimitError) throw lastError;

    throw lastError ?? new Error(`Failed after ${MAX_RETRIES} retries: ${url}`);
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
