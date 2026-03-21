import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    patchVersion: "16.6",
    setNumber: 16,
    setName: "TFT Set 16",
    isCurrent: true,
    dataStatus: "mock",
    matchCount: 48750,
    lastUpdated: new Date().toISOString(),
    message:
      "Using mock data. Connect the data pipeline to start ingesting real match data.",
  });
}
