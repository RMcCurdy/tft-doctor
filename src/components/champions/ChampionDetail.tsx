"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { GameIcon } from "@/components/shared/GameIcon";
import { cn } from "@/lib/utils";
import { ArrowLeft, Swords } from "lucide-react";
import type { ChampionDetailData } from "@/types/game";

const COST_COLORS: Record<number, { bg: string; text: string; label: string }> = {
  1: { bg: "bg-zinc-400/15", text: "text-zinc-400", label: "1 Cost" },
  2: { bg: "bg-emerald-600/15", text: "text-emerald-500", label: "2 Cost" },
  3: { bg: "bg-sky-600/15", text: "text-sky-400", label: "3 Cost" },
  4: { bg: "bg-pink-500/15", text: "text-pink-400", label: "4 Cost" },
  5: { bg: "bg-amber-400/15", text: "text-amber-400", label: "5 Cost" },
};

const COST_RING: Record<number, string> = {
  1: "ring-zinc-400",
  2: "ring-emerald-600",
  3: "ring-sky-600",
  4: "ring-pink-500",
  5: "ring-amber-400",
};

const BREAKPOINT_STYLE: Record<string, string> = {
  bronze: "bg-[#a0715e]/20 text-[#d4a88c]",
  silver: "bg-[#7c8f92]/20 text-[#b0c4c8]",
  gold: "bg-[#bd9a38]/20 text-[#e8c860]",
  chromatic: "bg-purple-500/20 text-purple-300",
};

const TRAIT_HEX_STYLE: Record<string, string> = {
  bronze: "bg-[#a0715e]",
  silver: "bg-[#7c8f92]",
  gold: "bg-[#bd9a38]",
  chromatic: "bg-gradient-to-r from-[#e09cff] via-[#7ce0f9] to-[#c8ee82]",
};

interface ChampionDetailProps {
  champion: ChampionDetailData;
}

export function ChampionDetail({ champion }: ChampionDetailProps) {
  const costInfo = COST_COLORS[champion.cost] ?? COST_COLORS[1];

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
      <div className="flex items-start gap-4">
        <div
          className={cn(
            "shrink-0 rounded-md ring-3",
            COST_RING[champion.cost] ?? "ring-border"
          )}
        >
          <GameIcon
            championId={champion.id}
            name={champion.name}
            size={80}
            variant="champion"
            className="rounded-md"
          />
        </div>
        <div className="min-w-0 space-y-2">
          <h1 className="text-3xl font-extrabold sm:text-4xl">
            {champion.name}
          </h1>
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={cn(
                "rounded-sm px-2.5 py-0.5 text-sm font-semibold",
                costInfo.bg,
                costInfo.text
              )}
            >
              {costInfo.label}
            </span>
            {champion.traits.map((trait) => (
              <Link
                key={trait.id}
                href={`#trait-${trait.id}`}
                className="flex items-center gap-1 rounded-sm bg-muted px-2 py-0.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                {trait.icon && (
                  <GameIcon
                    iconPath={trait.icon}
                    name={trait.name}
                    size={16}
                    variant="trait"
                  />
                )}
                {trait.name}
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Suggested Items */}
      {champion.suggestedItems.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <h2 className="text-base font-bold">Suggested Items</h2>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex flex-wrap gap-3">
              {champion.suggestedItems.map((item) => (
                <div
                  key={item.id}
                  className="flex flex-col items-center gap-1.5"
                  title={`${item.name} — used in ${item.frequency} comp${item.frequency > 1 ? "s" : ""}`}
                >
                  <GameIcon
                    iconPath={item.icon}
                    name={item.name}
                    size={44}
                    variant="item"
                  />
                  <span className="max-w-[72px] text-center text-xs leading-tight text-muted-foreground">
                    {item.name}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Ability */}
      {champion.ability && (
        <Card>
          <CardHeader className="pb-3">
            <h2 className="text-base font-bold">Ability</h2>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex items-start gap-3">
              {champion.ability.icon && (
                <div className="shrink-0 rounded-md border border-border">
                  <GameIcon
                    iconPath={champion.ability.icon}
                    name={champion.ability.name}
                    size={48}
                    variant="item"
                    className="rounded-md"
                  />
                </div>
              )}
              <div className="min-w-0 space-y-1">
                <div className="flex items-center gap-2">
                  <Swords className="h-4 w-4 text-accent" />
                  <h3 className="text-sm font-bold">{champion.ability.name}</h3>
                </div>
                <p className="whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
                  {champion.ability.description}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Traits */}
      {champion.traits.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <h2 className="text-base font-bold">Traits</h2>
          </CardHeader>
          <CardContent className="space-y-4 pt-0">
            {champion.traits.map((trait) => (
              <div
                key={trait.id}
                id={`trait-${trait.id}`}
                className="space-y-2"
              >
                <div className="flex items-center gap-2">
                  {/* Hex icon */}
                  <div
                    className={cn(
                      "flex h-8 w-7 shrink-0 items-center justify-center",
                      TRAIT_HEX_STYLE.bronze
                    )}
                    style={{
                      clipPath:
                        "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)",
                    }}
                  >
                    {trait.icon ? (
                      <GameIcon
                        iconPath={trait.icon}
                        name={trait.name}
                        size={20}
                        variant="trait"
                        className="brightness-0"
                      />
                    ) : (
                      <span className="text-xs font-bold text-black">
                        {trait.name.slice(0, 2)}
                      </span>
                    )}
                  </div>
                  <h3 className="text-sm font-bold">{trait.name}</h3>
                </div>

                {trait.description && (
                  <p className="whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
                    {trait.description}
                  </p>
                )}

                {trait.breakpoints.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {trait.breakpoints.map((bp) => (
                      <Badge
                        key={bp.minUnits}
                        variant="outline"
                        className={cn(
                          "text-xs",
                          BREAKPOINT_STYLE[bp.style] ?? BREAKPOINT_STYLE.bronze
                        )}
                      >
                        {bp.minUnits}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
