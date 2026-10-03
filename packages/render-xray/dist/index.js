import { useRef, useEffect } from 'react';

// src/useRenderXray.ts

// src/diff.ts
function diffValues(source, prev, next) {
  const changes = [];
  const allKeys = /* @__PURE__ */ new Set([...Object.keys(prev != null ? prev : {}), ...Object.keys(next)]);
  allKeys.forEach((key) => {
    const prevVal = prev == null ? void 0 : prev[key];
    const nextVal = next[key];
    if (Object.is(prevVal, nextVal)) return;
    const hadKey = prev !== null && key in prev;
    const hasKey = key in next;
    const reason = classifyChange(prevVal, nextVal, hadKey, hasKey);
    const avoidable = reason === "same-value-new-reference" || reason === "new-function-reference";
    const severity = avoidable ? "avoidable" : "expected";
    changes.push({ source, key, prev: prevVal, next: nextVal, reason, avoidable, severity });
  });
  return changes;
}
function classifyChange(prev, next, hadKey, hasKey) {
  if (!hadKey) return "added";
  if (!hasKey) return "removed";
  if (typeof prev === "function" && typeof next === "function") return "new-function-reference";
  if (isPlainObject(prev) && isPlainObject(next) || Array.isArray(prev) && Array.isArray(next)) {
    return safeDeepEqual(prev, next) ? "same-value-new-reference" : "object-value-changed";
  }
  if (isSpecialObject(prev) && isSpecialObject(next)) {
    return safeDeepEqual(prev, next) ? "same-value-new-reference" : "value-changed";
  }
  return "value-changed";
}
function isPlainObject(val) {
  if (val === null || typeof val !== "object") return false;
  const proto = Object.getPrototypeOf(val);
  return proto === Object.prototype || proto === null;
}
function isSpecialObject(val) {
  return val instanceof Date || val instanceof Map || val instanceof Set || val instanceof RegExp;
}
function safeDeepEqual(a, b, seen = /* @__PURE__ */ new WeakSet()) {
  if (Object.is(a, b)) return true;
  if (a === null || b === null) return false;
  if (typeof a !== typeof b) return false;
  if (a instanceof Date && b instanceof Date) return a.getTime() === b.getTime();
  if (a instanceof RegExp && b instanceof RegExp) return a.toString() === b.toString();
  if (a instanceof Map && b instanceof Map) {
    if (a.size !== b.size) return false;
    for (const [k, v] of a) {
      if (!b.has(k) || !safeDeepEqual(v, b.get(k), seen)) return false;
    }
    return true;
  }
  if (a instanceof Set && b instanceof Set) {
    if (a.size !== b.size) return false;
    try {
      const sa = JSON.stringify([...a].map(String).sort());
      const sb = JSON.stringify([...b].map(String).sort());
      return sa === sb;
    } catch (e) {
      return false;
    }
  }
  if (typeof a !== "object" || typeof b !== "object") return false;
  if (Array.isArray(a) !== Array.isArray(b)) return false;
  if (seen.has(a)) return false;
  seen.add(a);
  const keysA = [...Object.keys(a), ...Object.getOwnPropertySymbols(a)];
  const keysB = /* @__PURE__ */ new Set([
    ...Object.keys(b),
    ...Object.getOwnPropertySymbols(b)
  ]);
  if (keysA.length !== keysB.size) {
    seen.delete(a);
    return false;
  }
  for (const k of keysA) {
    if (!keysB.has(k)) {
      seen.delete(a);
      return false;
    }
    if (!safeDeepEqual(
      a[k],
      b[k],
      seen
    )) {
      seen.delete(a);
      return false;
    }
  }
  seen.delete(a);
  return true;
}
function shallowDiff(prev, next) {
  if (!isPlainObject(prev) && !Array.isArray(prev)) return [];
  if (!isPlainObject(next) && !Array.isArray(next)) return [];
  const p = prev;
  const n = next;
  const allKeys = /* @__PURE__ */ new Set([...Object.keys(p), ...Object.keys(n)]);
  const diffs = [];
  allKeys.forEach((key) => {
    if (!Object.is(p[key], n[key])) {
      diffs.push({ key, prev: p[key], next: n[key] });
    }
  });
  return diffs;
}

// src/logger.ts
var S = {
  prefix: "color:#888;font-weight:normal",
  amber: "color:#f59e0b;font-weight:bold",
  red: "color:#ef4444;font-weight:bold",
  blue: "color:#3b82f6;font-weight:bold",
  purple: "color:#a78bfa;font-weight:bold",
  muted: "color:#888",
  count: "color:#64748b",
  hint: "color:#ef4444",
  replay: "color:#f59e0b;font-style:italic",
  perf: "color:#06b6d4;font-weight:bold"
};
var _lastLogKey = /* @__PURE__ */ new Map();
var REPLAY_WINDOW_MS = 50;
function recordHash(record) {
  return `${record.component}|${record.renderCount}|${record.trigger}|${record.changes.map((c) => c.key + c.reason).join(",")}`;
}
function classifyLogAttempt(record) {
  const key = record.component;
  const hash = recordHash(record);
  const prev = _lastLogKey.get(key);
  const now = record.timestamp;
  if (prev && prev.hash === hash && now - prev.time < REPLAY_WINDOW_MS) {
    _lastLogKey.set(key, { hash, time: now });
    return "replay";
  }
  _lastLogKey.set(key, { hash, time: now });
  return "first";
}
function logRecord(record, filterOpts) {
  const logAttempt = classifyLogAttempt(record);
  if (logAttempt === "replay") {
    console.groupCollapsed(
      `%c[render-xray] %c${record.component} %cReact StrictMode replay (dev only)`,
      S.prefix,
      S.muted,
      S.replay
    );
    console.log("%cThis is a development-only double-invoke. Ignore for production analysis.", S.replay);
    console.groupEnd();
    return;
  }
  const { component, renderCount, trigger, changes, hasAvoidableChanges, duration } = record;
  const visibleChanges = applyFilters(changes, filterOpts);
  const headerColor = trigger === "parent" ? S.purple : hasAvoidableChanges ? S.red : S.blue;
  const groupFn = record.renderCount === 1 ? console.groupCollapsed : console.groupCollapsed;
  groupFn(
    `%c[render-xray] %c${component} %c${triggerLabel(trigger)}`,
    S.prefix,
    headerColor,
    S.muted
  );
  const devAnnotation = record._isStrictModeReplay ? " (StrictMode double-invoke)" : "";
  console.log(`%crender #${renderCount}${devAnnotation}`, S.count);
  if (duration !== void 0) {
    const durationColor = duration > 16 ? S.red : duration > 8 ? S.amber : S.perf;
    const durationIcon = duration > 16 ? "\u{1F534}" : duration > 8 ? "\u{1F7E1}" : "\u{1F7E2}";
    console.log(`%c${durationIcon} render duration: ${duration.toFixed(2)}ms`, durationColor);
  }
  if (trigger === "parent") {
    console.log("%c\u2192 No local changes detected \u2014 render source inferred as parent.", S.muted);
    console.log(
      "%c  Tip: this component may benefit from memoization (React.memo / equivalent).",
      S.hint
    );
  }
  visibleChanges.forEach(logChange);
  if (hasAvoidableChanges) {
    const avoidableCount = changes.filter((c) => c.avoidable).length;
    console.warn(
      `\u26A0  ${avoidableCount} avoidable prop/value recreation${avoidableCount !== 1 ? "s" : ""} detected during this render. See flagged changes above for useMemo / useCallback opportunities.`
    );
  }
  console.groupEnd();
}
function logChange(c) {
  const severityIcon = c.severity === "avoidable" ? "\u{1F7E1}" : c.severity === "expensive" ? "\u{1F534}" : "\u{1F7E2}";
  const label = `  ${severityIcon} [${c.source}] ${c.key}`;
  switch (c.reason) {
    case "same-value-new-reference": {
      console.groupCollapsed(`%c${label} %c\u2190 same value, new reference`, S.amber, S.red);
      console.log("%c  fix: wrap in useMemo()", S.hint);
      const diff = shallowDiff(c.prev, c.next);
      if (diff.length) {
        console.groupCollapsed("  changed keys:");
        diff.forEach((d) => console.log(`    .${d.key}`, "\u2192", d.next));
        console.groupEnd();
      } else {
        console.log("  prev:", c.prev);
        console.log("  next:", c.next);
      }
      console.groupEnd();
      break;
    }
    case "new-function-reference": {
      console.groupCollapsed(`%c${label} %c\u2190 new function on every render`, S.amber, S.red);
      console.log("%c  fix: wrap in useCallback()", S.hint);
      console.log("  prev:", c.prev.toString().slice(0, 120));
      console.log("  next:", c.next.toString().slice(0, 120));
      console.groupEnd();
      break;
    }
    case "object-value-changed": {
      console.groupCollapsed(`%c${label} %c\u2190 object value changed`, S.amber, S.muted);
      const diff = shallowDiff(c.prev, c.next);
      if (diff.length) {
        console.groupCollapsed("  changed keys:");
        diff.forEach((d) => console.log(`    .${d.key}`, "prev:", d.prev, "\u2192 next:", d.next));
        console.groupEnd();
      } else {
        console.log("  prev:", c.prev);
        console.log("  next:", c.next);
      }
      console.groupEnd();
      break;
    }
    case "added": {
      console.groupCollapsed(`%c${label} %c\u2190 added`, S.amber, S.muted);
      console.log("  value:", c.next);
      console.groupEnd();
      break;
    }
    case "removed": {
      console.groupCollapsed(`%c${label} %c\u2190 removed`, S.amber, S.muted);
      console.log("  was:", c.prev);
      console.groupEnd();
      break;
    }
    default: {
      console.groupCollapsed(`%c${label} %c\u2190 changed`, S.amber, S.muted);
      console.log("  prev:", c.prev);
      console.log("  next:", c.next);
      console.groupEnd();
    }
  }
}
function triggerLabel(trigger) {
  switch (trigger) {
    case "parent":
      return "re-rendered (render source inferred: parent)";
    case "state":
      return "re-rendered (state changed)";
    case "props":
      return "re-rendered (props changed)";
    case "mixed":
      return "re-rendered (props + state changed)";
  }
}
function applyFilters(changes, opts) {
  if (!opts) return changes;
  return changes.filter((c) => {
    if (opts.includeProps === false && c.source === "prop") return false;
    if (opts.includeState === false && c.source === "state") return false;
    if (opts.includeFunctions === false && c.reason === "new-function-reference") return false;
    return true;
  });
}

// src/useRenderXray.ts
var import_meta = {};
var IS_DEV = (() => {
  var _a, _b;
  try {
    const env = import_meta.env;
    if (env) return env.MODE !== "production";
  } catch (e) {
  }
  try {
    return (_b = globalThis.__DEV__) != null ? _b : typeof process !== "undefined" && ((_a = process.env) == null ? void 0 : _a.NODE_ENV) !== "production";
  } catch (e) {
  }
  return true;
})();
var DEFAULTS = {
  log: true,
  track: false,
  maxHistory: 50,
  onlyAvoidable: false
};
function useRenderXrayDev(componentName, props, state = {}, options = {}) {
  const opts = { ...DEFAULTS, ...options };
  const prevProps = useRef(null);
  const prevState = useRef(null);
  const renderCount = useRef(0);
  const renderStartRef = useRef(0);
  const history = useRef([]);
  const strictModeGuard = useRef({ ts: 0, count: 0 });
  renderStartRef.current = performance.now();
  useEffect(() => {
    var _a, _b;
    renderCount.current += 1;
    const renderEnd = performance.now();
    const duration = renderEnd - renderStartRef.current;
    const propChanges = diffValues("prop", prevProps.current, props);
    const stateChanges = diffValues("state", prevState.current, state);
    const allChanges = [...propChanges, ...stateChanges];
    const hasAvoidable = allChanges.some((c) => c.avoidable);
    const trigger = allChanges.length === 0 ? "parent" : propChanges.length > 0 && stateChanges.length > 0 ? "mixed" : propChanges.length > 0 ? "props" : "state";
    const now = Date.now();
    const sg = strictModeGuard.current;
    const isSMReplay = now - sg.ts < 50 && sg.count > 0;
    strictModeGuard.current = { ts: now, count: sg.count + 1 };
    const stableRenderCount = isSMReplay ? Math.ceil(renderCount.current / 2) : renderCount.current;
    if (hasAvoidable || duration > 16) {
      allChanges.forEach((c) => {
        if (duration > 16 && c.avoidable) c.severity = "expensive";
      });
    }
    const record = {
      component: componentName,
      renderCount: renderCount.current,
      stableRenderCount,
      trigger,
      changes: allChanges,
      hasAvoidableChanges: hasAvoidable,
      duration,
      timestamp: now,
      _isStrictModeReplay: isSMReplay
    };
    if (renderCount.current > 1) {
      const shouldLog = opts.log && (((_a = opts.filter) == null ? void 0 : _a.includeParentTriggers) !== false || trigger !== "parent" || isSMReplay ? true : trigger !== "parent") && (!opts.onlyAvoidable || hasAvoidable || trigger === "parent");
      if (shouldLog) logRecord(record, opts.filter);
      if (opts.track) {
        history.current = [
          ...history.current.slice(-(opts.maxHistory - 1)),
          record
        ];
      }
      (_b = opts.onRender) == null ? void 0 : _b.call(opts, record);
    }
    prevProps.current = props;
    prevState.current = state;
  });
  return {
    renderCount: renderCount.current,
    stableRenderCount: Math.ceil(renderCount.current / 2),
    history: history.current,
    clearHistory: () => {
      history.current = [];
    }
  };
}
var NOOP_RETURN = {
  renderCount: 0,
  stableRenderCount: 0,
  history: [],
  clearHistory: () => {
  }
};
var useRenderXray = IS_DEV ? useRenderXrayDev : () => NOOP_RETURN;

export { useRenderXray };
//# sourceMappingURL=index.js.map
//# sourceMappingURL=index.js.map