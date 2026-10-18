const { CACHE_PREFIX, DEFAULT_MAX_AGE_MS, describeAge, createCache } = require('./cache_store.js');

let passed = 0, total = 0;
function check(name, condition) {
  total++;
  if (condition) { passed++; console.log(`PASS: ${name}`); }
  else console.log(`FAIL: ${name}`);
}

// A fake Web Storage with an optional size limit (characters), like a phone browser's localStorage
function fakeStorage(limit = Infinity) {
  const m = new Map();
  const size = () => [...m.entries()].reduce((s, [k, v]) => s + k.length + v.length, 0);
  return {
    m, get length() { return m.size; }, key: (i) => [...m.keys()][i] ?? null,
    getItem: (k) => (m.has(k) ? m.get(k) : null),
    setItem: (k, v) => { const old = m.has(k) ? k.length + m.get(k).length : 0; if (size() - old + k.length + v.length > limit) throw new Error("QuotaExceededError"); m.set(k, v); },
    removeItem: (k) => m.delete(k)
  };
}
let clock = 1_000_000;
const now = () => clock;

check("prefix and default age (7 days)", CACHE_PREFIX === "om-cache:" && DEFAULT_MAX_AGE_MS === 604800000);

// ----- basic behaviour -----
{
  const s = fakeStorage(), c = createCache(s, { now });
  check("a missing key returns null", c.get("a") === null);
  const r = c.set("a", { x: [1, 2, 3] });
  check("set reports where it was stored", r.stored === "storage");
  const hit = c.get("a");
  check("a saved value comes back unchanged with its age", hit && JSON.stringify(hit.data) === '{"x":[1,2,3]}' && hit.ageMs === 0 && hit.savedAt === clock);
  clock += 3600 * 1000;
  check("the age grows with time", c.get("a").ageMs === 3600 * 1000);
  check("entries are stored under the prefix", [...s.m.keys()].every(k => k.startsWith(CACHE_PREFIX)));
  check("a value older than the allowed age is not returned (and is removed)", c.get("a", 1800 * 1000) === null && s.m.size === 0);
  c.set("b", 1); clock += 8 * 24 * 3600 * 1000;
  check("the default limit is 7 days", c.get("b") === null);
}
// ----- bad data -----
{
  const s = fakeStorage(), c = createCache(s, { now });
  s.setItem(CACHE_PREFIX + "bad", "{not json");
  check("a corrupted entry is ignored and removed", c.get("bad") === null && !s.m.has(CACHE_PREFIX + "bad"));
  s.setItem(CACHE_PREFIX + "odd", JSON.stringify({ hello: 1 }));
  check("an entry with the wrong shape is ignored and removed", c.get("odd") === null && !s.m.has(CACHE_PREFIX + "odd"));
  c.set("future", 5); clock -= 1000 * 60;
  check("an entry saved 'in the future' (clock moved back) is not trusted", c.get("future") === null);
  clock += 1000 * 60;
}
// ----- storage not available -----
{
  const c = createCache(null, { now });
  c.set("m", { ok: true });
  check("without storage, the cache still works in memory", c.get("m").data.ok === true && c.set("n", 1).stored === "memory");
  const blocked = { getItem() { throw new Error("SecurityError"); }, setItem() { throw new Error("SecurityError"); }, removeItem() { throw new Error("SecurityError"); }, length: 0, key: () => null };
  const c2 = createCache(blocked, { now });
  check("storage that throws (blocked by the browser) falls back to memory", c2.set("k", 7).stored === "memory" && c2.get("k").data === 7);
}
// ----- full storage -----
{
  const entryLen = (k, d) => (CACHE_PREFIX + k).length + JSON.stringify({ savedAt: 0, data: d }).length;
  const limit = entryLen("a", "x".repeat(50)) * 2 + 40;
  const s = fakeStorage(limit), c = createCache(s, { now });
  clock = 5000; c.set("old", "x".repeat(50));
  clock = 6000; c.set("mid", "x".repeat(50));
  clock = 7000; const r = c.set("new", "x".repeat(50));
  check("when storage is full the oldest entry is removed to make room", r.stored === "storage" && c.get("old") === null && c.get("mid") !== null && c.get("new") !== null);
  const huge = c.set("huge", "y".repeat(limit * 2));
  check("a value too big for storage is kept in memory instead", huge.stored === "memory" && c.get("huge").data.length === limit * 2);
  s.setItem("someone-elses-key", "keep me");
  const c3 = createCache(s, { now });
  c3.clear();
  check("clear removes only this app's entries", s.getItem("someone-elses-key") === "keep me" && ![...s.m.keys()].some(k => k.startsWith(CACHE_PREFIX)));
}
// ----- age wording -----
check("describeAge: under a minute", describeAge(30000) === "just now");
check("describeAge: minutes (singular and plural)", describeAge(60000) === "1 minute" && describeAge(5 * 60000) === "5 minutes");
check("describeAge: hours", describeAge(3600000) === "1 hour" && describeAge(5 * 3600000) === "5 hours");
check("describeAge: days", describeAge(86400000) === "1 day" && describeAge(3 * 86400000) === "3 days");

console.log(`\nRESULTS: ${passed}/${total} tests passed`);
process.exit(passed === total ? 0 : 1);
