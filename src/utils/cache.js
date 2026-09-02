const cache = new Map();
function cached(key, ttlMs, fn) {
  const hit = cache.get(key);
  if (hit && Date.now() - hit.t < ttlMs) return Promise.resolve(hit.v);
  return fn().then((v) => { cache.set(key, { v, t: Date.now() }); return v; });
}
module.exports = { cached, cache };
