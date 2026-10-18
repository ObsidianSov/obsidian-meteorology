// Reliable web requests: a time limit, a few retries for temporary problems, and messages a person can act on.
// Pure logic with injected fetch/sleep, so it can be tested without a network. See docs/data-sources.md.

class RequestError extends Error {
  constructor(message, retryable) {
    super(message);
    this.name = "RequestError";
    this.retryable = retryable;
  }
}

function describeHttpProblem(label, status) {
  if (status === 429) return new RequestError(`${label} says too many requests were made (status 429)`, true);
  if (status >= 500) return new RequestError(`${label} is having problems (status ${status})`, true);
  return new RequestError(`${label} rejected the request (status ${status})`, false);
}

async function attemptOnce(url, fetchFn, timeoutMs, label) {
  const controller = typeof AbortController === "function" ? new AbortController() : null;
  let timer;
  try {
    const timeout = new Promise((_, reject) => {
      timer = setTimeout(() => {
        if (controller) controller.abort();
        reject(new RequestError(`${label} took longer than ${Math.max(1, Math.round(timeoutMs / 1000))} seconds to answer`, true));
      }, timeoutMs);
    });
    const pending = Promise.resolve(fetchFn(url, controller ? { signal: controller.signal } : undefined));
    pending.catch(() => {});             // a late failure after a timeout must not become an unhandled error
    const response = await Promise.race([pending, timeout]);
    if (!response.ok) throw describeHttpProblem(label, response.status);
    try { return await response.json(); }
    catch (e) { throw new RequestError(`${label} sent an answer that could not be read`, false); }
  } finally {
    clearTimeout(timer);
  }
}

async function fetchJsonWithRetry(url, options = {}) {
  const {
    fetchFn = (typeof fetch === "function" ? fetch : null),
    timeoutMs = 30000, retries = 2, backoffMs = 1000,
    sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms)),
    label = "the service", onRetry = null
  } = options;
  if (!fetchFn) throw new RequestError("This browser cannot make web requests.", false);
  let lastError;
  for (let attempt = 0; attempt <= retries; attempt++) {
    if (attempt > 0) {
      if (onRetry) onRetry(attempt, lastError);
      await sleep(backoffMs * 2 ** (attempt - 1));
    }
    try {
      return await attemptOnce(url, fetchFn, timeoutMs, label);
    } catch (e) {
      lastError = e instanceof RequestError ? e : new RequestError(`could not reach ${label} (check your internet connection)`, true);
      if (!lastError.retryable) throw lastError;
    }
  }
  throw lastError;
}

async function getJsonCached(url, options = {}) {
  // Uses a saved copy when it is fresh; otherwise downloads, checks the answer, and only then saves it.
  // `validate(data)` must throw if the answer is unusable: bad data is never saved.
  const { cache, fetchJson, maxAgeMs, force = false, validate = null, now = () => Date.now() } = options;
  if (!force && cache) {
    const hit = cache.get(url, maxAgeMs);
    if (hit) return { data: hit.data, savedAt: hit.savedAt, fromCache: true };
  }
  const data = await fetchJson(url);
  if (validate) validate(data);
  if (cache) cache.set(url, data);
  return { data, savedAt: now(), fromCache: false };
}

if (typeof module !== "undefined") module.exports = { RequestError, fetchJsonWithRetry, getJsonCached };
