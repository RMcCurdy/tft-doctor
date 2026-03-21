"use client";

import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

export default function HomePage() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4 py-20 text-center">
      <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
        TFT <span className="text-primary">Doctor</span>
      </h1>
      <p className="mt-4 max-w-lg text-lg text-muted-foreground">
        Get ranked comp recommendations based on your augments, emblems, items,
        and artifacts. Powered by high-elo match data.
      </p>
      <div className="mt-8 flex gap-3">
        <Link href="/advisor" className={buttonVariants({ size: "lg" })}>
          Open Advisor
        </Link>
        <Link
          href="/meta"
          className={buttonVariants({ variant: "outline", size: "lg" })}
        >
          View Meta
        </Link>
      </div>
    </div>
  );
}
