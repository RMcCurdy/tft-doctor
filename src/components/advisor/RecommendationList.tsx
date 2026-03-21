"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { RecommendationCard } from "./RecommendationCard";
import type { RecommendationResponse } from "@/types/api";
import { AlertCircle, Search } from "lucide-react";

interface RecommendationListProps {
  data: RecommendationResponse | null;
  isLoading: boolean;
  error: string | null;
  hasInput: boolean;
}

export function RecommendationList({
  data,
  isLoading,
  error,
  hasInput,
}: RecommendationListProps) {
  if (!hasInput) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <Search className="mb-3 h-10 w-10 text-muted-foreground/40" />
        <h3 className="text-base font-medium text-muted-foreground">
          Enter your game state
        </h3>
        <p className="mt-1 max-w-sm text-sm text-muted-foreground/70">
          Add your augments, emblems, items, or artifacts to see personalized
          comp recommendations.
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="space-y-3 rounded-lg border p-4">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <Skeleton className="h-5 w-48" />
                <Skeleton className="h-4 w-32" />
              </div>
              <Skeleton className="h-10 w-10 rounded" />
            </div>
            <Skeleton className="h-12 w-full rounded-lg" />
            <div className="flex gap-1">
              <Skeleton className="h-5 w-16" />
              <Skeleton className="h-5 w-16" />
              <Skeleton className="h-5 w-16" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <AlertCircle className="mb-3 h-10 w-10 text-destructive/60" />
        <h3 className="text-base font-medium">Something went wrong</h3>
        <p className="mt-1 text-sm text-muted-foreground">{error}</p>
      </div>
    );
  }

  if (!data || data.recommendations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <Search className="mb-3 h-10 w-10 text-muted-foreground/40" />
        <h3 className="text-base font-medium text-muted-foreground">
          No recommendations found
        </h3>
        <p className="mt-1 text-sm text-muted-foreground/70">
          Try adjusting your inputs for better results.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Recommended Comps</h2>
        <span className="text-xs text-muted-foreground">
          {data.meta.totalMatchesAnalyzed.toLocaleString()} games analyzed
        </span>
      </div>

      {data.recommendations.map((rec) => (
        <RecommendationCard key={rec.comp.id} recommendation={rec} />
      ))}

      <p className="text-center text-xs text-muted-foreground">
        Patch {data.meta.patchVersion} • Data as of{" "}
        {new Date(data.meta.dataFreshness).toLocaleDateString()}
      </p>
    </div>
  );
}
