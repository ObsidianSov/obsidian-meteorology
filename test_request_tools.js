const { RequestError, fetchJsonWithRetry, getJsonCached } = require('./request_tools.js');

let passed = 0, total = 0;
function check(name, condition) {
  total++;
  if (condition) { passed++; console.log(`PASS: ${name}`); }
  else console.log(`FAIL: ${name}`);
}

const ok = (data) => ({ ok: true, status: 200, json: async () => data });
const status = (code) => ({ ok: false, status: code, json: async () => ({}) });
function script(...steps) {                 // a fake fetch that plays the given responses in order
  const calls = [];
  const fn = async (url, opts) => {
    calls.push({ url, opts });
    const step = steps[Math.min(calls.length - 1, steps.length - 1)];
    if (step instanceof Error) throw step;
    if (typeof step === "function") return step();
    return step;
  };
  fn.calls = calls;
  return fn;
}
const sleeps = [];
const sleep = async (ms) => { sleeps.push(ms); };
const run = async (fetchFn, extra = {}) => { sleeps.length = 0; try { return { value: await fetchJsonWithRetry("https://example.test/x", { fetchFn, sleep, backoffMs: 10, label: "TestService", ...extra }) }; } catch (e) { return { error: e }; } };

(async () => {
  let f, r;

  f = script(ok({ a: 1 })); r = await run(f);
  check("a good answer is returned after one request", r.value.a === 1 && f.calls.length === 1 && sleeps.length === 0);
  check("an abort signal is passed so a slow request can be cancelled", typeof f.calls[0].opts.signal === "object");

  f = script(new TypeError("Failed to fetch"), ok({ a: 2 })); r = await run(f);
  check("a network failure is retried and then succeeds", r.value.a === 2 && f.calls.length === 2);

  f = script(status(503), status(503), ok({ a: 3 })); r = await run(f);
  check("a server problem (503) is retried twice and then succeeds", r.value.a === 3 && f.calls.length === 3);
  check("the waits between retries grow (10 then 20)", JSON.stringify(sleeps) === "[10,20]");

  f = script(status(503)); r = await run(f);
  check("a server problem that never clears gives up after 3 attempts with a clear message", r.error && f.calls.length === 3 && /TestService is having problems \(status 503\)/.test(r.error.message));

  f = script(status(429), ok({ a: 4 })); r = await run(f);
  check("'too many requests' (429) is retried", r.value.a === 4 && f.calls.length === 2);
  f = script(status(429)); r = await run(f);
  check("a 429 that never clears says too many requests", r.error && /too many requests/.test(r.error.message));

  f = script(status(400)); r = await run(f);
  check("a rejected request (400) is NOT retried", r.error && f.calls.length === 1 && /rejected the request \(status 400\)/.test(r.error.message));
  f = script(status(404)); r = await run(f);
  check("not found (404) is NOT retried", r.error && f.calls.length === 1);

  f = script({ ok: true, status: 200, json: async () => { throw new SyntaxError("bad json"); } }); r = await run(f);
  check("an answer that is not valid JSON is not retried and says so", r.error && f.calls.length === 1 && /could not be read/.test(r.error.message));

  f = script(() => new Promise(() => {})); r = await run(f, { timeoutMs: 25, retries: 1 });
  check("a request that never answers times out, is retried once, then fails with a clear message", r.error && f.calls.length === 2 && /took longer than/.test(r.error.message));

  f = script(new TypeError("Failed to fetch")); r = await run(f, { retries: 0 });
  check("retries: 0 means a single attempt", r.error && f.calls.length === 1);
  check("a network failure gives a message about the connection", /could not reach TestService \(check your internet connection\)/.test(r.error.message));

  const seen = []; f = script(status(500), status(500), ok({ z: 1 })); r = await run(f, { onRetry: (n) => seen.push(n) });
  check("the retry callback reports each retry (so the page can say 'trying again')", JSON.stringify(seen) === "[1,2]");

  r = await run(null, { fetchFn: null });
  check("a browser without fetch gives a clear error", r.error instanceof RequestError);
  check("errors are RequestError objects that say whether a retry makes sense", (() => { const e = new RequestError("x", true); return e.retryable === true && e.name === "RequestError"; })());

  // ----- getJsonCached -----
  const memo = new Map();
  const cache = { get: (k, age) => (memo.has(k) ? { data: memo.get(k).data, savedAt: memo.get(k).savedAt, ageMs: 5 } : null), set: (k, d) => memo.set(k, { data: d, savedAt: 111 }) };
  let fetches = 0; const fetchJson = async (u) => { fetches++; return { from: "network" }; };
  let g = await getJsonCached("u1", { cache, fetchJson, maxAgeMs: 1000, now: () => 222 });
  check("a miss downloads, saves, and reports it was not from the cache", g.fromCache === false && g.data.from === "network" && g.savedAt === 222 && memo.has("u1"));
  g = await getJsonCached("u1", { cache, fetchJson, maxAgeMs: 1000 });
  check("a hit uses the saved copy and does not download", g.fromCache === true && fetches === 1 && g.savedAt === 111);
  g = await getJsonCached("u1", { cache, fetchJson, maxAgeMs: 1000, force: true, now: () => 333 });
  check("force downloads again even when a saved copy exists", g.fromCache === false && fetches === 2 && g.savedAt === 333);
  let threw = false;
  try { await getJsonCached("u2", { cache, fetchJson, maxAgeMs: 1000, validate: () => { throw new Error("unexpected answer"); } }); } catch (e) { threw = /unexpected answer/.test(e.message); }
  check("an answer that fails validation is reported and never saved", threw && !memo.has("u2"));
  g = await getJsonCached("u3", { fetchJson, maxAgeMs: 1000 });
  check("it also works without a cache", g.fromCache === false && g.data.from === "network");

  console.log(`\nRESULTS: ${passed}/${total} tests passed`);
  process.exit(passed === total ? 0 : 1);
})();
