'use strict';

var react = require('react');
var jsxRuntime = require('react/jsx-runtime');

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
  const prevWhen = react.useRef(null);
  react.useEffect(() => {
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
  return isVisible ? /* @__PURE__ */ jsxRuntime.jsx(jsxRuntime.Fragment, { children }) : /* @__PURE__ */ jsxRuntime.jsx(jsxRuntime.Fragment, { children: fallback });
}
function useDoorway(options = {}) {
  const { onEnter, onExit, onLoading, onSuccess, onError } = options;
  const [status, setStatus] = react.useState("idle");
  const prevStatus = react.useRef("idle");
  const mounted = react.useRef(false);
  react.useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  react.useEffect(() => {
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
  const enter = react.useCallback(() => setStatus("enter"), []);
  const exit = react.useCallback(() => setStatus("idle"), []);
  const load = react.useCallback(() => setStatus("loading"), []);
  const succeed = react.useCallback(() => setStatus("success"), []);
  const fail = react.useCallback(() => setStatus("error"), []);
  const reset = react.useCallback(() => {
    prevStatus.current = "idle";
    setStatus("idle");
  }, []);
  const is = react.useCallback((s) => status === s, [status]);
  return { status, is, enter, exit, load, succeed, fail, reset };
}

exports.Doorway = Doorway;
exports.useDoorway = useDoorway;
//# sourceMappingURL=index.cjs.map
//# sourceMappingURL=index.cjs.map