import "server-only";
import { createHash } from "node:crypto";
import { serviceClient } from "@/lib/supabase/server";
import { HttpError } from "@/lib/http";

// Rate limiting for the places where guessing pays off: sign-in, guest order tracking, coupons.
//
// Counts are kept in PostgreSQL (migration 010), so they survive restarts and are shared by
// every server instance. If that is unavailable, an in-memory counter takes over, which still
// protects a single server. Keys are hashed, so no IP address or email is stored.

const memory = new Map<string, { start: number; hits: number }>();
function memoryHit(key: string, limit: number, windowSeconds: number) {
  const now = Date.now();
  // Keep the map from growing without bound on a long-running server.
  if (memory.size > 5000)
    for (const [k, v] of memory) if (now - v.start > 3600_000) memory.delete(k);
  const entry = memory.get(key);
  if (!entry || now - entry.start >= windowSeconds * 1000) {
    memory.set(key, { start: now, hits: 1 });
    return 0;
  }
  entry.hits++;
  return entry.hits > limit ? Math.ceil((entry.start + windowSeconds * 1000 - now) / 1000) : 0;
}

const wait = (seconds: number) =>
  seconds < 90 ? "a minute" : `${Math.ceil(seconds / 60)} minutes`;

// Counts one attempt for `id` within `scope`. Throws a 429 once the limit is passed.
export async function rateLimit(scope: string, id: string, limit: number, windowSeconds: number) {
  const key = createHash("sha256").update(`${scope}:${id}`).digest("hex");
  let seconds: number;
  try {
    const { data, error } = await serviceClient().rpc("rate_limit_hit", {
      p_key: key,
      p_limit: limit,
      p_window: windowSeconds,
    });
    if (error) throw error;
    seconds = Number(data);
  } catch {
    seconds = memoryHit(key, limit, windowSeconds);
  }
  if (seconds > 0)
    throw new HttpError(429, `Too many attempts. Please try again in ${wait(seconds)}.`);
}

// The caller's address as reported by the hosting proxy. A client can forge this header when
// the app is reached directly, which is why every limit that matters is also applied to the
// thing being guessed (the email, the order number, the signed-in user), not only to the IP.
export function clientIp(request: Request) {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}
