"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var index_exports = {};
__export(index_exports, {
  useCacheQuery: () => useCacheQuery
});
module.exports = __toCommonJS(index_exports);

// src/usecachequery.ts
var import_react = require("react");
var memoryCache = /* @__PURE__ */ new Map();
var pendingRequests = /* @__PURE__ */ new Map();
function isCacheApiAvailable() {
  return typeof window !== "undefined" && "caches" in window && window.isSecureContext;
}
function parseExpiry(exp) {
  const units = { m: 60, h: 3600, d: 86400 };
  const match = exp.match(/^(\d+)([mhd])$/);
  if (!match) return null;
  return parseInt(match[1]) * units[match[2]] * 1e3;
}
function isExpired(timestamp, expires) {
  const ttl = parseExpiry(expires);
  if (ttl === null) return false;
  return Date.now() - timestamp > ttl;
}
function cacheKey(key) {
  return `/hookraft-cache/${key}`;
}
async function readFromCacheApi(key, cacheName) {
  try {
    const cache = await caches.open(cacheName);
    const cached = await cache.match(cacheKey(key));
    if (!cached) return null;
    return await cached.json();
  } catch {
    return null;
  }
}
async function writeToCacheApi(key, cacheName, data, timestamp) {
  try {
    const cache = await caches.open(cacheName);
    const entry = { data, timestamp };
    const response = new Response(JSON.stringify(entry), {
      headers: { "Content-Type": "application/json" }
    });
    await cache.put(cacheKey(key), response);
  } catch {
  }
}
async function deleteFromCacheApi(key, cacheName) {
  try {
    const cache = await caches.open(cacheName);
    await cache.delete(cacheKey(key));
  } catch {
  }
}
function useCacheQuery(key, fetcher, options = {}) {
  const {
    cacheName = "hookraft-cache-v1",
    expires = null,
    revalidate = false,
    onCacheHit,
    onFetchSuccess,
    onExpired,
    onError
  } = options;
  const [data, setData] = (0, import_react.useState)(null);
  const [status, setStatus] = (0, import_react.useState)("idle");
  const [source, setSource] = (0, import_react.useState)(null);
  const mountedRef = (0, import_react.useRef)(true);
  const fetcherRef = (0, import_react.useRef)(fetcher);
  const onCacheHitRef = (0, import_react.useRef)(onCacheHit);
  const onFetchSuccessRef = (0, import_react.useRef)(onFetchSuccess);
  const onExpiredRef = (0, import_react.useRef)(onExpired);
  const onErrorRef = (0, import_react.useRef)(onError);
  (0, import_react.useEffect)(() => {
    fetcherRef.current = fetcher;
  }, [fetcher]);
  (0, import_react.useEffect)(() => {
    onCacheHitRef.current = onCacheHit;
  }, [onCacheHit]);
  (0, import_react.useEffect)(() => {
    onFetchSuccessRef.current = onFetchSuccess;
  }, [onFetchSuccess]);
  (0, import_react.useEffect)(() => {
    onExpiredRef.current = onExpired;
  }, [onExpired]);
  (0, import_react.useEffect)(() => {
    onErrorRef.current = onError;
  }, [onError]);
  (0, import_react.useEffect)(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);
  const fetchFromNetwork = (0, import_react.useCallback)(async () => {
    if (pendingRequests.has(key)) {
      return pendingRequests.get(key);
    }
    const promise = fetcherRef.current();
    pendingRequests.set(key, promise);
    try {
      const result = await promise;
      return result;
    } finally {
      pendingRequests.delete(key);
    }
  }, [key]);
  const saveToAllLayers = (0, import_react.useCallback)(
    async (payload) => {
      const timestamp = Date.now();
      memoryCache.set(key, { data: payload, timestamp });
      await writeToCacheApi(key, cacheName, payload, timestamp);
    },
    [key, cacheName]
  );
  const refresh = (0, import_react.useCallback)(async () => {
    if (!mountedRef.current) return;
    setStatus("revalidating");
    try {
      const fresh = await fetchFromNetwork();
      await saveToAllLayers(fresh);
      if (!mountedRef.current) return;
      setData(fresh);
      setSource("network");
      setStatus("success");
      onFetchSuccessRef.current?.(fresh);
    } catch (err) {
      if (!mountedRef.current) return;
      setStatus("error");
      onErrorRef.current?.(err);
    }
  }, [fetchFromNetwork, saveToAllLayers]);
  const invalidate = (0, import_react.useCallback)(async () => {
    memoryCache.delete(key);
    await deleteFromCacheApi(key, cacheName);
    if (!mountedRef.current) return;
    setData(null);
    setStatus("idle");
    setSource(null);
  }, [key, cacheName]);
  const update = (0, import_react.useCallback)(
    async (newData) => {
      await saveToAllLayers(newData);
      if (!mountedRef.current) return;
      setData(newData);
    },
    [saveToAllLayers]
  );
  (0, import_react.useEffect)(() => {
    let cancelled = false;
    const run = async () => {
      setStatus("loading");
      const memory = memoryCache.get(key);
      if (memory) {
        if (expires && isExpired(memory.timestamp, expires)) {
          memoryCache.delete(key);
        } else {
          if (!cancelled) {
            setData(memory.data);
            setSource("memory");
            setStatus(revalidate ? "stale" : "success");
            onCacheHitRef.current?.(memory.data);
          }
          if (revalidate && !cancelled) await refresh();
          return;
        }
      }
      if (isCacheApiAvailable()) {
        const cached = await readFromCacheApi(key, cacheName);
        if (cached) {
          if (expires && isExpired(cached.timestamp, expires)) {
            await deleteFromCacheApi(key, cacheName);
            if (!cancelled) {
              setStatus("expired");
              onExpiredRef.current?.();
            }
          } else {
            memoryCache.set(key, { data: cached.data, timestamp: cached.timestamp });
            if (!cancelled) {
              setData(cached.data);
              setSource("cache");
              setStatus(revalidate ? "stale" : "success");
              onCacheHitRef.current?.(cached.data);
            }
            if (revalidate && !cancelled) await refresh();
            return;
          }
        }
      }
      if (!cancelled) {
        setStatus("loading");
        try {
          const fresh = await fetchFromNetwork();
          await saveToAllLayers(fresh);
          if (!cancelled) {
            setData(fresh);
            setSource("network");
            setStatus("success");
            onFetchSuccessRef.current?.(fresh);
          }
        } catch (err) {
          if (!cancelled) {
            setStatus("error");
            onErrorRef.current?.(err);
          }
        }
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [key, cacheName, expires, revalidate, fetchFromNetwork, saveToAllLayers, refresh]);
  return { data, status, source, refresh, invalidate, update };
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  useCacheQuery
});
//# sourceMappingURL=index.cjs.map