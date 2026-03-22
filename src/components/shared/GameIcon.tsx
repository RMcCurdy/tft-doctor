"use client";

import Image from "next/image";
import { texPathToUrl, getChampionSquareUrl } from "@/lib/icon-utils";
import { cn } from "@/lib/utils";

interface GameIconProps {
  /** The .tex icon path from entity data (e.g., "ASSETS/UX/TraitIcons/...tex") */
  iconPath?: string;
  /** Champion ID — used when no iconPath is available (e.g., in CompChampion) */
  championId?: string;
  /** Display name for alt text and fallback initials */
  name: string;
  /** Icon size in pixels */
  size?: number;
  /** Additional CSS classes */
  className?: string;
  /** Visual variant for border/shape styling */
  variant?: "champion" | "trait" | "item" | "default";
}

const VARIANT_CLASSES: Record<string, string> = {
  champion: "rounded-sm border border-border",
  trait: "rounded-full",
  item: "rounded-sm border border-border",
  default: "rounded",
};

export function GameIcon({
  iconPath,
  championId,
  name,
  size = 32,
  className = "",
  variant = "default",
}: GameIconProps) {
  let src: string;
  if (iconPath) {
    src = texPathToUrl(iconPath);
  } else if (championId) {
    src = getChampionSquareUrl(championId);
  } else {
    // No image source — render fallback directly
    return (
      <div
        className={cn(
          "inline-flex shrink-0 items-center justify-center bg-elevated text-xs font-medium text-muted-foreground",
          VARIANT_CLASSES[variant],
          className
        )}
        style={{ width: size, height: size }}
      >
        {name.slice(0, 2).toUpperCase()}
      </div>
    );
  }

  return (
    <Image
      src={src}
      alt={name}
      width={size}
      height={size}
      className={cn("shrink-0", variant === "trait" ? "object-contain" : "object-cover", VARIANT_CLASSES[variant], className)}
      unoptimized
      onError={(e) => {
        const target = e.currentTarget;
        target.style.display = "none";
        const parent = target.parentElement;
        if (parent && !parent.querySelector("[data-fallback]")) {
          const fallback = document.createElement("div");
          fallback.setAttribute("data-fallback", "true");
          fallback.className = `inline-flex items-center justify-center bg-elevated text-muted-foreground text-xs font-medium ${VARIANT_CLASSES[variant]}`;
          fallback.style.width = `${size}px`;
          fallback.style.height = `${size}px`;
          fallback.textContent = name.slice(0, 2).toUpperCase();
          parent.appendChild(fallback);
        }
      }}
    />
  );
}
