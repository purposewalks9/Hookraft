import { useRef, useEffect, useState, useCallback } from 'react';
import { jsx, Fragment } from 'react/jsx-runtime';

// src/Doorway.tsx
function Doorway({
  when,
  onEnter,
  onExit,
  onLoading,
  onSuccess,
  onError,
  fallback = null,
  children
}) {
  const prevWhen = useRef(null);
  useEffect(() => {
    if (prevWhen.current === when) return;
    prevWhen.current = when;
    if (when === false || when === "idle") {
      onExit?.();
    } else if (when === true || when === "enter") {
      onEnter?.();
    } else if (when === "loading") {
      onLoading?.();
    } else if (when === "success") {
      onSuccess?.();
    } else if (when === "error") {
      onError?.();
    }
  }, [when, onEnter, onExit, onLoading, onSuccess, onError]);
  const isVisible = when === true || when === "enter" || when === "loading" || when === "success" || when === "error";
  return isVisible ? /* @__PURE__ */ jsx(Fragment, { children }) : /* @__PURE__ */ jsx(Fragment, { children: fallback });
}
function useDoorway(options = {}) {
  const { onEnter, onExit, onLoading, onSuccess, onError } = options;
  const [status, setStatus] = useState("idle");
  const prevStatus = useRef("idle");
  const mounted = useRef(false);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  useEffect(() => {
    if (prevStatus.current === status) return;
    prevStatus.current = status;
    switch (status) {
      case "enter":
        onEnter?.();
        break;
      case "idle":
        onExit?.();
        break;
      case "loading":
        onLoading?.();
        break;
      case "success":
        onSuccess?.();
        break;
      case "error":
        onError?.();
        break;
    }
  }, [status, onEnter, onExit, onLoading, onSuccess, onError]);
  const enter = useCallback(() => setStatus("enter"), []);
  const exit = useCallback(() => setStatus("idle"), []);
  const load = useCallback(() => setStatus("loading"), []);
  const succeed = useCallback(() => setStatus("success"), []);
  const fail = useCallback(() => setStatus("error"), []);
  const reset = useCallback(() => {
    prevStatus.current = "idle";
    setStatus("idle");
  }, []);
  const is = useCallback((s) => status === s, [status]);
  return { status, is, enter, exit, load, succeed, fail, reset };
}

export { Doorway, useDoorway };
//# sourceMappingURL=index.js.map
//# sourceMappingURL=index.js.map