"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { GameIcon } from "@/components/shared/GameIcon";
import { TraitBadge, sortTraits } from "@/components/shared/TraitBadge";
import type { CompArchetype, BoardPosition } from "@/types/comp";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { ArrowLeft, ChevronRight, Star } from "lucide-react";
import { useRef, useState, useEffect, useCallback } from "react";

interface CompDetailProps {
  comp: CompArchetype;
  getTraitIcon?: (id: string) => string | undefined;
  getItemIcon?: (id: string) => string | undefined;
  getItemName?: (id: string) => string | undefined;
  getChampionCost?: (id: string) => number | undefined;
  getItemComponents?: (id: string) => string[];
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

const COST_BORDER: Record<number, string> = {
  1: "ring-zinc-400",
  2: "ring-emerald-600",
  3: "ring-sky-600",
  4: "ring-pink-500",
  5: "ring-amber-400",
};

/**
 * TFT hex board: 4 rows x 7 cols
 * Odd rows are offset right by half a hex.
 * All 28 hexes always render to show the full board outline.
 */
function BoardPlacement({
  champions,
  getChampionCost,
  getItemIcon,
  onChampionClick,
}: {
  champions: {
    name: string;
    championId: string;
    position?: BoardPosition;
    isCarry: boolean;
    recommendedItems: string[];
    threeStarRate?: number;
  }[];
  getChampionCost?: (id: string) => number | undefined;
  getItemIcon?: (id: string) => string | undefined;
  onChampionClick?: (championId: string) => void;
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
  const vSpacing = hexH * 0.75 + HEX_GAP + 8; // extra room for stars + items
  const rowOffset = hSpacing / 2;
  const totalWidth = hSpacing * 7 + rowOffset;
  const totalHeight = vSpacing * 3 + hexH + 28; // pad for top stars + bottom items

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
        <div ref={containerRef} className="w-full overflow-hidden">
          <div
            className="relative mx-auto"
            style={{
              width: totalWidth * scale,
              height: totalHeight * scale,
            }}
          >
            <div
              className="absolute left-0 top-0"
              style={{
                width: totalWidth,
                height: totalHeight,
                transform: `scale(${scale})`,
                transformOrigin: "top left",
              }}
            >
            {grid.map((row, rowIdx) => {
              const isOdd = rowIdx % 2 === 1;
              const offX = isOdd ? rowOffset : 0;
              const y = rowIdx * vSpacing + 12; // offset for top-row star indicators

              return row.map((cell, colIdx) => {
                const x = offX + colIdx * hSpacing;
                const hasThreeStar = cell && (cell.threeStarRate ?? 0) >= 0.5;
                const hasItems = cell && cell.recommendedItems.length > 0;

                return (
                  <div
                    key={`${rowIdx}-${colIdx}`}
                    className="absolute"
                    style={{ left: x, top: y, width: hexW, height: hexH }}
                  >
                    {/* 3-star indicator */}
                    {hasThreeStar && (
                      <div className="absolute -top-0.5 left-1/2 z-10 flex -translate-x-1/2 -space-x-0.5">
                        <Star className="h-4 w-4 fill-yellow-400 text-black drop-shadow-sm" strokeWidth={1} />
                        <Star className="h-4 w-4 fill-yellow-400 text-black drop-shadow-sm" strokeWidth={1} />
                        <Star className="h-4 w-4 fill-yellow-400 text-black drop-shadow-sm" strokeWidth={1} />
                      </div>
                    )}
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
                      className={cn(
                        "relative flex h-full w-full items-center justify-center overflow-hidden",
                        cell && onChampionClick && "cursor-pointer"
                      )}
                      style={{
                        clipPath: HEX_CLIP,
                        backgroundColor: cell ? undefined : "#2a2a30",
                      }}
                      title={cell?.name}
                      onClick={
                        cell && onChampionClick
                          ? () => onChampionClick(cell.championId)
                          : undefined
                      }
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
                    {/* Item icons below hex */}
                    {hasItems && (
                      <div className="absolute -bottom-2.5 left-1/2 z-10 flex -translate-x-1/2 -space-x-0.5">
                        {cell.recommendedItems.slice(0, 3).map((itemId) => {
                          const iconPath = getItemIcon?.(itemId);
                          return iconPath ? (
                            <GameIcon
                              key={itemId}
                              iconPath={iconPath}
                              name={itemId}
                              size={22}
                              variant="item"
                              className="drop-shadow-sm"
                            />
                          ) : null;
                        })}
                      </div>
                    )}
                  </div>
                );
              });
            })}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Build carousel pickup priority from the comp's recommended items.
 * Carries first, then tanks — each completed item is broken into its 2 components.
 * Returns deduplicated components in priority order with counts.
 */
function buildCarouselPriority(
  champions: CompArchetype["coreChampions"],
  getItemComponents?: (id: string) => string[],
): { componentId: string; count: number }[] {
  if (!getItemComponents) return [];

  // Collect completed items: carries first, then non-carries
  const carries = champions.filter((c) => c.isCarry && c.recommendedItems.length > 0);
  const tanks = champions.filter((c) => !c.isCarry && c.recommendedItems.length > 0);
  const orderedItems = [
    ...carries.flatMap((c) => c.recommendedItems),
    ...tanks.flatMap((c) => c.recommendedItems),
  ];

  // Break each completed item into its component items
  const componentCounts = new Map<string, number>();
  const componentOrder: string[] = [];

  for (const itemId of orderedItems) {
    const components = getItemComponents(itemId);
    for (const compId of components) {
      if (!componentCounts.has(compId)) componentOrder.push(compId);
      componentCounts.set(compId, (componentCounts.get(compId) ?? 0) + 1);
    }
  }

  return componentOrder
    .map((id) => ({ componentId: id, count: componentCounts.get(id) ?? 1 }))
    .slice(0, 4);
}

export function CompDetail({
  comp,
  getTraitIcon,
  getItemIcon,
  getItemName,
  getChampionCost,
  getItemComponents,
}: CompDetailProps) {
  const router = useRouter();
  const difficulty = getDifficulty(comp.stats.playRate);
  const carouselPriority = buildCarouselPriority(comp.coreChampions, getItemComponents);

  const handleChampionClick = (championId: string) => {
    router.push(`/champions/${championId}`);
  };

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
          recommendedItems: c.recommendedItems,
          threeStarRate: c.threeStarRate,
        }))}
        getChampionCost={getChampionCost}
        getItemIcon={getItemIcon}
        onChampionClick={handleChampionClick}
      />

      {/* Early Game + Carousel Priority */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Early Game */}
        {comp.earlyBoard && comp.earlyBoard.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <h2 className="text-base font-bold">Early Game</h2>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex flex-wrap gap-3">
                  {[...comp.earlyBoard].sort((a, b) => (getChampionCost?.(a.championId) ?? 1) - (getChampionCost?.(b.championId) ?? 1)).map((champ) => {
                    const cost = getChampionCost?.(champ.championId) ?? 1;
                    return (
                      <button
                        key={champ.championId}
                        type="button"
                        className={cn(
                          "relative cursor-pointer rounded-sm ring-2 transition-opacity hover:opacity-80",
                          COST_BORDER[cost] ?? "ring-border"
                        )}
                        title={`${champ.championName} (${cost} cost)`}
                        onClick={() => handleChampionClick(champ.championId)}
                      >
                        <GameIcon
                          championId={champ.championId}
                          name={champ.championName}
                          size={48}
                          variant="champion"
                        />
                      </button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

        {/* Carousel Priority */}
        <Card>
          <CardHeader className="pb-3">
            <h2 className="text-base font-bold">Carousel Priority</h2>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex flex-wrap items-center gap-1.5">
              {carouselPriority.length > 0
                ? carouselPriority.map(({ componentId, count }, idx) => {
                    const iconPath = getItemIcon?.(componentId);
                    const name = getItemName?.(componentId) ?? componentId;
                    return (
                      <div key={componentId} className="flex items-center gap-1.5">
                        {idx > 0 && (
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        )}
                        <div title={`${name}${count > 1 ? ` ×${count}` : ""}`}>
                          {iconPath && (
                            <GameIcon
                              iconPath={iconPath}
                              name={name}
                              size={48}
                              variant="item"
                            />
                          )}
                        </div>
                      </div>
                    );
                  })
                : Array.from({ length: 4 }, (_, idx) => (
                    <div key={idx} className="flex items-center gap-1.5">
                      {idx > 0 && (
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      )}
                      <Skeleton className="h-12 w-12 rounded-md" />
                    </div>
                  ))}
            </div>
          </CardContent>
        </Card>
      </div>

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
                  <button
                    key={champ.championId}
                    type="button"
                    className="flex cursor-pointer items-center gap-1.5 transition-opacity hover:opacity-80"
                    onClick={() => handleChampionClick(champ.championId)}
                  >
                    <GameIcon
                      championId={champ.championId}
                      name={champ.championName}
                      size={24}
                      variant="champion"
                    />
                    <Badge variant="secondary">
                      {champ.championName}
                    </Badge>
                  </button>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* TODO: Re-introduce these sections once we have a production API key:
         - Augment Recommendations
         - Leveling Guide
         - Early & Mid Game Plan
         - Ad Space
         - Patch info
      */}
    </div>
  );
}
