"use client";

import { use, useCallback, useEffect, useState } from "react";
import { notFound } from "next/navigation";
import { CompDetail } from "@/components/comps/CompDetail";
import { LoadingOverlay } from "@/components/ui/spinner";
import { RateLimitBanner } from "@/components/shared/RateLimitBanner";
import { useStaticData } from "@/hooks/useStaticData";
import type { CompArchetype } from "@/types/comp";

export default function CompDetailPage({
  params,
}: {
  params: Promise<{ compId: string }>;
}) {
  const { compId } = use(params);
  const [comp, setComp] = useState<CompArchetype | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFoundState, setNotFoundState] = useState(false);
  const [rateLimitRetryAfter, setRateLimitRetryAfter] = useState<number | null>(null);
  const { getTraitIcon, getItemIcon, getItemName, getItemComponents, getChampionCost } = useStaticData();

  const fetchComp = useCallback(() => {
    setLoading(true);
    setRateLimitRetryAfter(null);

    fetch("/api/comps", { signal: AbortSignal.timeout(15_000) })
      .then((r) => {
        if (r.status === 429) {
          const retryAfter = parseInt(r.headers.get("Retry-After") ?? "0", 10);
          setRateLimitRetryAfter(retryAfter || 120);
          throw new Error("Rate limited");
        }
        if (!r.ok) throw new Error(`Failed (${r.status})`);
        return r.json();
      })
      .then((data) => {
        const found = (data.comps ?? []).find(
          (c: CompArchetype) => c.id === compId
        );
        if (found) {
          setComp(found);
          document.title = `TFT Doctor - ${found.name}`;
        } else {
          setNotFoundState(true);
        }
      })
      .catch((err) => {
        if (!(err instanceof Error && err.message === "Rate limited")) {
          setNotFoundState(true);
        }
      })
      .finally(() => setLoading(false));
  }, [compId]);

  useEffect(() => {
    fetchComp();
  }, [fetchComp]);

  if (notFoundState) {
    notFound();
  }

  if (rateLimitRetryAfter) {
    return (
      <div className="mx-auto w-full max-w-4xl px-4 py-6 sm:px-6 lg:px-8">
        <RateLimitBanner retryAfter={rateLimitRetryAfter} onRetry={fetchComp} />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-4xl px-4 py-6 sm:px-6 lg:px-8">
        <LoadingOverlay />
      </div>
    );
  }

  if (!comp) return null;

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-6 sm:px-6 lg:px-8">
      <CompDetail
        comp={comp}
        getTraitIcon={getTraitIcon}
        getItemIcon={getItemIcon}
        getItemName={getItemName}
        getChampionCost={getChampionCost}
        getItemComponents={getItemComponents}
      />
    </div>
  );
}
