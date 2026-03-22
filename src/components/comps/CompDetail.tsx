"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { GameIcon } from "@/components/shared/GameIcon";
import { TraitBadge, sortTraits } from "@/components/shared/TraitBadge";
import type { CompArchetype, BoardPosition } from "@/types/comp";
import { cn } from "@/lib/utils";
import { ArrowLeft } from "lucide-react";
import { useRef, useState, useEffect, useCallback } from "react";

interface CompDetailProps {
  comp: CompArchetype;
  getTraitIcon?: (id: string) => string | undefined;
  getItemIcon?: (id: string) => string | undefined;
  getItemName?: (id: string) => string | undefined;
  getChampionCost?: (id: string) => number | undefined;
}

const TIER_COLORS: Record<string, string> = {
  S: "bg-[#ff7f7e] text-black border-transparent",
  A: "bg-[#ffbf7f] text-black border-transparent",
  B: "bg-[#feff7f] text-black border-transparent",
  C: "bg-[#beff7f] text-black border-transparent",
};

function getDifficulty(playRate: number) {
  if (playRate > 0.05) return { label: "Easy", className: "bg-success/15 text-success" };
  if (playRate > 0.02) return { label: "Medium", className: "bg-warning/15 text-warning" };
  return { label: "Hard", className: "bg-accent/15 text-accent" };
}

function formatItemName(itemId: string, getItemName?: (id: string) => string | undefined) {
  const name = getItemName?.(itemId);
  if (name) return name;
  return itemId
    .replace("TFT_Item_", "")
    .replace(/([A-Z])/g, " $1")
    .trim();
}

const HEX_SIZE = 56;
const HEX_CLIP = "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)";
const HEX_GAP = 12;

const COST_COLORS: Record<number, string> = {
  1: "#a1a1aa", // zinc-400
  2: "#059669", // emerald-600
  3: "#0284c7", // sky-600
  4: "#ec4899", // pink-500
  5: "#fbbf24", // amber-400
};

/**
 * TFT hex board: 4 rows x 7 cols
 * Odd rows are offset right by half a hex.
 * All 28 hexes always render to show the full board outline.
 */
function BoardPlacement({
  champions,
  getChampionCost,
}: {
  champions: {
    name: string;
    championId: string;
    position?: BoardPosition;
    isCarry: boolean;
  }[];
  getChampionCost?: (id: string) => number | undefined;
}) {
  // Build 4x7 grid
  type ChampCell = (typeof champions)[number] | undefined;
  const grid: ChampCell[][] = Array.from({ length: 4 }, () =>
    Array(7).fill(undefined)
  );

  for (const champ of champions) {
    if (champ.position) {
      grid[champ.position.row][champ.position.col] = champ;
    }
  }

  const hexW = HEX_SIZE;
  const hexH = HEX_SIZE * 1.1547;
  const hSpacing = hexW + HEX_GAP;
  const vSpacing = hexH * 0.75 + HEX_GAP;
  const rowOffset = hSpacing / 2;
  const totalWidth = hSpacing * 7 + rowOffset;
  const totalHeight = vSpacing * 3 + hexH;

  // Responsive scaling: measure container and shrink board to fit
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  const updateScale = useCallback(() => {
    if (!containerRef.current) return;
    const available = containerRef.current.clientWidth;
    setScale(Math.min(1, available / totalWidth));
  }, [totalWidth]);

  useEffect(() => {
    updateScale();
    const observer = new ResizeObserver(updateScale);
    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [updateScale]);

  return (
    <Card>
      <CardHeader className="pb-3">
        <h2 className="text-base font-bold">Board Placement</h2>
      </CardHeader>
      <CardContent className="pt-0">
        <div ref={containerRef} className="w-full">
          <div
            className="relative mx-auto"
            style={{
              width: totalWidth,
              height: totalHeight,
              transform: `scale(${scale})`,
              transformOrigin: "top center",
              marginBottom: scale < 1 ? -(totalHeight * (1 - scale)) : 0,
            }}
          >
            {grid.map((row, rowIdx) => {
              const isOdd = rowIdx % 2 === 1;
              const offX = isOdd ? rowOffset : 0;
              const y = rowIdx * vSpacing;

              return row.map((cell, colIdx) => {
                const x = offX + colIdx * hSpacing;

                return (
                  <div
                    key={`${rowIdx}-${colIdx}`}
                    className="absolute"
                    style={{ left: x, top: y, width: hexW, height: hexH }}
                  >
                    {/* Cost-colored ring (rendered behind the hex) */}
                    {cell && (
                      <div
                        className="absolute -inset-[3px]"
                        style={{
                          clipPath: HEX_CLIP,
                          backgroundColor: COST_COLORS[getChampionCost?.(cell.championId) ?? 1] ?? COST_COLORS[1],
                        }}
                      />
                    )}
                    {/* Hex cell */}
                    <div
                      className="relative flex h-full w-full items-center justify-center overflow-hidden"
                      style={{
                        clipPath: HEX_CLIP,
                        backgroundColor: cell ? undefined : "#2a2a30",
                      }}
                      title={cell?.name}
                    >
                      {cell ? (
                        <GameIcon
                          championId={cell.championId}
                          name={cell.name}
                          size={Math.round(HEX_SIZE * 1.3)}
                          variant="champion"
                          className="min-h-full min-w-full rounded-none border-0 object-cover"
                        />
                      ) : null}
                    </div>
                  </div>
                );
              });
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function CompDetail({
  comp,
  getTraitIcon,
  getItemIcon,
  getItemName,
  getChampionCost,
}: CompDetailProps) {
  const difficulty = getDifficulty(comp.stats.playRate);
  const carries = comp.coreChampions.filter((c) => c.isCarry);
  const nonCarries = comp.coreChampions.filter((c) => !c.isCarry);

  return (
    <div className="space-y-6">
      {/* Back navigation */}
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Comps
      </Link>

      {/* Header */}
      <div>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-sm font-bold",
                TIER_COLORS[comp.tier]
              )}
            >
              {comp.tier}
            </div>
            <h1 className="text-3xl font-extrabold sm:text-4xl">{comp.name}</h1>
          </div>
          <span className={cn("shrink-0 rounded-sm px-2.5 py-0.5 text-sm font-medium", difficulty.className)}>
            {difficulty.label}
          </span>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          {sortTraits(comp.traits).map((trait) => (
            <TraitBadge
              key={trait.traitId}
              trait={trait}
              iconPath={getTraitIcon?.(trait.traitId)}
              size="lg"
            />
          ))}
        </div>
      </div>

      {/* Board Placement */}
      <BoardPlacement
        champions={comp.coreChampions.map((c) => ({
          name: c.championName,
          championId: c.championId,
          position: c.position,
          isCarry: c.isCarry,
        }))}
        getChampionCost={getChampionCost}
      />

      {/* Carries & Items */}
      <Card>
        <CardHeader className="pb-3">
          <h2 className="text-base font-bold">Carries & Items</h2>
        </CardHeader>
        <CardContent className="space-y-4 pt-0">
          {carries.map((carry) => (
            <div
              key={carry.championId}
              className="rounded-lg border border-accent/20 bg-accent/5 p-3"
            >
              <div className="flex items-center gap-3">
                <GameIcon
                  championId={carry.championId}
                  name={carry.championName}
                  size={36}
                  variant="champion"
                />
                <div>
                  <span className="text-sm font-bold text-foreground">
                    {carry.championName}
                  </span>
                  <Badge variant="default" className="ml-2 text-xs">
                    <span className="text-yellow-400 drop-shadow-[0_0_1px_rgba(0,0,0,1)]">{"★".repeat(carry.starLevel)}</span> Carry
                  </Badge>
                </div>
              </div>
              {carry.recommendedItems.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {carry.recommendedItems.map((itemId) => {
                    const itemIconPath = getItemIcon?.(itemId);
                    return (
                      <Badge
                        key={itemId}
                        variant="secondary"
                        className="gap-1.5 text-xs"
                      >
                        {itemIconPath && (
                          <GameIcon
                            iconPath={itemIconPath}
                            name={formatItemName(itemId, getItemName)}
                            size={18}
                            variant="item"
                          />
                        )}
                        {formatItemName(itemId, getItemName)}
                      </Badge>
                    );
                  })}
                </div>
              )}
            </div>
          ))}

          {/* Carry alternatives */}
          {comp.flexChampions.filter((c) => c.isCarry).length > 0 && (
            <div className="rounded-lg border border-border bg-elevated/50 p-3">
              <div className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Alternative Carries
              </div>
              <div className="flex flex-wrap gap-3">
                {comp.flexChampions
                  .filter((c) => c.isCarry)
                  .map((champ) => (
                    <div key={champ.championId} className="flex items-center gap-2">
                      <GameIcon
                        championId={champ.championId}
                        name={champ.championName}
                        size={28}
                        variant="champion"
                      />
                      <div>
                        <Badge variant="outline" className="text-xs">
                          {champ.championName}
                        </Badge>
                        {champ.recommendedItems.length > 0 && (
                          <div className="mt-1 flex gap-1">
                            {champ.recommendedItems.map((itemId) => {
                              const itemIconPath = getItemIcon?.(itemId);
                              return (
                                <Badge
                                  key={itemId}
                                  variant="secondary"
                                  className="gap-1 text-[10px]"
                                >
                                  {itemIconPath && (
                                    <GameIcon
                                      iconPath={itemIconPath}
                                      name={formatItemName(itemId, getItemName)}
                                      size={14}
                                      variant="item"
                                    />
                                  )}
                                  {formatItemName(itemId, getItemName)}
                                </Badge>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Support / Tank Champions */}
      {nonCarries.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <h2 className="text-base font-bold">Support & Tanks</h2>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-2">
              {nonCarries.map((champ) => (
                <div
                  key={champ.championId}
                  className="flex items-center justify-between rounded-lg border border-border p-3"
                >
                  <div className="flex items-center gap-3">
                    <GameIcon
                      championId={champ.championId}
                      name={champ.championName}
                      size={32}
                      variant="champion"
                    />
                    <span className="text-sm font-medium">
                      {champ.championName}
                    </span>
                    <span className="text-xs text-yellow-400 drop-shadow-[0_0_1px_rgba(0,0,0,1)]">
                      {"★".repeat(champ.starLevel)}
                    </span>
                  </div>
                  {champ.recommendedItems.length > 0 && (
                    <div className="flex gap-1">
                      {champ.recommendedItems.map((itemId) => {
                        const itemIconPath = getItemIcon?.(itemId);
                        return (
                          <Badge
                            key={itemId}
                            variant="secondary"
                            className="gap-1 text-xs"
                          >
                            {itemIconPath && (
                              <GameIcon
                                iconPath={itemIconPath}
                                name={formatItemName(itemId, getItemName)}
                                size={16}
                                variant="item"
                              />
                            )}
                            {formatItemName(itemId, getItemName)}
                          </Badge>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Flex Options */}
      {comp.flexChampions.filter((c) => !c.isCarry).length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <h2 className="text-base font-bold">Flex Options</h2>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex flex-wrap gap-2">
              {comp.flexChampions
                .filter((c) => !c.isCarry)
                .map((champ) => (
                  <div key={champ.championId} className="flex items-center gap-1.5">
                    <GameIcon
                      championId={champ.championId}
                      name={champ.championName}
                      size={24}
                      variant="champion"
                    />
                    <Badge variant="secondary">
                      {champ.championName}
                    </Badge>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Augment Recommendations — placeholder */}
      <Card>
        <CardHeader className="pb-3">
          <h2 className="text-base font-bold">Augment Recommendations</h2>
        </CardHeader>
        <CardContent className="pt-0">
          <p className="text-sm text-muted-foreground">
            Augment synergy data for this comp is coming soon.
          </p>
        </CardContent>
      </Card>

      {/* Leveling Guide — placeholder */}
      <Card>
        <CardHeader className="pb-3">
          <h2 className="text-base font-bold">Leveling Guide</h2>
        </CardHeader>
        <CardContent className="pt-0">
          <p className="text-sm text-muted-foreground">
            Level-up timing and rolling strategy data is coming soon.
          </p>
        </CardContent>
      </Card>

      {/* Early / Mid Game Plan — placeholder */}
      <Card>
        <CardHeader className="pb-3">
          <h2 className="text-base font-bold">Early & Mid Game Plan</h2>
        </CardHeader>
        <CardContent className="pt-0">
          <p className="text-sm text-muted-foreground">
            Transition champion and early game board data is coming soon.
          </p>
        </CardContent>
      </Card>

      {/* Ad banner placeholder */}
      <div className="flex h-24 items-center justify-center rounded-xl border border-dashed border-border text-xs text-muted-foreground/40">
        Ad Space
      </div>

      {/* Patch info */}
      <p className="text-center text-xs text-muted-foreground">
        Patch {comp.patchId} &middot; Last updated{" "}
        {new Date(comp.lastUpdated).toLocaleDateString()}
      </p>
    </div>
  );
}
