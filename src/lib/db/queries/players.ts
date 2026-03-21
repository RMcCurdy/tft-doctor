import { eq, sql, lt, asc } from "drizzle-orm";
import { db } from "@/lib/db";
import { players } from "@/lib/db/schema";

export async function upsertPlayer(data: {
  puuid: string;
  summonerName?: string;
  region: string;
  tier: string;
  leaguePoints: number;
}) {
  await db
    .insert(players)
    .values({
      ...data,
      lastFetchedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: players.puuid,
      set: {
        summonerName: data.summonerName,
        tier: data.tier,
        leaguePoints: data.leaguePoints,
        lastFetchedAt: new Date(),
      },
    });
}

export async function upsertPlayers(
  rows: {
    puuid: string;
    summonerName?: string;
    region: string;
    tier: string;
    leaguePoints: number;
  }[]
) {
  if (rows.length === 0) return;

  // Batch insert with upsert — process in chunks to avoid query size limits
  const CHUNK_SIZE = 100;
  for (let i = 0; i < rows.length; i += CHUNK_SIZE) {
    const chunk = rows.slice(i, i + CHUNK_SIZE);
    await db
      .insert(players)
      .values(
        chunk.map((row) => ({
          ...row,
          lastFetchedAt: new Date(),
        }))
      )
      .onConflictDoUpdate({
        target: players.puuid,
        set: {
          tier: sql`EXCLUDED.tier`,
          leaguePoints: sql`EXCLUDED.league_points`,
          lastFetchedAt: new Date(),
        },
      });
  }
}

/** Get players that need match ingestion (oldest fetched first) */
export async function getPlayersForIngestion(
  region: string,
  limit = 100
): Promise<{ puuid: string; region: string }[]> {
  return db
    .select({ puuid: players.puuid, region: players.region })
    .from(players)
    .where(eq(players.region, region))
    .orderBy(asc(players.lastFetchedAt))
    .limit(limit);
}

/** Get all tracked players for a region */
export async function getPlayersByRegion(region: string) {
  return db
    .select()
    .from(players)
    .where(eq(players.region, region));
}

/** Get total player count */
export async function getPlayerCount(): Promise<number> {
  const [result] = await db
    .select({ count: sql<number>`count(*)` })
    .from(players);
  return result?.count ?? 0;
}

/** Remove players not seen in the last N days (demoted out of Master+) */
export async function pruneInactivePlayers(olderThanDays: number) {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - olderThanDays);

  const result = await db
    .delete(players)
    .where(lt(players.lastFetchedAt, cutoff))
    .returning({ puuid: players.puuid });
  return result.length;
}
