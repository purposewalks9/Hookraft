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
  useHistory: () => useHistory
});
module.exports = __toCommonJS(index_exports);

// src/useHistory.ts
var import_react = require("react");
function useHistory(initialValue, options = {}) {
  const { limit = 100, onUndo, onRedo, onChange } = options;
  const [state, setState] = (0, import_react.useState)(initialValue);
  const pastRef = (0, import_react.useRef)([]);
  const futureRef = (0, import_react.useRef)([]);
  const [, forceRender] = (0, import_react.useState)(0);
  const rerender = (0, import_react.useCallback)(() => forceRender((n) => n + 1), []);
  const set = (0, import_react.useCallback)(
    (value) => {
      setState((prev) => {
        const next = typeof value === "function" ? value(prev) : value;
        if (Object.is(prev, next)) return prev;
        pastRef.current = [...pastRef.current, prev].slice(-limit);
        futureRef.current = [];
        onChange?.(next);
        return next;
      });
      rerender();
    },
    [limit, onChange, rerender]
  );
  const undo = (0, import_react.useCallback)(() => {
    if (pastRef.current.length === 0) return;
    setState((current) => {
      const past = pastRef.current;
      const previous = past[past.length - 1];
      pastRef.current = past.slice(0, -1);
      futureRef.current = [current, ...futureRef.current];
      onUndo?.(previous);
      onChange?.(previous);
      return previous;
    });
    rerender();
  }, [onUndo, onChange, rerender]);
  const redo = (0, import_react.useCallback)(() => {
    if (futureRef.current.length === 0) return;
    setState((current) => {
      const [next, ...remainingFuture] = futureRef.current;
      pastRef.current = [...pastRef.current, current];
      futureRef.current = remainingFuture;
      onRedo?.(next);
      onChange?.(next);
      return next;
    });
    rerender();
  }, [onRedo, onChange, rerender]);
  const clear = (0, import_react.useCallback)(() => {
    pastRef.current = [];
    futureRef.current = [];
    setState(initialValue);
    rerender();
  }, [initialValue, rerender]);
  const jump = (0, import_react.useCallback)(
    (index) => {
      const allStates = [...pastRef.current, state, ...futureRef.current];
      const targetIndex = index < 0 ? 0 : index >= allStates.length ? allStates.length - 1 : index;
      const target = allStates[targetIndex];
      pastRef.current = allStates.slice(0, targetIndex);
      futureRef.current = allStates.slice(targetIndex + 1);
      setState(target);
      onChange?.(target);
      rerender();
    },
    [state, onChange, rerender]
  );
  return {
    state,
    set,
    undo,
    redo,
    canUndo: pastRef.current.length > 0,
    canRedo: futureRef.current.length > 0,
    history: pastRef.current,
    future: futureRef.current,
    clear,
    jump
  };
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  useHistory
});
//# sourceMappingURL=index.js.map