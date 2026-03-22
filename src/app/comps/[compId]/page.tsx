"use client";

import { use, useEffect, useState } from "react";
import { notFound } from "next/navigation";
import { CompDetail } from "@/components/comps/CompDetail";
import { Skeleton } from "@/components/ui/skeleton";
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
      <div className="mx-auto w-full max-w-3xl space-y-4 px-4 py-6 sm:px-6 lg:px-8">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-24 w-full rounded-lg" />
        <Skeleton className="h-48 w-full rounded-lg" />
      </div>
    );
  }

  if (!comp) return null;

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-6 lg:px-8">
      <CompDetail comp={comp} />
    </div>
  );
}
