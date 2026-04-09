// src/useRequest.ts
import { useState, useEffect, useCallback, useRef } from "react";

// src/store.ts
var cache = /* @__PURE__ */ new Map();
var inFlight = /* @__PURE__ */ new Map();
function getCached(key, cacheTime) {
  const entry = cache.get(key);
  if (!entry) return null;
  if (cacheTime === 0) return null;
  const isStale = Date.now() - entry.timestamp > cacheTime;
  if (isStale) {
    cache.delete(key);
    return null;
  }
  return entry.data;
}
function setCached(key, data) {
  cache.set(key, { data, timestamp: Date.now() });
}
function clearCached(key) {
  cache.delete(key);
}
function getInFlight(key) {
  const entry = inFlight.get(key);
  if (!entry) return null;
  entry.subscribers++;
  return entry.promise;
}
function setInFlight(key, promise) {
  inFlight.set(key, { promise, subscribers: 1 });
}
function clearInFlight(key) {
  inFlight.delete(key);
}
function clearAll() {
  cache.clear();
  inFlight.clear();
}

// src/useRequest.ts
var defaultFetcher = (key) => fetch(key).then((res) => {
  if (!res.ok) throw new Error(`Request failed: ${res.status} ${res.statusText}`);
  return res.json();
});
function useRequest(key, options = {}) {
  const {
    fetcher = defaultFetcher,
    cacheTime = 3e4,
    dedupe = true,
    manual = false,
    onSuccess,
    onError,
    onStatusChange
  } = options;
  const [data, setData] = useState(() => {
    if (!key) return void 0;
    return getCached(key, cacheTime) ?? void 0;
  });
  const [status, setStatus] = useState(() => {
    if (!key) return "idle";
    const cached = getCached(key, cacheTime);
    return cached !== null ? "success" : "idle";
  });
  const [error, setError] = useState(void 0);
  const mountedRef = useRef(true);
  const onSuccessRef = useRef(onSuccess);
  const onErrorRef = useRef(onError);
  const onStatusChangeRef = useRef(onStatusChange);
  useEffect(() => {
    onSuccessRef.current = onSuccess;
  }, [onSuccess]);
  useEffect(() => {
    onErrorRef.current = onError;
  }, [onError]);
  useEffect(() => {
    onStatusChangeRef.current = onStatusChange;
  }, [onStatusChange]);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);
  const updateStatus = useCallback((next) => {
    if (!mountedRef.current) return;
    setStatus(next);
    onStatusChangeRef.current?.(next);
  }, []);
  const execute = useCallback(
    async (forceRefresh = false) => {
      if (!key) return;
      if (!forceRefresh) {
        const cached = getCached(key, cacheTime);
        if (cached !== null) {
          if (mountedRef.current) {
            setData(cached);
            updateStatus("success");
          }
          return;
        }
      } else {
        clearCached(key);
      }
      if (dedupe) {
        const existing = getInFlight(key);
        if (existing) {
          updateStatus("loading");
          try {
            const result = await existing;
            if (!mountedRef.current) return;
            setData(result);
            updateStatus("success");
            onSuccessRef.current?.(result);
          } catch (err) {
            if (!mountedRef.current) return;
            setError(err);
            updateStatus("error");
            onErrorRef.current?.(err);
          }
          return;
        }
      }
      updateStatus("loading");
      const promise = fetcher(key);
      if (dedupe) {
        setInFlight(key, promise);
      }
      try {
        const result = await promise;
        setCached(key, result);
        clearInFlight(key);
        if (!mountedRef.current) return;
        setData(result);
        setError(void 0);
        updateStatus("success");
        onSuccessRef.current?.(result);
      } catch (err) {
        clearInFlight(key);
        if (!mountedRef.current) return;
        setError(err);
        updateStatus("error");
        onErrorRef.current?.(err);
      }
    },
    [key, cacheTime, dedupe, fetcher, updateStatus]
  );
  useEffect(() => {
    if (!key || manual) return;
    execute();
  }, [key, manual, execute]);
  const refetch = useCallback(async () => {
    await execute(true);
  }, [execute]);
  const clear = useCallback(() => {
    if (!key) return;
    clearCached(key);
    setData(void 0);
    setError(void 0);
    updateStatus("idle");
  }, [key, updateStatus]);
  const is = useCallback((s) => status === s, [status]);
  return {
    data,
    status,
    error,
    isLoading: status === "loading",
    isSuccess: status === "success",
    isError: status === "error",
    is,
    refetch,
    clear
  };
}
export {
  clearAll,
  useRequest
};
//# sourceMappingURL=index.js.map