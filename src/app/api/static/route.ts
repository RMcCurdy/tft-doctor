import { NextResponse } from "next/server";

interface StaticEntity {
  id: string;
  name: string;
  icon: string;
  cost?: number;
  isEmblem?: boolean;
  components?: string[];
  traits?: string[];
  tier?: string;
  description?: string;
}

const CACHE_HEADERS = {
  "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
};

export async function GET() {
  try {
    const { db } = await import("@/lib/db");
    const { staticData } = await import("@/lib/db/schema");

    const rows = await db.select().from(staticData);

    const result: Record<string, StaticEntity[]> = {
      champions: [],
      items: [],
      traits: [],
      augments: [],
      emblems: [],
      artifacts: [],
    };

    for (const row of rows) {
      if (!(row.dataType in result)) continue;

      // Handle both flat array format and DDragon's { type, version, data: { [key]: entry } } format
      let entities: Array<Record<string, unknown>>;

      if (Array.isArray(row.data)) {
        entities = row.data as Array<Record<string, unknown>>;
      } else {
        const raw = row.data as Record<string, unknown>;
        const dataObj = (raw.data ?? raw) as Record<string, Record<string, unknown>>;
        entities = Object.values(dataObj);
      }

      result[row.dataType] = entities.map((e) => {
        const image = e.image as Record<string, unknown> | undefined;
        return {
          id: (e.id ?? e.apiName) as string,
          name: e.name as string,
          icon: (e.icon ?? image?.full ?? "") as string,
          ...(e.cost !== undefined && { cost: e.cost as number }),
          ...(e.isEmblem !== undefined && { isEmblem: e.isEmblem as boolean }),
          ...(e.components !== undefined && { components: e.components as string[] }),
          ...(e.traits !== undefined && { traits: e.traits as string[] }),
          ...(e.tier !== undefined && { tier: e.tier as string }),
          ...(e.description !== undefined && { description: e.description as string }),
        };
      });
    }

    return NextResponse.json(result, { headers: CACHE_HEADERS });
  } catch (err) {
    console.error("Static data API error:", err);
    return NextResponse.json(
      { champions: [], items: [], traits: [], augments: [], emblems: [], artifacts: [] },
      { status: 500 }
    );
  }
}
