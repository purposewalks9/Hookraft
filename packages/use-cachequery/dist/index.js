// src/usecachequery.ts
import { useState, useEffect, useRef, useCallback } from "react";
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
  const [data, setData] = useState(null);
  const [status, setStatus] = useState("idle");
  const [source, setSource] = useState(null);
  const mountedRef = useRef(true);
  const fetcherRef = useRef(fetcher);
  const onCacheHitRef = useRef(onCacheHit);
  const onFetchSuccessRef = useRef(onFetchSuccess);
  const onExpiredRef = useRef(onExpired);
  const onErrorRef = useRef(onError);
  useEffect(() => {
    fetcherRef.current = fetcher;
  }, [fetcher]);
  useEffect(() => {
    onCacheHitRef.current = onCacheHit;
  }, [onCacheHit]);
  useEffect(() => {
    onFetchSuccessRef.current = onFetchSuccess;
  }, [onFetchSuccess]);
  useEffect(() => {
    onExpiredRef.current = onExpired;
  }, [onExpired]);
  useEffect(() => {
    onErrorRef.current = onError;
  }, [onError]);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);
  const fetchFromNetwork = useCallback(async () => {
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
  const saveToAllLayers = useCallback(
    async (payload) => {
      const timestamp = Date.now();
      memoryCache.set(key, { data: payload, timestamp });
      await writeToCacheApi(key, cacheName, payload, timestamp);
    },
    [key, cacheName]
  );
  const refresh = useCallback(async () => {
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
  const invalidate = useCallback(async () => {
    memoryCache.delete(key);
    await deleteFromCacheApi(key, cacheName);
    if (!mountedRef.current) return;
    setData(null);
    setStatus("idle");
    setSource(null);
  }, [key, cacheName]);
  const update = useCallback(
    async (newData) => {
      await saveToAllLayers(newData);
      if (!mountedRef.current) return;
      setData(newData);
    },
    [saveToAllLayers]
  );
  useEffect(() => {
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
export {
  useCacheQuery
};
//# sourceMappingURL=index.js.map