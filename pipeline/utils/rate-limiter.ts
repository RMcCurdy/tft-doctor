/**
 * Token bucket rate limiter for Riot API requests.
 *
 * Riot API has two rate limit windows:
 * - Per-second: e.g., 20 requests per 1 second
 * - Per-2-minutes: e.g., 100 requests per 120 seconds
 *
 * This limiter enforces both windows and waits when either is exhausted.
 */

export interface RateLimitConfig {
  /** Max requests in the short window */
  shortLimit: number;
  /** Short window duration in ms */
  shortWindowMs: number;
  /** Max requests in the long window */
  longLimit: number;
  /** Long window duration in ms */
  longWindowMs: number;
}

/** Default limits for a Riot development API key */
export const DEV_KEY_LIMITS: RateLimitConfig = {
  shortLimit: 20,
  shortWindowMs: 1_000,
  longLimit: 100,
  longWindowMs: 120_000,
};

/** Limits for a Riot production API key */
export const PROD_KEY_LIMITS: RateLimitConfig = {
  shortLimit: 300,
  shortWindowMs: 1_000,
  longLimit: 18_000,
  longWindowMs: 120_000,
};

export class RateLimiter {
  private shortWindow: number[] = [];
  private longWindow: number[] = [];
  private config: RateLimitConfig;

  constructor(config: RateLimitConfig = DEV_KEY_LIMITS) {
    this.config = config;
  }

  /**
   * Wait until a request slot is available, then consume it.
   * Call this before every API request.
   */
  async acquire(): Promise<void> {
    while (true) {
      this.pruneWindows();

      const shortAvailable = this.config.shortLimit - this.shortWindow.length;
      const longAvailable = this.config.longLimit - this.longWindow.length;

      if (shortAvailable > 0 && longAvailable > 0) {
        // Slot available — consume it
        const now = Date.now();
        this.shortWindow.push(now);
        this.longWindow.push(now);
        return;
      }

      // Need to wait — calculate how long
      let waitMs = 0;

      if (shortAvailable <= 0 && this.shortWindow.length > 0) {
        const oldestShort = this.shortWindow[0];
        waitMs = Math.max(
          waitMs,
          oldestShort + this.config.shortWindowMs - Date.now()
        );
      }

      if (longAvailable <= 0 && this.longWindow.length > 0) {
        const oldestLong = this.longWindow[0];
        waitMs = Math.max(
          waitMs,
          oldestLong + this.config.longWindowMs - Date.now()
        );
      }

      // Wait at least 50ms to avoid busy-looping
      waitMs = Math.max(waitMs, 50);

      await sleep(waitMs);
    }
  }

  /**
   * Handle a 429 (Rate Limited) response from the Riot API.
   * Reads the Retry-After header and waits that long.
   */
  async handleRateLimit(retryAfterSeconds?: number): Promise<void> {
    const waitMs = (retryAfterSeconds ?? 10) * 1000;
    console.warn(`[RateLimiter] Rate limited. Waiting ${waitMs}ms...`);
    await sleep(waitMs);
    // Clear windows since the server told us to back off
    this.shortWindow = [];
    this.longWindow = [];
  }

  /** Remove expired entries from both windows */
  private pruneWindows(): void {
    const now = Date.now();
    const shortCutoff = now - this.config.shortWindowMs;
    const longCutoff = now - this.config.longWindowMs;

    while (this.shortWindow.length > 0 && this.shortWindow[0] < shortCutoff) {
      this.shortWindow.shift();
    }
    while (this.longWindow.length > 0 && this.longWindow[0] < longCutoff) {
      this.longWindow.shift();
    }
  }

  /** Current usage stats (useful for logging) */
  get stats() {
    this.pruneWindows();
    return {
      shortUsed: this.shortWindow.length,
      shortLimit: this.config.shortLimit,
      longUsed: this.longWindow.length,
      longLimit: this.config.longLimit,
    };
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
