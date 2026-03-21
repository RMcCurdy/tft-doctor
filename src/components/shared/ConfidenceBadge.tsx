import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface ConfidenceBadgeProps {
  confidence: "high" | "medium" | "low";
  className?: string;
}

const CONFIDENCE_STYLES = {
  high: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  medium: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  low: "bg-red-500/15 text-red-400 border-red-500/30",
} as const;

export function ConfidenceBadge({
  confidence,
  className,
}: ConfidenceBadgeProps) {
  return (
    <Badge
      variant="outline"
      className={cn("text-xs font-normal", CONFIDENCE_STYLES[confidence], className)}
    >
      {confidence} confidence
    </Badge>
  );
}
