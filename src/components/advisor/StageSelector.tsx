"use client";

import { GAME_STAGES } from "@/lib/constants";

interface StageSelectorProps {
  value: string | undefined;
  onChange: (stage: string | undefined) => void;
}

export function StageSelector({ value, onChange }: StageSelectorProps) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-muted-foreground">
        Game Stage
      </label>
      <select
        value={value || ""}
        onChange={(e) => onChange(e.target.value || undefined)}
        className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
      >
        <option value="">Select stage (optional)</option>
        {GAME_STAGES.map((stage) => (
          <option key={stage} value={stage}>
            Stage {stage}
          </option>
        ))}
      </select>
    </div>
  );
}
