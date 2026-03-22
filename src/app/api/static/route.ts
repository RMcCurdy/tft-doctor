import { NextResponse } from "next/server";
import {
  getChampions as getMockChampions,
  getItems as getMockItems,
  getTraits as getMockTraits,
} from "@/lib/mock-data";

interface StaticEntity {
  id: string;
  name: string;
  icon: string;
}

const CACHE_HEADERS = {
  "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
};

function getMockStaticData() {
  return {
    champions: getMockChampions().map((c) => ({ id: c.id, name: c.name, icon: c.icon, cost: c.cost })),
    items: getMockItems().map((i) => ({ id: i.id, name: i.name, icon: i.icon, isEmblem: i.isEmblem, components: i.components })),
    traits: getMockTraits().map((t) => ({ id: t.id, name: t.name, icon: t.icon })),
  };
}

export async function GET() {
  const useMockData = process.env.USE_MOCK_DATA === "true";

  if (useMockData) {
    return NextResponse.json(getMockStaticData(), { headers: CACHE_HEADERS });
  }

  // Real DB mode — query staticData table, fall back to mock if empty
  try {
    const { db } = await import("@/lib/db");
    const { staticData } = await import("@/lib/db/schema");
    const { inArray } = await import("drizzle-orm");

    const rows = await db
      .select()
      .from(staticData)
      .where(inArray(staticData.dataType, ["champions", "items", "traits"]));

    const result: Record<string, StaticEntity[]> = {
      champions: [],
      items: [],
      traits: [],
    };

    for (const row of rows) {
      const entities = (row.data as Array<{ id: string; name: string; icon: string; cost?: number; isEmblem?: boolean; components?: string[] }>) ?? [];
      result[row.dataType] = entities.map((e) => ({
        id: e.id,
        name: e.name,
        icon: e.icon,
        ...(e.cost !== undefined && { cost: e.cost }),
        ...(e.isEmblem !== undefined && { isEmblem: e.isEmblem }),
        ...(e.components !== undefined && { components: e.components }),
      }));
    }

    // Fall back to mock data if DB has no static data
    const hasData = result.champions.length > 0 || result.items.length > 0 || result.traits.length > 0;
    if (!hasData) {
      return NextResponse.json(getMockStaticData(), { headers: CACHE_HEADERS });
    }

    return NextResponse.json(result, { headers: CACHE_HEADERS });
  } catch (err) {
    console.error("Static data API error:", err);
    // Fall back to mock data on error
    return NextResponse.json(getMockStaticData(), { headers: CACHE_HEADERS });
  }
}
