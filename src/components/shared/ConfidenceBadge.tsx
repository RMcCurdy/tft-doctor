import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface ConfidenceBadgeProps {
  confidence: "high" | "medium" | "low";
  className?: string;
}

const CONFIDENCE_STYLES = {
  high: "bg-success/15 text-success border-success/30",
  medium: "bg-warning/15 text-warning border-warning/30",
  low: "bg-destructive/15 text-destructive border-destructive/30",
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
