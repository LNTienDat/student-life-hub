const cache = new Map();

export function getCache(key) {
  return cache.get(key);
}

export function setCache(key, value) {
  cache.set(key, value);
}

export function clearCache(key) {
  if (key) {
    cache.delete(key);
  } else {
    cache.clear();
  }
}
