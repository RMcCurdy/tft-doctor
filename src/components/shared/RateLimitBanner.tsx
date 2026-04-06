"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";

interface RateLimitBannerProps {
  retryAfter?: number;
  onRetry?: () => void;
}

export function RateLimitBanner({ retryAfter, onRetry }: RateLimitBannerProps) {
  const [secondsLeft, setSecondsLeft] = useState(retryAfter ?? 0);

  useEffect(() => {
    setSecondsLeft(retryAfter ?? 0);
  }, [retryAfter]);

  useEffect(() => {
    if (secondsLeft <= 0) return;

    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [secondsLeft]);

  // Auto-retry when countdown reaches zero
  useEffect(() => {
    if (secondsLeft === 0 && retryAfter && retryAfter > 0 && onRetry) {
      onRetry();
    }
  }, [secondsLeft, retryAfter, onRetry]);

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const timeDisplay =
    minutes > 0
      ? `${minutes}m ${seconds.toString().padStart(2, "0")}s`
      : `${seconds}s`;

  return (
    <Card className="border-yellow-600/50 bg-yellow-950/20">
      <CardContent className="flex items-center gap-3 pt-4">
        <AlertTriangle className="size-5 shrink-0 text-yellow-500" />
        <div className="min-w-0">
          <p className="text-sm font-medium text-yellow-200">
            Rate limit reached
          </p>
          <p className="text-xs text-muted-foreground">
            {secondsLeft > 0 ? (
              <>
                Too many requests. Retrying in{" "}
                <span className="font-mono text-yellow-400">{timeDisplay}</span>
                ...
              </>
            ) : (
              "Too many requests. Please try again in a moment."
            )}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
