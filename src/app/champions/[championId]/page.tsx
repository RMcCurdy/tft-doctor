"use client";

import { use, useEffect, useState } from "react";
import { notFound } from "next/navigation";
import { ChampionDetail } from "@/components/champions/ChampionDetail";
import { LoadingOverlay } from "@/components/ui/spinner";
import type { ChampionDetailData } from "@/types/game";

export default function ChampionDetailPage({
  params,
}: {
  params: Promise<{ championId: string }>;
}) {
  const { championId } = use(params);
  const [champion, setChampion] = useState<ChampionDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFoundState, setNotFoundState] = useState(false);

  useEffect(() => {
    fetch(`/api/champions/${encodeURIComponent(championId)}`)
      .then((r) => {
        if (r.status === 404) {
          setNotFoundState(true);
          return null;
        }
        if (!r.ok) throw new Error(`Failed to load champion (${r.status})`);
        return r.json();
      })
      .then((data) => {
        if (data) {
          setChampion(data);
          document.title = `TFT Doctor - ${data.name}`;
        }
      })
      .catch(() => setNotFoundState(true))
      .finally(() => setLoading(false));
  }, [championId]);

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

  if (!champion) return null;

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-6 sm:px-6 lg:px-8">
      <ChampionDetail champion={champion} />
    </div>
  );
}
