"use client";

import { use, useEffect, useState } from "react";
import { notFound } from "next/navigation";
import { CompDetail } from "@/components/comps/CompDetail";
import { LoadingOverlay } from "@/components/ui/spinner";
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
  const { getTraitIcon, getItemIcon, getItemName, getChampionCost } = useStaticData();

  useEffect(() => {
    fetch("/api/comps")
      .then((r) => r.json())
      .then((data) => {
        const found = (data.comps ?? []).find(
          (c: CompArchetype) => c.id === compId
        );
        if (found) {
          setComp(found);
        } else {
          setNotFoundState(true);
        }
      })
      .catch(() => setNotFoundState(true))
      .finally(() => setLoading(false));
  }, [compId]);

  if (notFoundState) {
    notFound();
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
      />
    </div>
  );
}
