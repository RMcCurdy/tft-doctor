import { NextResponse } from "next/server";
import { getCurrentPatch } from "@/lib/db/queries/patches";

export async function GET() {
  try {
    const patch = await getCurrentPatch();
    if (!patch) {
      return NextResponse.json({
        patchVersion: "unknown",
        dataStatus: "no-data",
        matchCount: 0,
        message: "No patch detected. Run the detect-patch pipeline.",
      });
    }

    return NextResponse.json({
      patchVersion: patch.patchVersion,
      setNumber: patch.setNumber,
      isCurrent: patch.isCurrent,
      dataSufficient: patch.dataSufficient,
      dataStatus: patch.dataSufficient ? "live" : "collecting",
      matchCount: patch.matchCount ?? 0,
      lastUpdated: new Date().toISOString(),
      message: patch.dataSufficient
        ? "Live data — recommendations are based on real match data."
        : `Collecting data (${patch.matchCount ?? 0} matches so far). Recommendations improve as more data is ingested.`,
    });
  } catch (err) {
    console.error("Patch API error:", err);
    return NextResponse.json(
      { patchVersion: "error", dataStatus: "error", matchCount: 0 },
      { status: 500 }
    );
  }
}
