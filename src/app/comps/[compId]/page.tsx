"use client";

import { use } from "react";
import { notFound } from "next/navigation";
import { getCompById } from "@/lib/mock-data";
import { CompDetail } from "@/components/comps/CompDetail";

export default function CompDetailPage({
  params,
}: {
  params: Promise<{ compId: string }>;
}) {
  const { compId } = use(params);
  const comp = getCompById(compId);

  if (!comp) {
    notFound();
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-6 lg:px-8">
      <CompDetail comp={comp} />
    </div>
  );
}
