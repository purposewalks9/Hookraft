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
  clearAll: () => clearAll,
  useRequest: () => useRequest
});
module.exports = __toCommonJS(index_exports);

// src/useRequest.ts
var import_react = require("react");

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
  const [data, setData] = (0, import_react.useState)(() => {
    if (!key) return void 0;
    return getCached(key, cacheTime) ?? void 0;
  });
  const [status, setStatus] = (0, import_react.useState)(() => {
    if (!key) return "idle";
    const cached = getCached(key, cacheTime);
    return cached !== null ? "success" : "idle";
  });
  const [error, setError] = (0, import_react.useState)(void 0);
  const mountedRef = (0, import_react.useRef)(true);
  const onSuccessRef = (0, import_react.useRef)(onSuccess);
  const onErrorRef = (0, import_react.useRef)(onError);
  const onStatusChangeRef = (0, import_react.useRef)(onStatusChange);
  (0, import_react.useEffect)(() => {
    onSuccessRef.current = onSuccess;
  }, [onSuccess]);
  (0, import_react.useEffect)(() => {
    onErrorRef.current = onError;
  }, [onError]);
  (0, import_react.useEffect)(() => {
    onStatusChangeRef.current = onStatusChange;
  }, [onStatusChange]);
  (0, import_react.useEffect)(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);
  const updateStatus = (0, import_react.useCallback)((next) => {
    if (!mountedRef.current) return;
    setStatus(next);
    onStatusChangeRef.current?.(next);
  }, []);
  const execute = (0, import_react.useCallback)(
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
  (0, import_react.useEffect)(() => {
    if (!key || manual) return;
    execute();
  }, [key, manual, execute]);
  const refetch = (0, import_react.useCallback)(async () => {
    await execute(true);
  }, [execute]);
  const clear = (0, import_react.useCallback)(() => {
    if (!key) return;
    clearCached(key);
    setData(void 0);
    setError(void 0);
    updateStatus("idle");
  }, [key, updateStatus]);
  const is = (0, import_react.useCallback)(
    (s) => status === s,
    [status]
  );
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
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  clearAll,
  useRequest
});
//# sourceMappingURL=index.cjs.map