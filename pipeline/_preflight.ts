/**
 * Pre-flight check for the continuous ingestion script.
 * Verifies: env vars, DB connectivity, tables exist, API key validity.
 *
 * Run: npx tsx pipeline/_preflight.ts
 * Delete after use.
 */

import { db } from "../src/lib/db";
import { players, matches, patches } from "../src/lib/db/schema";
import { sql } from "drizzle-orm";
import { getCurrentVersion } from "../src/lib/ddragon/client";

async function preflight() {
  let allGood = true;

  // 1. Check env vars
  console.log("--- Environment Variables ---");
  const hasDb = Boolean(process.env.DATABASE_URL);
  const hasKey = Boolean(process.env.RIOT_API_KEY);
  console.log(`DATABASE_URL: ${hasDb ? "SET" : "MISSING"}`);
  console.log(`RIOT_API_KEY: ${hasKey ? "SET (prefix: " + process.env.RIOT_API_KEY?.substring(0, 8) + "...)" : "MISSING"}`);
  if (!hasDb || !hasKey) allGood = false;

  // 2. Check DB tables
  console.log("\n--- Database Tables ---");
  for (const [name, table] of [["patches", patches], ["players", players], ["matches", matches]] as const) {
    try {
      const [result] = await db.select({ count: sql<number>`count(*)` }).from(table);
      console.log(`${name}: OK (${result?.count} rows)`);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      console.log(`${name}: FAIL — ${msg}`);
      allGood = false;
    }
  }

  // 3. Check DDragon connectivity
  console.log("\n--- Data Dragon ---");
  try {
    const version = await getCurrentVersion();
    console.log(`DDragon version: ${version} — OK`);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    console.log(`DDragon: FAIL — ${msg}`);
    allGood = false;
  }

  // 4. Check Riot API key validity
  console.log("\n--- Riot API Key ---");
  try {
    const res = await fetch("https://na1.api.riotgames.com/tft/league/v1/challenger", {
      headers: { "X-Riot-Token": process.env.RIOT_API_KEY ?? "" },
    });
    if (res.ok) {
      const data = await res.json();
      console.log(`Challenger league: ${data.entries?.length ?? 0} entries — API key is VALID`);
    } else if (res.status === 401 || res.status === 403) {
      console.log(`API key is EXPIRED or INVALID (${res.status}). Regenerate at https://developer.riotgames.com/`);
      allGood = false;
    } else {
      console.log(`Unexpected status: ${res.status} ${res.statusText}`);
      allGood = false;
    }
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    console.log(`API check: FAIL — ${msg}`);
    allGood = false;
  }

  // Summary
  console.log("\n" + (allGood ? "=== ALL CHECKS PASSED ===" : "=== SOME CHECKS FAILED — fix issues before running ingestion ==="));
}

preflight()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error("Preflight error:", e);
    process.exit(1);
  });
