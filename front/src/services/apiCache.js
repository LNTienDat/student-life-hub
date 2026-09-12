// TTL mặc định: 3 phút (180000ms)
const DEFAULT_TTL = 180000;
const cache = new Map();

export function getCache(key) {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    cache.delete(key);
    return null;
  }
  return entry.value;
}

export function setCache(key, value, ttl = DEFAULT_TTL) {
  cache.set(key, { value, expiresAt: Date.now() + ttl });
}

export function clearCache(key) {
  if (key) {
    cache.delete(key);
  } else {
    cache.clear();
  }
}
