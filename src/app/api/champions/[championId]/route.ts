import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { staticData, compArchetypes } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getCurrentPatch } from "@/lib/db/queries/patches";
import { CDRAGON_BASE_URL } from "@/lib/constants";
import type { CompChampion } from "@/types/comp";
import type {
  ChampionAbility,
  ChampionTraitDetail,
  SuggestedItem,
  ChampionDetailData,
} from "@/types/game";

const CACHE_HEADERS = {
  "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
};

// ─── CDragon data cache (persists across requests in the same server instance) ─

interface AbilityVariable {
  name: string;
  value: number[];
}

interface CDragonChampion {
  apiName: string;
  name: string;
  cost: number;
  traits: string[];
  icon: string;
  ability: {
    name: string;
    desc: string;
    icon: string;
    variables: AbilityVariable[];
  };
}

interface CDragonTrait {
  apiName: string;
  name: string;
  desc: string;
  icon: string;
  effects: {
    minUnits: number;
    maxUnits: number;
    style: number; // 1=bronze, 2=silver, 3=gold, 4=chromatic
    variables: Record<string, number | null>;
  }[];
}

interface CDragonSetData {
  champions: CDragonChampion[];
  traits: CDragonTrait[];
}

let cachedSetData: CDragonSetData | null = null;
let cacheTimestamp = 0;
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

const STYLE_MAP: Record<number, "bronze" | "silver" | "gold" | "chromatic"> = {
  1: "bronze",
  2: "silver",
  3: "gold",
  4: "chromatic",
};

async function getCDragonSetData(): Promise<CDragonSetData | null> {
  if (cachedSetData && Date.now() - cacheTimestamp < CACHE_TTL_MS) {
    return cachedSetData;
  }

  const res = await fetch(`${CDRAGON_BASE_URL}/cdragon/tft/en_us.json`);
  if (!res.ok) return null;

  const data = await res.json();
  const setDataArr = data.setData as Array<{
    mutator: string;
    champions: CDragonChampion[];
    traits: CDragonTrait[];
  }>;

  // Find the current set — look for the one with TFT16_ champions
  const currentSet =
    setDataArr.find((s) =>
      s.champions.some((c) => c.apiName.startsWith("TFT16_"))
    ) ?? setDataArr[setDataArr.length - 1];

  if (!currentSet) return null;

  cachedSetData = {
    champions: currentSet.champions,
    traits: currentSet.traits,
  };
  cacheTimestamp = Date.now();
  return cachedSetData;
}

// ─── Ability description template resolution ─────────────────────────────────

// ─── Description template resolution ─────────────────────────────────────────

function formatNumber(n: number): string {
  if (n === undefined || n === null) return "?";
  // Round to at most 1 decimal
  if (Number.isInteger(n)) return String(n);
  return n.toFixed(1).replace(/\.0$/, "");
}

/** Resolve a single @Var@ or @Var*100@ token against a variable map */
function resolveToken(token: string, vars: Map<string, number>): string {
  // Handle @Var*100@ patterns (percentage scaling)
  const multMatch = token.match(/^(\w+)\*(\d+)$/);
  if (multMatch) {
    const val = vars.get(multMatch[1].toLowerCase());
    if (val !== undefined) {
      return formatNumber(val * Number(multMatch[2]));
    }
  }

  const key = token.toLowerCase();
  const val = vars.get(key)
    ?? vars.get(key.replace("modified", ""))
    ?? vars.get(key.replace("total", ""));
  if (val !== undefined) return formatNumber(val);
  return token;
}

/** Strip CDragon HTML tags, scaling icons, and keyword refs */
function stripTags(text: string): string {
  return text
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/%i:scale\w+%/g, "")
    .replace(/\{\{[^}]+\}\}/g, "") // {{TFT_Keyword_Burn}} etc.
    .replace(/&nbsp;/g, " ")
    .replace(/\(\s*\)/g, "") // empty () from stripped icons
    .replace(/  +/g, " ")
    .replace(/\n\s*\n\s*\n/g, "\n\n") // collapse excess newlines
    .trim();
}

/**
 * Smart variable lookup: handles Modified/Total prefixes and _Suffix patterns.
 * Strips "modified" and "total" prefixes, tries suffix rearrangement,
 * common CDragon aliases, and fuzzy endsWith matching.
 */
function findVariable(
  key: string,
  varMap: Map<string, number[]>
): number[] | undefined {
  // Direct match
  if (varMap.has(key)) return varMap.get(key);

  // Strip "modified" / "total" prefix
  const stripped = key.replace(/^(modified|total)/, "");
  if (stripped !== key && varMap.has(stripped)) return varMap.get(stripped);

  // Handle _Suffix: @ModifiedDamage_Q@ → qdamage
  const suffixMatch = stripped.match(/^(\w+)_(\w+)$/);
  if (suffixMatch) {
    const [, base, suffix] = suffixMatch;
    const suffixed = `${suffix}${base}`.toLowerCase();
    if (varMap.has(suffixed)) return varMap.get(suffixed);
    // Also try just the suffix: qdamage, singletargetdamage
    if (varMap.has(suffix.toLowerCase())) return varMap.get(suffix.toLowerCase());
  }

  // Common CDragon name substitutions
  const aliases = stripped
    .replace("secondary", "singletarget")
    .replace("singletarget", "secondary");
  if (varMap.has(aliases)) return varMap.get(aliases);

  // Fuzzy: find first variable whose name ends with the stripped key
  for (const [k, v] of varMap) {
    if (k.endsWith(stripped)) return v;
  }

  return undefined;
}

/**
 * Resolve ability description with star-level variables.
 * Values: [0]=base, [1]=1★, [2]=2★, [3]=3★
 * Shows "X/Y/Z" when values differ by star, or just "X" when uniform.
 */
function resolveAbilityDescription(
  desc: string,
  variables: AbilityVariable[]
): string {
  const varMap = new Map<string, number[]>();
  for (const v of variables) {
    varMap.set(v.name.toLowerCase(), v.value);
  }

  const resolved = desc.replace(/@([\w*]+)@/g, (_match, token: string) => {
    // Handle @Var*100@ patterns
    const multMatch = token.match(/^(\w+)\*(\d+)$/);
    const lookupKey = multMatch ? multMatch[1].toLowerCase() : token.toLowerCase();
    const multiplier = multMatch ? Number(multMatch[2]) : 1;

    const vals = findVariable(lookupKey, varMap);
    if (!vals) return token;

    // Star-level values at indices 1-3
    const starVals = vals.slice(1, 4).filter((v) => v !== undefined);
    if (starVals.length === 0) return formatNumber(vals[0] * multiplier);

    const scaled = starVals.map((v) => formatNumber(v * multiplier));
    return scaled.every((v) => v === scaled[0]) ? scaled[0] : scaled.join("/");
  });

  return stripTags(resolved);
}

/**
 * Resolve trait description with per-breakpoint variables.
 * Expands <expandRow>...</expandRow> and <row>...</row> blocks for each
 * effect/breakpoint, substituting that breakpoint's variable values.
 */
function resolveTraitDescription(
  desc: string,
  effects: CDragonTrait["effects"]
): string {
  // Resolve simple @Var@ in the intro using values from the first effect
  const introVars = new Map<string, number>();
  if (effects[0]?.variables) {
    for (const [k, v] of Object.entries(effects[0].variables)) {
      if (typeof v === "number") introVars.set(k.toLowerCase(), v);
    }
  }

  // Expand <expandRow>template</expandRow> → one line per breakpoint
  let resolved = desc.replace(
    /<expandRow>([\s\S]*?)<\/expandRow>/gi,
    (_match, template: string) => {
      return effects
        .filter((e) => e.minUnits > 0)
        .map((effect) => {
          const vars = new Map<string, number>();
          vars.set("minunits", effect.minUnits);
          vars.set("maxunits", effect.maxUnits);
          if (effect.variables) {
            for (const [k, v] of Object.entries(effect.variables)) {
              if (typeof v === "number") vars.set(k.toLowerCase(), v);
            }
          }
          return template.replace(/@([\w*]+)@/g, (_m, tok: string) =>
            resolveToken(tok, vars)
          );
        })
        .join("\n");
    }
  );

  // Expand individual <row>...</row> blocks — each maps to a breakpoint in order
  let rowIdx = 0;
  resolved = resolved.replace(
    /<row>([\s\S]*?)<\/row>/gi,
    (_match, template: string) => {
      const effect = effects[rowIdx++];
      if (!effect) return "";
      const vars = new Map<string, number>();
      vars.set("minunits", effect.minUnits);
      vars.set("maxunits", effect.maxUnits);
      if (effect.variables) {
        for (const [k, v] of Object.entries(effect.variables)) {
          if (typeof v === "number") vars.set(k.toLowerCase(), v);
        }
      }
      return template.replace(/@([\w*]+)@/g, (_m, tok: string) =>
        resolveToken(tok, vars)
      );
    }
  );

  // Resolve remaining @Var@ with intro vars
  resolved = resolved.replace(/@([\w*]+)@/g, (_m, tok: string) =>
    resolveToken(tok, introVars)
  );

  return stripTags(resolved);
}

// ─── Item lookup from DB static data ─────────────────────────────────────────

function extractEntries(raw: unknown): Array<Record<string, unknown>> {
  if (Array.isArray(raw)) return raw as Array<Record<string, unknown>>;
  const obj = raw as Record<string, unknown>;
  const dataObj = (obj.data ?? obj) as Record<string, Record<string, unknown>>;
  return Object.values(dataObj);
}

// ─── Route handler ───────────────────────────────────────────────────────────

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ championId: string }> }
) {
  const { championId } = await params;

  try {
    // Fetch CDragon set data and DB data in parallel
    const [setData, currentPatch] = await Promise.all([
      getCDragonSetData(),
      getCurrentPatch(),
    ]);

    if (!setData) {
      return NextResponse.json(
        { error: "Failed to load game data" },
        { status: 502 }
      );
    }

    // Find champion in CDragon data
    const champ = setData.champions.find((c) => c.apiName === championId);
    if (!champ) {
      return NextResponse.json(
        { error: "Champion not found" },
        { status: 404 }
      );
    }

    // Build trait details from CDragon
    const traitMap = new Map<string, CDragonTrait>();
    for (const t of setData.traits) {
      traitMap.set(t.apiName, t);
    }

    const traits: ChampionTraitDetail[] = champ.traits.map((traitId) => {
      const t = traitMap.get(traitId);
      if (!t) {
        const displayName = traitId
          .replace(/^(Set\d+_|TFT\d+_)/, "")
          .replace(/([A-Z])/g, " $1")
          .trim();
        return { id: traitId, name: displayName, description: "", icon: "", breakpoints: [] };
      }

      return {
        id: t.apiName,
        name: t.name,
        description: resolveTraitDescription(t.desc, t.effects),
        icon: t.icon,
        breakpoints: t.effects
          .filter((e) => e.minUnits > 0)
          .map((e) => ({
            minUnits: e.minUnits,
            style: STYLE_MAP[e.style] ?? "bronze",
          })),
      };
    });

    // Build ability with resolved description
    let ability: ChampionAbility | null = null;
    if (champ.ability?.name) {
      ability = {
        name: champ.ability.name,
        description: resolveAbilityDescription(
          champ.ability.desc ?? "",
          champ.ability.variables ?? []
        ),
        icon: champ.ability.icon ?? "",
      };
    }

    // Build item lookup from DB for name/icon resolution
    let itemLookup = new Map<string, { name: string; icon: string }>();
    if (currentPatch) {
      const itemRows = await db
        .select()
        .from(staticData)
        .where(eq(staticData.patchVersion, currentPatch.patchVersion));
      const itemRow = itemRows.find((r) => r.dataType === "items");
      if (itemRow) {
        for (const item of extractEntries(itemRow.data)) {
          const iImage = item.image as Record<string, unknown> | undefined;
          itemLookup.set((item.id ?? item.apiName) as string, {
            name: item.name as string,
            icon: (item.icon ?? iImage?.full ?? "") as string,
          });
        }
      }
    }

    // Aggregate suggested items across all comps (overall, not per-comp)
    const suggestedItems: SuggestedItem[] = [];
    if (currentPatch) {
      const comps = await db
        .select()
        .from(compArchetypes)
        .where(eq(compArchetypes.patchId, currentPatch.id));

      const itemCounts = new Map<string, number>();
      for (const comp of comps) {
        const core = (comp.coreChampions as CompChampion[] | null) ?? [];
        const flex = (comp.flexSlots as CompChampion[] | null) ?? [];
        const match = [...core, ...flex].find((u) => u.championId === championId);
        if (!match || match.recommendedItems.length === 0) continue;

        for (const itemId of match.recommendedItems) {
          itemCounts.set(itemId, (itemCounts.get(itemId) ?? 0) + 1);
        }
      }

      // Sort by frequency descending, take top items
      const sorted = [...itemCounts.entries()].sort((a, b) => b[1] - a[1]);
      for (const [itemId, count] of sorted) {
        const info = itemLookup.get(itemId);
        suggestedItems.push({
          id: itemId,
          name:
            info?.name ??
            itemId
              .replace("TFT_Item_", "")
              .replace(/([A-Z])/g, " $1")
              .trim(),
          icon: info?.icon ?? "",
          frequency: count,
        });
      }
    }

    const result: ChampionDetailData = {
      id: champ.apiName,
      name: champ.name,
      cost: champ.cost,
      icon: champ.icon,
      traits,
      ability,
      suggestedItems,
    };

    return NextResponse.json(result, { headers: CACHE_HEADERS });
  } catch (err) {
    console.error("Champion detail API error:", err);
    return NextResponse.json(
      { error: "Failed to load champion data" },
      { status: 500 }
    );
  }
}
