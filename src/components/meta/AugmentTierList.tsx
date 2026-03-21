"use client";

import { Badge } from "@/components/ui/badge";
import type { Augment } from "@/types/game";

interface AugmentTierListProps {
  augments: Augment[];
}

const TIER_STYLES = {
  prismatic: "text-purple-400 border-purple-500/30 bg-purple-500/10",
  gold: "text-amber-400 border-amber-500/30 bg-amber-500/10",
  silver: "text-zinc-300 border-zinc-500/30 bg-zinc-500/10",
} as const;

export function AugmentTierList({ augments }: AugmentTierListProps) {
  // Group by tier, show first 15 of each
  const grouped = (["prismatic", "gold", "silver"] as const).map((tier) => ({
    tier,
    augments: augments.filter((a) => a.tier === tier).slice(0, 15),
  }));

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Augment Tier List</h2>
      {grouped.map(({ tier, augments: tierAugments }) => (
        <div key={tier}>
          <div className="mb-2">
            <Badge
              variant="outline"
              className={`text-xs font-semibold ${TIER_STYLES[tier]}`}
            >
              {tier.charAt(0).toUpperCase() + tier.slice(1)}
            </Badge>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {tierAugments.map((aug) => (
              <Badge key={aug.id} variant="secondary" className="text-xs">
                {aug.name}
              </Badge>
            ))}
            {tierAugments.length === 0 && (
              <span className="text-xs text-muted-foreground">No augments</span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
