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
  useIntent: () => useIntent
});
module.exports = __toCommonJS(index_exports);

// src/useIntent.ts
var import_react = require("react");
function isBrowser() {
  return typeof window !== "undefined";
}
function buildInitialState() {
  return {
    isLeaving: false,
    isIdle: false,
    isEngaged: false,
    isLostInterest: false,
    isAboutToClick: false,
    isReturning: false,
    isTabHidden: false,
    isReading: false,
    timeOnPage: 0,
    scrollDepth: 0,
    scrollDirection: "idle",
    scrollSpeed: 0,
    signals: [],
    exitConfidence: 0,
    engagementScore: 0
  };
}
function computeExitConfidence(state) {
  let score = 0;
  if (state.isLeaving) score += 50;
  if (state.isLostInterest) score += 25;
  if (state.isIdle) score += 10;
  if (state.isTabHidden) score += 15;
  if (state.scrollDirection === "up" && (state.scrollDepth ?? 0) < 20) score += 10;
  return Math.min(100, score);
}
function computeEngagementScore(state) {
  let score = 0;
  if (state.isReading) score += 35;
  if (state.isEngaged) score += 30;
  if ((state.scrollDepth ?? 0) > 50) score += 20;
  if ((state.timeOnPage ?? 0) > 3e4) score += 15;
  if (state.isLostInterest) score -= 30;
  if (state.isLeaving) score -= 40;
  if (state.isIdle) score -= 10;
  return Math.max(0, Math.min(100, score));
}
function buildSignals(state) {
  const signals = [];
  if (state.isLeaving) signals.push("leaving");
  if (state.isIdle) signals.push("idle");
  if (state.isEngaged) signals.push("engaged");
  if (state.isLostInterest) signals.push("lost_interest");
  if (state.isAboutToClick) signals.push("about_to_click");
  if (state.isReturning) signals.push("returning");
  if (state.isTabHidden) signals.push("tab_hidden");
  if (state.isReading) signals.push("reading");
  return signals;
}
function useIntent(options = {}) {
  const {
    idleAfter = 30,
    skimThreshold = 800,
    readingThreshold = 100,
    exitThreshold = 20,
    onLeaving,
    onIdle,
    onReturn,
    onTabHidden,
    onTabVisible,
    onLostInterest,
    onEngaged,
    onChange
  } = options;
  const [state, setState] = (0, import_react.useState)(buildInitialState);
  const lastScrollY = (0, import_react.useRef)(0);
  const lastScrollTime = (0, import_react.useRef)(Date.now());
  const lastMouseMove = (0, import_react.useRef)(Date.now());
  const lastActivity = (0, import_react.useRef)(Date.now());
  const startTime = (0, import_react.useRef)(Date.now());
  const idleTimer = (0, import_react.useRef)(null);
  const timeOnPageTimer = (0, import_react.useRef)(null);
  const wasIdle = (0, import_react.useRef)(false);
  const wasHidden = (0, import_react.useRef)(false);
  const engagedFiredRef = (0, import_react.useRef)(false);
  const engagedThreshold = options.onEngaged ? 60 : Infinity;
  const onLeavingRef = (0, import_react.useRef)(onLeaving);
  const onIdleRef = (0, import_react.useRef)(onIdle);
  const onReturnRef = (0, import_react.useRef)(onReturn);
  const onTabHiddenRef = (0, import_react.useRef)(onTabHidden);
  const onTabVisibleRef = (0, import_react.useRef)(onTabVisible);
  const onLostInterestRef = (0, import_react.useRef)(onLostInterest);
  const onEngagedRef = (0, import_react.useRef)(onEngaged);
  const onChangeRef = (0, import_react.useRef)(onChange);
  (0, import_react.useEffect)(() => {
    onLeavingRef.current = onLeaving;
  }, [onLeaving]);
  (0, import_react.useEffect)(() => {
    onIdleRef.current = onIdle;
  }, [onIdle]);
  (0, import_react.useEffect)(() => {
    onReturnRef.current = onReturn;
  }, [onReturn]);
  (0, import_react.useEffect)(() => {
    onTabHiddenRef.current = onTabHidden;
  }, [onTabHidden]);
  (0, import_react.useEffect)(() => {
    onTabVisibleRef.current = onTabVisible;
  }, [onTabVisible]);
  (0, import_react.useEffect)(() => {
    onLostInterestRef.current = onLostInterest;
  }, [onLostInterest]);
  (0, import_react.useEffect)(() => {
    onEngagedRef.current = onEngaged;
  }, [onEngaged]);
  (0, import_react.useEffect)(() => {
    onChangeRef.current = onChange;
  }, [onChange]);
  const updateState = (0, import_react.useCallback)((patch) => {
    setState((prev) => {
      const next = { ...prev, ...patch };
      next.signals = buildSignals(next);
      next.exitConfidence = computeExitConfidence(next);
      next.engagementScore = computeEngagementScore(next);
      next.timeOnPage = Date.now() - startTime.current;
      if (next.engagementScore >= engagedThreshold && !engagedFiredRef.current) {
        engagedFiredRef.current = true;
        onEngagedRef.current?.(next.engagementScore);
      }
      onChangeRef.current?.(next);
      return next;
    });
  }, [engagedThreshold]);
  const resetIdleTimer = (0, import_react.useCallback)(() => {
    lastActivity.current = Date.now();
    if (idleTimer.current) clearTimeout(idleTimer.current);
    if (wasIdle.current || wasHidden.current) {
      wasIdle.current = false;
      wasHidden.current = false;
      updateState({ isIdle: false, isReturning: true, isLeaving: false });
      onReturnRef.current?.();
      setTimeout(() => updateState({ isReturning: false }), 2e3);
    }
    idleTimer.current = setTimeout(() => {
      wasIdle.current = true;
      updateState({ isIdle: true, isEngaged: false, isReading: false });
      onIdleRef.current?.();
    }, idleAfter * 1e3);
  }, [idleAfter, updateState]);
  (0, import_react.useEffect)(() => {
    if (!isBrowser()) return;
    const handleMouseLeave = (e) => {
      if (e.clientY <= exitThreshold) {
        updateState({ isLeaving: true });
        onLeavingRef.current?.();
      }
    };
    const handleMouseEnter = () => {
      updateState({ isLeaving: false });
    };
    const mousePositions = [];
    const handleMouseMove = (e) => {
      const now = Date.now();
      lastMouseMove.current = now;
      mousePositions.push({ x: e.clientX, y: e.clientY, t: now });
      if (mousePositions.length > 5) mousePositions.shift();
      if (mousePositions.length >= 2) {
        const prev = mousePositions[mousePositions.length - 2];
        const curr = mousePositions[mousePositions.length - 1];
        const dt = (curr.t - prev.t) / 1e3;
        if (dt > 0) {
          const dx = curr.x - prev.x;
          const dy = curr.y - prev.y;
          const speed = Math.sqrt(dx * dx + dy * dy) / dt;
          const isDecelerating = mousePositions.length === 5 && speed < 100 && mousePositions[0] !== mousePositions[4];
          updateState({ isAboutToClick: isDecelerating });
        }
      }
      resetIdleTimer();
    };
    const handleScroll = () => {
      const now = Date.now();
      const currentY = window.scrollY;
      const dt = (now - lastScrollTime.current) / 1e3;
      const dy = currentY - lastScrollY.current;
      const speed = dt > 0 ? Math.abs(dy) / dt : 0;
      const direction = dy > 0 ? "down" : dy < 0 ? "up" : "idle";
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrollDepth = docHeight > 0 ? Math.round(currentY / docHeight * 100) : 0;
      const isReading = speed < readingThreshold && speed > 0;
      const isEngaged = speed > 0 && speed < skimThreshold;
      const isLostInterest = speed > skimThreshold;
      if (isLostInterest) {
        onLostInterestRef.current?.();
      }
      updateState({
        scrollSpeed: Math.round(speed),
        scrollDirection: direction,
        scrollDepth,
        isReading,
        isEngaged,
        isLostInterest
      });
      lastScrollY.current = currentY;
      lastScrollTime.current = now;
      resetIdleTimer();
    };
    const handleVisibilityChange = () => {
      if (document.hidden) {
        wasHidden.current = true;
        updateState({ isTabHidden: true, isEngaged: false });
        onTabHiddenRef.current?.();
      } else {
        updateState({ isTabHidden: false, isReturning: true });
        onTabVisibleRef.current?.();
        onReturnRef.current?.();
        setTimeout(() => updateState({ isReturning: false }), 2e3);
      }
    };
    const handleKeyPress = () => {
      resetIdleTimer();
      updateState({ isEngaged: true });
    };
    timeOnPageTimer.current = setInterval(() => {
      updateState({ timeOnPage: Date.now() - startTime.current });
    }, 1e3);
    document.addEventListener("mouseleave", handleMouseLeave);
    document.addEventListener("mouseenter", handleMouseEnter);
    document.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("scroll", handleScroll, { passive: true });
    document.addEventListener("visibilitychange", handleVisibilityChange);
    document.addEventListener("keydown", handleKeyPress);
    resetIdleTimer();
    return () => {
      document.removeEventListener("mouseleave", handleMouseLeave);
      document.removeEventListener("mouseenter", handleMouseEnter);
      document.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("scroll", handleScroll);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      document.removeEventListener("keydown", handleKeyPress);
      if (idleTimer.current) clearTimeout(idleTimer.current);
      if (timeOnPageTimer.current) clearInterval(timeOnPageTimer.current);
    };
  }, [exitThreshold, readingThreshold, skimThreshold, resetIdleTimer, updateState]);
  const reset = (0, import_react.useCallback)(() => {
    startTime.current = Date.now();
    lastScrollY.current = 0;
    lastScrollTime.current = Date.now();
    lastActivity.current = Date.now();
    wasIdle.current = false;
    wasHidden.current = false;
    engagedFiredRef.current = false;
    setState(buildInitialState());
    resetIdleTimer();
  }, [resetIdleTimer]);
  return { ...state, reset };
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  useIntent
});
//# sourceMappingURL=index.cjs.map