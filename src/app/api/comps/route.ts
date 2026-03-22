import { NextResponse } from "next/server";
import { getCompArchetypes as getMockComps } from "@/lib/mock-data";
import { db } from "@/lib/db";
import { compArchetypes } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getCurrentPatch } from "@/lib/db/queries/patches";

const useMockData = process.env.USE_MOCK_DATA === "true";

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

    // Map DB rows to the frontend CompArchetype shape
    const mapped = comps.map((c) => ({
      id: c.compName?.toLowerCase().replace(/\s+/g, "-") ?? `comp-${c.id}`,
      name: c.compName ?? "Unknown",
      patchId: currentPatch.patchVersion,
      traits: Object.entries((c.traitSignature as Record<string, number>) ?? {}).map(
        ([name, tier]) => ({
          traitId: `TFT16_${name}`,
          traitName: name,
          activeUnits: tier * 2,
          breakpointReached: tier,
          maxBreakpoint: tier + 2,
          style: tier >= 3 ? "gold" : tier >= 2 ? "silver" : "bronze",
        })
      ),
      coreChampions: [],
      flexChampions: [],
      stats: {
        avgPlacement: parseFloat(c.avgPlacement ?? "4.5"),
        top4Rate: parseFloat(c.top4Rate ?? "0.5"),
        winRate: parseFloat(c.winRate ?? "0.125"),
        playRate: parseFloat(c.playRate ?? "0.05"),
        sampleSize: c.sampleSize ?? 0,
      },
      tier:
        parseFloat(c.avgPlacement ?? "4.5") <= 3.5
          ? "S"
          : parseFloat(c.avgPlacement ?? "4.5") <= 4.0
            ? "A"
            : parseFloat(c.avgPlacement ?? "4.5") <= 4.5
              ? "B"
              : "C",
      lastUpdated: c.lastUpdated?.toISOString() ?? new Date().toISOString(),
    }));

    return NextResponse.json({ comps: mapped });
  } catch (err) {
    console.error("Comps API error:", err);
    return NextResponse.json({ comps: [] }, { status: 500 });
  }
}
