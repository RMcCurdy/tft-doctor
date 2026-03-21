import { eq, isNull, lt, and, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { matches, participants } from "@/lib/db/schema";

export async function matchExists(matchId: string): Promise<boolean> {
  const [row] = await db
    .select({ matchId: matches.matchId })
    .from(matches)
    .where(eq(matches.matchId, matchId))
    .limit(1);
  return !!row;
}

export async function insertMatch(data: {
  matchId: string;
  patchId: number;
  gameVersion: string;
  gameDatetime: Date;
  gameLengthSeconds: number;
  queueId: number;
  setNumber: number;
}) {
  await db.insert(matches).values(data).onConflictDoNothing();
}

export async function insertParticipants(
  rows: {
    matchId: string;
    puuid: string;
    placement: number;
    level: number;
    goldLeft: number;
    lastRound: number;
    playersEliminated: number;
    augments: unknown;
    traits: unknown;
    units: unknown;
  }[]
) {
  if (rows.length === 0) return;
  await db.insert(participants).values(rows).onConflictDoNothing();
}

export async function markMatchesProcessed(matchIds: string[]) {
  if (matchIds.length === 0) return;
  await db
    .update(matches)
    .set({ processedAt: new Date() })
    .where(
      sql`${matches.matchId} IN (${sql.join(
        matchIds.map((id) => sql`${id}`),
        sql`, `
      )})`
    );
}

export async function getUnprocessedMatches(patchId: number, limit = 1000) {
  return db
    .select()
    .from(matches)
    .where(and(eq(matches.patchId, patchId), isNull(matches.processedAt)))
    .limit(limit);
}

export async function getParticipantsForMatches(matchIds: string[]) {
  if (matchIds.length === 0) return [];
  return db
    .select()
    .from(participants)
    .where(
      sql`${participants.matchId} IN (${sql.join(
        matchIds.map((id) => sql`${id}`),
        sql`, `
      )})`
    );
}

/**
 * Purge raw match/participant data older than the given date.
 * Only purges matches that have already been processed (aggregated).
 */
export async function purgeOldMatchData(olderThan: Date) {
  // Cascade delete handles participants via ON DELETE CASCADE
  const result = await db
    .delete(matches)
    .where(
      and(
        lt(matches.processedAt, olderThan),
        sql`${matches.processedAt} IS NOT NULL`
      )
    )
    .returning({ matchId: matches.matchId });
  return result.length;
}
