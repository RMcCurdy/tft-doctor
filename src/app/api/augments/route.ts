import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { augmentStats } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getCurrentPatch } from "@/lib/db/queries/patches";

export async function GET() {
  try {
    const currentPatch = await getCurrentPatch();
    if (!currentPatch) {
      return NextResponse.json({ augments: [] });
    }

    const stats = await db
      .select()
      .from(augmentStats)
      .where(eq(augmentStats.patchId, currentPatch.id))
      .orderBy(augmentStats.avgPlacement);

    const mapped = stats.map((s) => ({
      id: s.augmentId,
      name: s.augmentId.replace("TFT16_Augment_", "").replace(/([A-Z])/g, " $1").trim(),
      avgPlacement: parseFloat(s.avgPlacement ?? "4.5"),
      pickRate: parseFloat(s.pickRate ?? "0"),
      sampleSize: s.sampleSize ?? 0,
    }));

    return NextResponse.json({ augments: mapped });
  } catch (err) {
    console.error("Augments API error:", err);
    return NextResponse.json({ augments: [] }, { status: 500 });
  }
}
