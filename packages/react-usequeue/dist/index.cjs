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
  Queue: () => Queue,
  useQueue: () => useQueue
});
module.exports = __toCommonJS(index_exports);

// src/useQueue.ts
var import_react = require("react");
function useQueue(options) {
  const { onProcess, onSuccess, onError, onDone, concurrency = 1 } = options;
  const [items, setItems] = (0, import_react.useState)([]);
  const [status, setStatus] = (0, import_react.useState)("idle");
  const pausedRef = (0, import_react.useRef)(false);
  const runningRef = (0, import_react.useRef)(0);
  const updateItem = (0, import_react.useCallback)((id, patch) => {
    setItems((prev) => prev.map((i) => i.id === id ? { ...i, ...patch } : i));
  }, []);
  const add = (0, import_react.useCallback)((data) => {
    const item = {
      id: crypto.randomUUID(),
      data,
      status: "pending"
    };
    setItems((prev) => [...prev, item]);
    return item.id;
  }, []);
  const process = (0, import_react.useCallback)(async (snapshot) => {
    const pending = snapshot.filter((i) => i.status === "pending");
    if (pending.length === 0) {
      setStatus("done");
      onDone?.();
      return;
    }
    const toRun = pending.slice(0, concurrency - runningRef.current);
    for (const item of toRun) {
      if (pausedRef.current) break;
      runningRef.current++;
      updateItem(item.id, { status: "processing" });
      onProcess(item.data).then(() => {
        updateItem(item.id, { status: "completed" });
        onSuccess?.(item.data);
      }).catch((error) => {
        updateItem(item.id, { status: "failed", error });
        onError?.(item.data, error);
      }).finally(() => {
        runningRef.current--;
        setItems((prev) => {
          if (!pausedRef.current) process(prev);
          return prev;
        });
      });
    }
  }, [concurrency, onProcess, onSuccess, onError, onDone, updateItem]);
  const start = (0, import_react.useCallback)(() => {
    pausedRef.current = false;
    setStatus("running");
    setItems((prev) => {
      process(prev);
      return prev;
    });
  }, [process]);
  const pause = (0, import_react.useCallback)(() => {
    pausedRef.current = true;
    setStatus("paused");
  }, []);
  const clear = (0, import_react.useCallback)(() => {
    pausedRef.current = true;
    runningRef.current = 0;
    setItems([]);
    setStatus("idle");
  }, []);
  const reset = (0, import_react.useCallback)(() => {
    pausedRef.current = false;
    runningRef.current = 0;
    setItems((prev) => prev.map((i) => ({ ...i, status: "pending", error: void 0 })));
    setStatus("idle");
  }, []);
  const is = (0, import_react.useCallback)((s) => status === s, [status]);
  return {
    status,
    is,
    add,
    start,
    pause,
    clear,
    reset,
    items,
    pending: items.filter((i) => i.status === "pending"),
    processing: items.filter((i) => i.status === "processing"),
    completed: items.filter((i) => i.status === "completed"),
    failed: items.filter((i) => i.status === "failed")
  };
}

// src/Queue.tsx
var import_react2 = require("react");
var import_jsx_runtime = require("react/jsx-runtime");
function Queue({
  when,
  onRunning,
  onPaused,
  onDone,
  onIdle,
  fallback = null,
  children
}) {
  const prevWhen = (0, import_react2.useRef)(null);
  (0, import_react2.useEffect)(() => {
    if (prevWhen.current === when) return;
    prevWhen.current = when;
    if (when === "running") onRunning?.();
    else if (when === "paused") onPaused?.();
    else if (when === "done") onDone?.();
    else if (when === "idle") onIdle?.();
  }, [when, onRunning, onPaused, onDone, onIdle]);
  const isVisible = when === "running" || when === "paused" || when === "done";
  return isVisible ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_jsx_runtime.Fragment, { children }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_jsx_runtime.Fragment, { children: fallback });
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  Queue,
  useQueue
});
//# sourceMappingURL=index.cjs.map