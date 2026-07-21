/**
 * Lightweight in-memory sliding-window rate limiter.
 *
 * NOTE: This state lives in the memory of a single server process. It is
 * NOT shared across serverless instances/regions, and resets on every
 * redeploy or cold start. That's fine for a single always-on server, but
 * for a multi-instance/serverless production deployment this should be
 * swapped out for a shared store such as Upstash Redis (or similar).
 */

const attempts = new Map<string, number[]>();

const CLEANUP_INTERVAL_MS = 10 * 60 * 1000; // 10 minutes
// Cleanup must keep timestamps for the longest window any caller uses
// (currently the 24h AI quotas); pruning with a shorter caller-specific
// window would drop still-valid attempts for long-window keys.
const MAX_WINDOW_MS = 24 * 60 * 60 * 1000;
let lastCleanup = Date.now();

/** Drops expired timestamps and empty keys so the Map doesn't grow forever. */
function cleanup() {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) return;
  lastCleanup = now;

  for (const [key, timestamps] of attempts.entries()) {
    const fresh = timestamps.filter((t) => now - t < MAX_WINDOW_MS);
    if (fresh.length === 0) {
      attempts.delete(key);
    } else {
      attempts.set(key, fresh);
    }
  }
}

/** Returns the still-valid timestamps for `key` within `windowMs`. */
function getFreshTimestamps(key: string, windowMs: number): number[] {
  const now = Date.now();
  const timestamps = attempts.get(key) ?? [];
  return timestamps.filter((t) => now - t < windowMs);
}

/**
 * Checks whether `key` is within `limit` attempts over the sliding
 * `windowMs` window, and records this call as an attempt.
 *
 * Returns true if the call is allowed (and records it), false if the
 * limit has already been reached (the call is not recorded again).
 */
export function checkRateLimit(key: string, limit: number, windowMs: number): boolean {
  cleanup();

  const fresh = getFreshTimestamps(key, windowMs);

  if (fresh.length >= limit) {
    attempts.set(key, fresh);
    return false;
  }

  fresh.push(Date.now());
  attempts.set(key, fresh);
  return true;
}

/**
 * Read-only check: returns true if `key` has already reached `limit`
 * attempts within the sliding `windowMs` window. Does not record anything.
 * Useful when you need to check the limit before doing work, and only
 * want to record an attempt conditionally (e.g. only on failure).
 */
export function isRateLimited(key: string, limit: number, windowMs: number): boolean {
  cleanup();
  return getFreshTimestamps(key, windowMs).length >= limit;
}

/** Records an attempt for `key` without checking the limit. */
export function recordAttempt(key: string, windowMs: number): void {
  const fresh = getFreshTimestamps(key, windowMs);
  fresh.push(Date.now());
  attempts.set(key, fresh);
}
