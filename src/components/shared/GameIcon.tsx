"use client";

import Image from "next/image";
import { DDRAGON_BASE_URL, CDRAGON_BASE_URL } from "@/lib/constants";

interface GameIconProps {
  type: "champion" | "item" | "augment" | "trait";
  /** The entity ID (e.g., "TFT16_Jinx", "TFT_Item_InfinityEdge") */
  id: string;
  /** Display name for alt text */
  name?: string;
  /** Icon size in pixels */
  size?: number;
  /** Additional CSS classes */
  className?: string;
  /** Data Dragon version (defaults to latest) */
  version?: string;
}

const DEFAULT_VERSION = "16.6.1";

function getIconSrc(
  type: GameIconProps["type"],
  id: string,
  version: string
): string {
  switch (type) {
    case "champion":
      return `${DDRAGON_BASE_URL}/cdn/${version}/img/tft-champion/${id}.TFT_Set16.png`;
    case "item":
      return `${DDRAGON_BASE_URL}/cdn/${version}/img/tft-item/${id}.png`;
    case "augment":
      // Augment icons are best sourced from CDragon
      return `${CDRAGON_BASE_URL}/game/assets/ux/tft/championsplashes/${id.toLowerCase()}.png`;
    case "trait":
      return `${CDRAGON_BASE_URL}/game/assets/ux/traiticons/trait_icon_${id.toLowerCase().replace("tft16_", "")}.TFT_Set16.png`;
  }
}

export function GameIcon({
  type,
  id,
  name,
  size = 32,
  className = "",
  version = DEFAULT_VERSION,
}: GameIconProps) {
  const src = getIconSrc(type, id, version);
  const alt = name || id;

  return (
    <Image
      src={src}
      alt={alt}
      width={size}
      height={size}
      className={`rounded ${className}`}
      unoptimized
      onError={(e) => {
        // Fallback: show a placeholder on broken images
        const target = e.currentTarget;
        target.style.display = "none";
        const parent = target.parentElement;
        if (parent && !parent.querySelector(".game-icon-fallback")) {
          const fallback = document.createElement("div");
          fallback.className = `game-icon-fallback inline-flex items-center justify-center rounded bg-muted text-muted-foreground text-xs font-medium`;
          fallback.style.width = `${size}px`;
          fallback.style.height = `${size}px`;
          fallback.textContent = (name || id).slice(0, 2).toUpperCase();
          parent.appendChild(fallback);
        }
      }}
    />
  );
}
