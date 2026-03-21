"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { CompArchetype, CompTier } from "@/types/comp";
import { cn } from "@/lib/utils";

interface CompTierListProps {
  comps: CompArchetype[];
}

const TIER_CONFIG: Record<CompTier, { label: string; color: string }> = {
  S: { label: "S Tier", color: "text-amber-400 border-amber-500/30 bg-amber-500/10" },
  A: { label: "A Tier", color: "text-emerald-400 border-emerald-500/30 bg-emerald-500/10" },
  B: { label: "B Tier", color: "text-sky-400 border-sky-500/30 bg-sky-500/10" },
  C: { label: "C Tier", color: "text-zinc-400 border-zinc-500/30 bg-zinc-500/10" },
};

const TIERS: CompTier[] = ["S", "A", "B", "C"];

export function CompTierList({ comps }: CompTierListProps) {
  const grouped = TIERS.map((tier) => ({
    tier,
    config: TIER_CONFIG[tier],
    comps: comps.filter((c) => c.tier === tier),
  })).filter((g) => g.comps.length > 0);

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold">Comp Tier List</h2>
      {grouped.map(({ tier, config, comps: tierComps }) => (
        <div key={tier}>
          <div className="mb-2 flex items-center gap-2">
            <Badge variant="outline" className={cn("text-xs font-semibold", config.color)}>
              {config.label}
            </Badge>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {tierComps.map((comp) => (
              <Link key={comp.id} href={`/comps/${comp.id}`}>
                <Card className="transition-colors hover:border-primary/30">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h3 className="truncate text-sm font-semibold">{comp.name}</h3>
                        <div className="mt-1 flex flex-wrap gap-1">
                          {comp.traits.slice(0, 3).map((t) => (
                            <Badge key={t.traitId} variant="outline" className="text-xs">
                              {t.activeUnits} {t.traitName}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <div className="shrink-0 text-right">
                        <div className="text-lg font-bold tabular-nums">
                          {comp.stats.avgPlacement.toFixed(1)}
                        </div>
                        <div className="text-xs text-muted-foreground">avg</div>
                      </div>
                    </div>
                    <div className="mt-2 flex gap-3 text-xs text-muted-foreground">
                      <span>Top 4: {(comp.stats.top4Rate * 100).toFixed(0)}%</span>
                      <span>Win: {(comp.stats.winRate * 100).toFixed(0)}%</span>
                      <span>{comp.stats.sampleSize.toLocaleString()} games</span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
