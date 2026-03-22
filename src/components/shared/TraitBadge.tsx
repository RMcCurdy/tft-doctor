"use client";

import { GameIcon } from "@/components/shared/GameIcon";
import { cn } from "@/lib/utils";
import type { ActiveTrait } from "@/types/comp";

const TRAIT_STYLE: Record<string, string> = {
  bronze: "bg-[#a0715e]",
  silver: "bg-[#7c8f92]",
  gold: "bg-[#bd9a38]",
  chromatic: "bg-gradient-to-r from-[#e09cff] via-[#7ce0f9] to-[#c8ee82]",
  unique: "bg-gradient-to-r from-[#e8833a] to-[#d4627a]",
};

/** Traits that always display as gold regardless of unit count */
const ALWAYS_GOLD_TRAITS = new Set(["Targon"]);

const STYLE_ORDER: Record<string, number> = {
  chromatic: 0,
  gold: 2,
  silver: 3,
  bronze: 4,
};

interface TraitBadgeProps {
  trait: ActiveTrait;
  iconPath?: string;
  size?: "sm" | "lg";
}

export function TraitBadge({ trait, iconPath, size = "sm" }: TraitBadgeProps) {
  const isAlwaysGold = ALWAYS_GOLD_TRAITS.has(trait.traitName);
  const isUnique = trait.style === "chromatic" && trait.maxBreakpoint === 1;
  const style = isAlwaysGold
    ? TRAIT_STYLE.gold
    : isUnique
      ? TRAIT_STYLE.unique
      : TRAIT_STYLE[trait.style] ?? TRAIT_STYLE.bronze;

  const hexSize = size === "lg" ? "h-[38px] w-9" : "h-[30px] w-7";
  const iconSize = size === "lg" ? 24 : 20;
  const countSize = size === "lg" ? "h-6 w-5" : "h-5 w-4";
  const countText = size === "lg" ? "text-sm" : "text-[11px]";
  const fallbackText = size === "lg" ? "text-xs" : "text-[10px]";

  return (
    <div
      className="flex items-center gap-1"
      title={`${trait.activeUnits} ${trait.traitName} (${trait.style})`}
    >
      {/* Hexagon */}
      <div
        className={cn(
          "relative flex shrink-0 items-center justify-center",
          hexSize,
          style
        )}
        style={{
          clipPath:
            "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)",
        }}
      >
        {iconPath ? (
          <GameIcon
            iconPath={iconPath}
            name={trait.traitName}
            size={iconSize}
            variant="trait"
            className="brightness-0"
          />
        ) : (
          <span className={cn("font-bold text-black", fallbackText)}>
            {trait.traitName.slice(0, 2)}
          </span>
        )}
      </div>
      {/* Count */}
      <div
        className={cn(
          "flex shrink-0 items-center justify-center rounded-xs bg-[#4a4a52]",
          countSize
        )}
      >
        <span className={cn("font-bold text-white", countText)}>
          {trait.activeUnits}
        </span>
      </div>
    </div>
  );
}

/** Sort traits by tier: chromatic → unique → gold → silver → bronze */
export function sortTraits(traits: ActiveTrait[]): ActiveTrait[] {
  return [...traits].sort((a, b) => {
    const aUnique = a.style === "chromatic" && a.maxBreakpoint === 1;
    const bUnique = b.style === "chromatic" && b.maxBreakpoint === 1;
    const aOrder = aUnique ? 1 : (STYLE_ORDER[a.style] ?? 4);
    const bOrder = bUnique ? 1 : (STYLE_ORDER[b.style] ?? 4);
    return aOrder - bOrder;
  });
}
