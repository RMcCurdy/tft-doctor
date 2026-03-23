"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { GameIcon } from "@/components/shared/GameIcon";
import { TraitBadge, sortTraits } from "@/components/shared/TraitBadge";
import type { CompArchetype } from "@/types/comp";
import { cn } from "@/lib/utils";
import { Star } from "lucide-react";

interface CompCardProps {
  comp: CompArchetype;
  getTraitIcon?: (id: string) => string | undefined;
  getChampionCost?: (id: string) => number | undefined;
  getItemIcon?: (id: string) => string | undefined;
  isItemEmblem?: (id: string) => boolean;
}

const TIER_COLORS: Record<string, string> = {
  S: "bg-[#ff7f7e] text-black border-transparent",
  A: "bg-[#ffbf7f] text-black border-transparent",
  B: "bg-[#feff7f] text-black border-transparent",
  C: "bg-[#beff7f] text-black border-transparent",
};

const COST_BORDER: Record<number, string> = {
  1: "ring-zinc-400",
  2: "ring-emerald-600",
  3: "ring-sky-600",
  4: "ring-pink-500",
  5: "ring-amber-400",
};

function getDifficulty(playRate: number) {
  if (playRate > 0.05) return { label: "Easy", className: "bg-success/15 text-success" };
  if (playRate > 0.02) return { label: "Medium", className: "bg-warning/15 text-warning" };
  return { label: "Hard", className: "bg-accent/15 text-accent" };
}

export function CompCard({ comp, getTraitIcon, getChampionCost, getItemIcon, isItemEmblem }: CompCardProps) {
  const difficulty = getDifficulty(comp.stats.playRate);

  const allChampions = [...comp.coreChampions, ...comp.flexChampions].sort(
    (a, b) => {
      const costA = getChampionCost?.(a.championId) ?? 1;
      const costB = getChampionCost?.(b.championId) ?? 1;
      return costA - costB;
    }
  );

  // Show items on all champions that have recommended items (consistent with detail page)
  const itemChampIds = new Set(
    allChampions.filter((c) => c.recommendedItems.length > 0).map((c) => c.championId)
  );

  // Check if any champion in the comp requires an emblem
  const requiresEmblem = allChampions.some((c) =>
    c.recommendedItems.some((itemId) => isItemEmblem?.(itemId))
  );

  return (
    <Link href={`/comps/${comp.id}`}>
      <Card className="h-full transition-colors hover:border-accent/30">
        <CardContent className="space-y-4 p-4">
          {/* Header */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div
                className={cn(
                  "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs font-bold",
                  TIER_COLORS[comp.tier]
                )}
              >
                {comp.tier}
              </div>
              <h3 className="text-lg font-bold leading-snug text-foreground">
                {comp.name}
              </h3>
            </div>
            <div className="flex shrink-0 items-center gap-1.5">
              {requiresEmblem && (
                <span className="rounded-sm bg-sky-500/15 px-2.5 py-0.5 text-xs font-medium text-sky-400">
                  Emblem
                </span>
              )}
              <span className={cn("rounded-sm px-2.5 py-0.5 text-xs font-medium", difficulty.className)}>
                {difficulty.label}
              </span>
            </div>
          </div>

          {/* Champion portraits */}
          <div className="flex flex-wrap gap-3">
            {allChampions.map((champ) => {
              const cost = getChampionCost?.(champ.championId) ?? 1;
              const showItems = itemChampIds.has(champ.championId);
              return (
                <div
                  key={champ.championId}
                  className={cn("relative rounded-sm ring-2", COST_BORDER[cost] ?? "ring-border")}
                  title={`${champ.championName} (${cost} cost)${champ.isCarry ? " — Carry" : ""}${(champ.threeStarRate ?? 0) >= 0.5 ? " — 3★" : ""}`}
                >
                  <GameIcon
                    championId={champ.championId}
                    name={champ.championName}
                    size={48}
                    variant="champion"
                  />
                  {(champ.threeStarRate ?? 0) >= 0.5 && (
                    <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 flex -space-x-0.5">
                      <Star className="h-4 w-4 fill-yellow-400 text-black drop-shadow-sm" strokeWidth={1} />
                      <Star className="h-4 w-4 fill-yellow-400 text-black drop-shadow-sm" strokeWidth={1} />
                      <Star className="h-4 w-4 fill-yellow-400 text-black drop-shadow-sm" strokeWidth={1} />
                    </div>
                  )}
                  {showItems && (
                    <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 flex -space-x-0.5">
                      {champ.recommendedItems.slice(0, 3).map((itemId) => {
                        const iconPath = getItemIcon?.(itemId);
                        return iconPath ? (
                          <GameIcon
                            key={itemId}
                            iconPath={iconPath}
                            name={itemId}
                            size={20}
                            variant="item"
                            className="drop-shadow-sm"
                          />
                        ) : null;
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Traits */}
          <div className="flex flex-wrap gap-3">
            {sortTraits(comp.traits).map((trait) => (
              <TraitBadge
                key={trait.traitId}
                trait={trait}
                iconPath={getTraitIcon?.(trait.traitId)}
                size="sm"
              />
            ))}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
