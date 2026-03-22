import { NextResponse } from "next/server";
import { getCompletedItems as getMockItems } from "@/lib/mock-data";
import { db } from "@/lib/db";
import { itemStats } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getCurrentPatch } from "@/lib/db/queries/patches";

const useMockData = process.env.USE_MOCK_DATA === "true";

export async function GET() {
  if (useMockData) {
    return NextResponse.json({ items: getMockItems() });
  }

  try {
    const currentPatch = await getCurrentPatch();
    if (!currentPatch) {
      return NextResponse.json({ items: [] });
    }

    // Get overall item stats (not per-comp)
    const stats = await db
      .select()
      .from(itemStats)
      .where(eq(itemStats.patchId, currentPatch.id))
      .orderBy(itemStats.avgPlacement);

    const mapped = stats.map((s) => ({
      id: s.itemId,
      name: s.itemId.replace("TFT_Item_", "").replace(/([A-Z])/g, " $1").trim(),
      avgPlacement: parseFloat(s.avgPlacement ?? "4.5"),
      usageRate: parseFloat(s.usageRate ?? "0"),
      sampleSize: s.sampleSize ?? 0,
    }));

    return NextResponse.json({ items: mapped });
  } catch (err) {
    console.error("Items API error:", err);
    return NextResponse.json({ items: [] }, { status: 500 });
  }
}
