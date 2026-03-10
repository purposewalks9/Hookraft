// src/useQueue.ts
import { useState, useRef, useCallback } from "react";
function useQueue(options) {
  const { onProcess, onSuccess, onError, onDone, concurrency = 1 } = options;
  const [items, setItems] = useState([]);
  const [status, setStatus] = useState("idle");
  const pausedRef = useRef(false);
  const runningRef = useRef(0);
  const updateItem = useCallback((id, patch) => {
    setItems((prev) => prev.map((i) => i.id === id ? { ...i, ...patch } : i));
  }, []);
  const add = useCallback((data) => {
    const item = {
      id: crypto.randomUUID(),
      data,
      status: "pending"
    };
    setItems((prev) => [...prev, item]);
    return item.id;
  }, []);
  const process = useCallback(async (snapshot) => {
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
  const start = useCallback(() => {
    pausedRef.current = false;
    setStatus("running");
    setItems((prev) => {
      process(prev);
      return prev;
    });
  }, [process]);
  const pause = useCallback(() => {
    pausedRef.current = true;
    setStatus("paused");
  }, []);
  const clear = useCallback(() => {
    pausedRef.current = true;
    runningRef.current = 0;
    setItems([]);
    setStatus("idle");
  }, []);
  const reset = useCallback(() => {
    pausedRef.current = false;
    runningRef.current = 0;
    setItems((prev) => prev.map((i) => ({ ...i, status: "pending", error: void 0 })));
    setStatus("idle");
  }, []);
  const is = useCallback((s) => status === s, [status]);
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
import { useEffect, useRef as useRef2 } from "react";
import { Fragment, jsx } from "react/jsx-runtime";
function Queue({
  when,
  onRunning,
  onPaused,
  onDone,
  onIdle,
  fallback = null,
  children
}) {
  const prevWhen = useRef2(null);
  useEffect(() => {
    if (prevWhen.current === when) return;
    prevWhen.current = when;
    if (when === "running") onRunning?.();
    else if (when === "paused") onPaused?.();
    else if (when === "done") onDone?.();
    else if (when === "idle") onIdle?.();
  }, [when, onRunning, onPaused, onDone, onIdle]);
  const isVisible = when === "running" || when === "paused" || when === "done";
  return isVisible ? /* @__PURE__ */ jsx(Fragment, { children }) : /* @__PURE__ */ jsx(Fragment, { children: fallback });
}
export {
  Queue,
  useQueue
};
//# sourceMappingURL=index.js.map