import { NextResponse } from "next/server";
import { getCompArchetypes as getMockComps } from "@/lib/mock-data";
import { db } from "@/lib/db";
import { compArchetypes } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getCurrentPatch } from "@/lib/db/queries/patches";
import type { CompChampion, ActiveTrait, EarlyBoardChampion } from "@/types/comp";

const useMockData = process.env.USE_MOCK_DATA === "true";

/** Build coreChampions from available DB data */
function buildCoreChampions(
  primaryCarry: string | null,
  secondaryCarry: string | null,
  dbCoreChampions: CompChampion[]
): CompChampion[] {
  if (dbCoreChampions && dbCoreChampions.length > 0) {
    return dbCoreChampions;
  }

  const champions: CompChampion[] = [];

  if (primaryCarry) {
    const name = primaryCarry.replace("TFT16_", "").replace(/([A-Z])/g, " $1").trim();
    champions.push({
      championId: primaryCarry,
      championName: name,
      starLevel: 2,
      recommendedItems: [],
      isCarry: true,
    });
  }

  if (secondaryCarry) {
    const name = secondaryCarry.replace("TFT16_", "").replace(/([A-Z])/g, " $1").trim();
    champions.push({
      championId: secondaryCarry,
      championName: name,
      starLevel: 2,
      recommendedItems: [],
      isCarry: true,
    });
  }

  return champions;
}

/** Parse traits from DB — supports both full array and legacy {name: tier} map */
function parseTraits(traitSignature: unknown): ActiveTrait[] {
  if (Array.isArray(traitSignature)) {
    // Full traits array (new format)
    return traitSignature as ActiveTrait[];
  }

  // Legacy format: {traitName: breakpointTier}
  const map = traitSignature as Record<string, number> | null;
  if (!map) return [];

  return Object.entries(map).map(([name, tier]) => ({
    traitId: `TFT16_${name}`,
    traitName: name,
    activeUnits: tier * 2,
    breakpointReached: tier,
    maxBreakpoint: tier + 2,
    style: (tier >= 3 ? "gold" : tier >= 2 ? "silver" : "bronze") as ActiveTrait["style"],
  }));
}

export async function GET() {
  if (useMockData) {
    return NextResponse.json({ comps: getMockComps() });
  }

  try {
    const currentPatch = await getCurrentPatch();
    if (!currentPatch) {
      return NextResponse.json({ comps: [] });
    }

    const comps = await db
      .select()
      .from(compArchetypes)
      .where(eq(compArchetypes.patchId, currentPatch.id))
      .orderBy(compArchetypes.avgPlacement);

    const seen = new Set<string>();
    const mapped = comps.map((c) => {
      let slug = c.compName?.toLowerCase().replace(/\s+/g, "-") ?? `comp-${c.id}`;
      if (seen.has(slug)) slug = `${slug}-${c.id}`;
      seen.add(slug);

      return {
        id: slug,
        name: c.compName ?? "Unknown",
        patchId: currentPatch.patchVersion,
        traits: parseTraits(c.traitSignature),
        coreChampions: buildCoreChampions(
          c.primaryCarry,
          c.secondaryCarry,
          c.coreChampions as CompChampion[]
        ),
        flexChampions: (c.flexSlots as CompChampion[] | null) ?? [],
        earlyBoard: (c.earlyBoard as EarlyBoardChampion[] | null) ?? undefined,
        stats: {
          avgPlacement: parseFloat(c.avgPlacement ?? "4.5"),
          top4Rate: parseFloat(c.top4Rate ?? "0.5"),
          winRate: parseFloat(c.winRate ?? "0.125"),
          playRate: parseFloat(c.playRate ?? "0.05"),
          sampleSize: c.sampleSize ?? 0,
        },
        tier:
          parseFloat(c.avgPlacement ?? "4.5") <= 4.15
            ? "S"
            : parseFloat(c.avgPlacement ?? "4.5") <= 4.35
              ? "A"
              : parseFloat(c.avgPlacement ?? "4.5") <= 4.55
                ? "B"
                : "C",
        heroAugment: c.heroAugmentName ?? undefined,
        lastUpdated: c.lastUpdated?.toISOString() ?? new Date().toISOString(),
      };
    });

    return NextResponse.json({ comps: mapped });
  } catch (err) {
    console.error("Comps API error:", err);
    return NextResponse.json({ comps: [] }, { status: 500 });
  }
}
