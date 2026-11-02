// Caches aggregate() results and retries when the per-minute rate limit is hit.
const cache = new Map();
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

const isRateLimit = (e) =>
  e?.status === 429 || e?.response?.status === 429 || /rate limit/i.test(e?.message || "");

export async function cachedAggregate(key, fn, ttl = 60000) {
  const hit = cache.get(key);
  if (hit && Date.now() - hit.time < ttl) return hit.data;

  let delay = 4000;
  for (let attempt = 0; ; attempt++) {
    try {
      const data = await fn();
      cache.set(key, { data, time: Date.now() });
      return data;
    } catch (e) {
      if (!isRateLimit(e) || attempt >= 3) throw e;
      await wait(delay);
      delay *= 2;
    }
  }
}

export function invalidateAggregate(key) {
  cache.delete(key);
}