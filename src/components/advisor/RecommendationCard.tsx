"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { GameIcon } from "@/components/shared/GameIcon";
import { ConfidenceBadge } from "@/components/shared/ConfidenceBadge";
import { StatDisplay } from "@/components/shared/StatDisplay";
import type { CompRecommendation } from "@/types/comp";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface RecommendationCardProps {
  recommendation: CompRecommendation;
  getTraitIcon?: (id: string) => string | undefined;
}

export function RecommendationCard({
  recommendation,
  getTraitIcon,
}: RecommendationCardProps) {
  const [expanded, setExpanded] = useState(false);
  const { comp, fitScore, fitExplanation, confidence, emblemApplication } =
    recommendation;

  return (
    <Card className="overflow-hidden transition-colors hover:border-primary/30">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                {recommendation.rank}
              </span>
              <h3 className="truncate text-base font-semibold">{comp.name}</h3>
            </div>
            <div className="mt-1.5 flex flex-wrap gap-1">
              {comp.traits.map((trait) => {
                const traitIconPath = getTraitIcon?.(trait.traitId);
                return (
                  <Badge
                    key={trait.traitId}
                    variant="outline"
                    className="gap-1 text-xs"
                  >
                    {traitIconPath && (
                      <GameIcon
                        iconPath={traitIconPath}
                        name={trait.traitName}
                        size={14}
                        variant="trait"
                      />
                    )}
                    {trait.activeUnits} {trait.traitName}
                  </Badge>
                );
              })}
            </div>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-1">
            <div className="text-2xl font-bold tabular-nums text-primary">
              {fitScore}
            </div>
            <span className="text-xs text-muted-foreground">fit score</span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3 pt-0">
        {/* Stats row */}
        <div className="flex flex-wrap justify-between gap-2 rounded-lg bg-elevated/50 px-3 py-2">
          <StatDisplay label="Avg Place" value={comp.stats.avgPlacement.toFixed(1)} />
          <StatDisplay
            label="Top 4"
            value={`${(comp.stats.top4Rate * 100).toFixed(0)}%`}
          />
          <StatDisplay
            label="Win Rate"
            value={`${(comp.stats.winRate * 100).toFixed(0)}%`}
          />
          <StatDisplay
            label="Games"
            value={comp.stats.sampleSize.toLocaleString()}
          />
        </div>

        {/* Champions */}
        <div>
          <div className="mb-1 text-xs font-medium text-muted-foreground">
            Champions
          </div>
          <div className="flex flex-wrap gap-1">
            {comp.coreChampions.map((champ) => (
              <div
                key={champ.championId}
                className={cn(
                  "relative",
                  champ.isCarry && "ring-1 ring-accent/60 rounded-sm"
                )}
                title={`${champ.championName}${champ.isCarry ? " (Carry)" : ""}`}
              >
                <GameIcon
                  championId={champ.championId}
                  name={champ.championName}
                  size={28}
                  variant="champion"
                />
              </div>
            ))}
          </div>
        </div>

        <ConfidenceBadge confidence={confidence} />

        {/* Expandable explanation */}
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="flex w-full items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
        >
          {expanded ? (
            <ChevronUp className="h-3.5 w-3.5" />
          ) : (
            <ChevronDown className="h-3.5 w-3.5" />
          )}
          {expanded ? "Hide" : "Show"} fit explanation
        </button>

        {expanded && (
          <div className="space-y-2 rounded-lg bg-elevated/30 p-3">
            <ul className="space-y-1">
              {fitExplanation.map((reason, i) => (
                <li key={i} className="flex gap-2 text-sm">
                  <span className="shrink-0 text-accent">•</span>
                  <span>{reason}</span>
                </li>
              ))}
            </ul>

            {emblemApplication && (
              <div className="mt-2 rounded border border-accent/20 bg-accent/5 p-2">
                <div className="text-xs font-medium text-accent">
                  Emblem Tip
                </div>
                <p className="mt-0.5 text-sm">
                  Apply{" "}
                  <strong>
                    {emblemApplication.emblemId.replace("TFT_Item_", "").replace(/([A-Z])/g, " $1").trim()}
                  </strong>{" "}
                  to <strong>{emblemApplication.bestChampionName}</strong> —{" "}
                  {emblemApplication.reasoning}
                </p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
