interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

export function rateLimit({
  key,
  maxAttempts = 5,
  windowMs = 60000,
}: {
  key: string;
  maxAttempts?: number;
  windowMs?: number;
}): { success: boolean; remaining: number; resetInMs: number } {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { success: true, remaining: maxAttempts - 1, resetInMs: windowMs };
  }

  if (entry.count >= maxAttempts) {
    return { success: false, remaining: 0, resetInMs: entry.resetAt - now };
  }

  entry.count += 1;
  return { success: true, remaining: maxAttempts - entry.count, resetInMs: entry.resetAt - now };
}

export function getRateLimitKey(ip: string, endpoint: string): string {
  return `${endpoint}:${ip}`;
}
