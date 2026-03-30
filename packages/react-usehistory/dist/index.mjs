// src/useHistory.ts
import { useState, useCallback, useRef } from "react";
function useHistory(initialValue, options = {}) {
  const { limit = 100, onUndo, onRedo, onChange } = options;
  const [state, setState] = useState(initialValue);
  const pastRef = useRef([]);
  const futureRef = useRef([]);
  const [, forceRender] = useState(0);
  const rerender = useCallback(() => forceRender((n) => n + 1), []);
  const set = useCallback(
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
  const undo = useCallback(() => {
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
  const redo = useCallback(() => {
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
  const clear = useCallback(() => {
    pastRef.current = [];
    futureRef.current = [];
    setState(initialValue);
    rerender();
  }, [initialValue, rerender]);
  const jump = useCallback(
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
export {
  useHistory
};
//# sourceMappingURL=index.mjs.map