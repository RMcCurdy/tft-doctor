import { cn } from "@/lib/utils";

interface StatDisplayProps {
  label: string;
  value: string | number;
  className?: string;
}

export function StatDisplay({ label, value, className }: StatDisplayProps) {
  return (
    <div className={cn("text-center", className)}>
      <div className="text-sm font-semibold">{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  );
}
