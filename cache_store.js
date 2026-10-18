// A small on-device cache for downloaded data (localStorage when the browser allows it, memory otherwise).
// Pure logic with an injected storage object, so it can be tested without a browser. See docs/data-sources.md.

const CACHE_PREFIX = "om-cache:";
const DEFAULT_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;   // historical data changes rarely: keep a saved copy for 7 days

function describeAge(ms) {
  if (ms < 60 * 1000) return "just now";
  const minutes = Math.floor(ms / 60000);
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? "" : "s"}`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"}`;
  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? "" : "s"}`;
}

function createCache(storage, options = {}) {
  const { now = () => Date.now(), prefix = CACHE_PREFIX } = options;
  const memory = new Map();            // used when the browser blocks storage, or an entry cannot fit
  let storageWorks = !!storage;

  const safe = (fn, fallback) => { try { return fn(); } catch (e) { return fallback; } };
  const readRaw = (key) => {
    if (storageWorks) {
      const raw = safe(() => storage.getItem(prefix + key), undefined);
      if (raw === undefined) storageWorks = false;      // storage threw (for example blocked by the browser)
      else if (raw !== null) return raw;
    }
    return memory.has(key) ? memory.get(key) : null;
  };
  const removeKey = (key) => { memory.delete(key); if (storageWorks) safe(() => storage.removeItem(prefix + key)); };

  function listStoredKeys() {
    const keys = [];
    if (!storageWorks) return keys;
    const n = safe(() => storage.length, 0);
    for (let i = 0; i < n; i++) {
      const k = safe(() => storage.key(i), null);
      if (typeof k === "string" && k.startsWith(prefix)) keys.push(k.slice(prefix.length));
    }
    return keys;
  }

  function get(key, maxAgeMs = DEFAULT_MAX_AGE_MS) {
    const raw = readRaw(key);
    if (raw === null) return null;
    let entry;
    try { entry = JSON.parse(raw); } catch (e) { removeKey(key); return null; }
    if (!entry || typeof entry.savedAt !== "number" || !("data" in entry)) { removeKey(key); return null; }
    const ageMs = now() - entry.savedAt;
    if (ageMs < 0 || ageMs > maxAgeMs) { removeKey(key); return null; }   // expired, or the clock moved backwards
    return { data: entry.data, savedAt: entry.savedAt, ageMs };
  }

  function set(key, data) {
    const raw = JSON.stringify({ savedAt: now(), data });
    memory.delete(key);
    if (storageWorks) {
      for (let attempt = 0; attempt < 50; attempt++) {
        try { storage.setItem(prefix + key, raw); return { stored: "storage" }; } catch (e) { /* probably full */ }
        // Make room by removing the oldest saved entry, then try again
        const entries = listStoredKeys().filter(k => k !== key).map(k => {
          const parsed = safe(() => JSON.parse(storage.getItem(prefix + k)), null);
          return { k, savedAt: parsed && typeof parsed.savedAt === "number" ? parsed.savedAt : 0 };
        }).sort((a, b) => a.savedAt - b.savedAt);
        if (entries.length === 0) break;
        removeKey(entries[0].k);
      }
    }
    memory.set(key, raw);
    return { stored: "memory" };
  }

  function clear() {
    for (const k of listStoredKeys()) removeKey(k);
    memory.clear();
  }

  return { get, set, remove: removeKey, clear };
}

if (typeof module !== "undefined") module.exports = { CACHE_PREFIX, DEFAULT_MAX_AGE_MS, describeAge, createCache };
