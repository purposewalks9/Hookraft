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
  Auth: () => Auth,
  useAuth: () => useAuth
});
module.exports = __toCommonJS(index_exports);

// src/useAuth.ts
var import_react = require("react");

// src/storage.ts
var memoryStore = {};
function createStorage(type) {
  function get(key) {
    if (type === "memory") return memoryStore[key] ?? null;
    try {
      return window[type].getItem(key);
    } catch {
      return null;
    }
  }
  function set(key, value) {
    if (type === "memory") {
      memoryStore[key] = value;
      return;
    }
    try {
      window[type].setItem(key, value);
    } catch {
    }
  }
  function remove(key) {
    if (type === "memory") {
      delete memoryStore[key];
      return;
    }
    try {
      window[type].removeItem(key);
    } catch {
    }
  }
  return { get, set, remove };
}

// src/jwt.ts
function decodeJWT(token) {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const payload = parts[1];
    const padded = payload + "=".repeat((4 - payload.length % 4) % 4);
    const decoded = atob(padded.replace(/-/g, "+").replace(/_/g, "/"));
    return JSON.parse(decoded);
  } catch {
    return null;
  }
}
function getTokenExpiry(payload) {
  if (!payload.exp) return null;
  return new Date(payload.exp * 1e3);
}
function isExpired(payload) {
  const expiry = getTokenExpiry(payload);
  if (!expiry) return false;
  return expiry.getTime() < Date.now();
}

// src/useAuth.ts
var DEFAULT_MAX_ATTEMPTS = 5;
var DEFAULT_LOCKOUT_DURATION = 30;
var DEFAULT_MIN_ATTEMPT_INTERVAL = 500;
var DEFAULT_STORAGE_KEY = "hookraft_auth_token";
var REFRESH_BEFORE_EXPIRY_MS = 60 * 1e3;
function useAuth(options) {
  const {
    onLogin,
    onLogout,
    onRefresh,
    onError,
    onTokenExpired,
    decodeToken = true,
    storage: storageType = "localStorage",
    storageKey = DEFAULT_STORAGE_KEY,
    maxAttempts = DEFAULT_MAX_ATTEMPTS,
    lockoutDuration = DEFAULT_LOCKOUT_DURATION,
    minAttemptInterval = DEFAULT_MIN_ATTEMPT_INTERVAL
  } = options;
  const store = (0, import_react.useRef)(createStorage(storageType));
  const [status, setStatus] = (0, import_react.useState)("idle");
  const [user, setUser] = (0, import_react.useState)(void 0);
  const [token, setToken] = (0, import_react.useState)(null);
  const [tokenPayload, setTokenPayload] = (0, import_react.useState)(null);
  const [tokenExpiresAt, setTokenExpiresAt] = (0, import_react.useState)(null);
  const [attempts, setAttempts] = (0, import_react.useState)(0);
  const [lockout, setLockout] = (0, import_react.useState)(null);
  const [remainingTime, setRemainingTime] = (0, import_react.useState)(0);
  const lastAttemptTime = (0, import_react.useRef)(0);
  const refreshTimerRef = (0, import_react.useRef)(null);
  const lockoutTimerRef = (0, import_react.useRef)(null);
  const expireTimerRef = (0, import_react.useRef)(null);
  const clearTimers = (0, import_react.useCallback)(() => {
    if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
    if (expireTimerRef.current) clearTimeout(expireTimerRef.current);
    if (lockoutTimerRef.current) clearInterval(lockoutTimerRef.current);
  }, []);
  const applyToken = (0, import_react.useCallback)(
    (raw, userData) => {
      store.current.set(storageKey, raw);
      setToken(raw);
      if (decodeToken) {
        const payload = decodeJWT(raw);
        setTokenPayload(payload);
        if (payload) {
          const expiresAt = getTokenExpiry(payload);
          setTokenExpiresAt(expiresAt);
          if (expiresAt) {
            const msUntilExpiry = expiresAt.getTime() - Date.now();
            const msUntilRefresh = msUntilExpiry - REFRESH_BEFORE_EXPIRY_MS;
            if (onRefresh && msUntilRefresh > 0) {
              refreshTimerRef.current = setTimeout(async () => {
                try {
                  const newToken = await onRefresh();
                  applyToken(newToken, userData);
                } catch {
                  handleExpiry();
                }
              }, msUntilRefresh);
            }
            if (msUntilExpiry > 0) {
              expireTimerRef.current = setTimeout(() => {
                handleExpiry();
              }, msUntilExpiry);
            } else {
              handleExpiry();
              return;
            }
          }
        }
      }
      if (userData !== void 0) setUser(userData);
      setStatus("authenticated");
      setAttempts(0);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [decodeToken, storageKey, onRefresh]
  );
  const handleExpiry = (0, import_react.useCallback)(() => {
    clearTimers();
    store.current.remove(storageKey);
    setToken(null);
    setTokenPayload(null);
    setTokenExpiresAt(null);
    setUser(void 0);
    setStatus("idle");
    onTokenExpired?.();
  }, [clearTimers, storageKey, onTokenExpired]);
  const startLockoutCountdown = (0, import_react.useCallback)(
    (until, reason) => {
      if (lockoutTimerRef.current) clearInterval(lockoutTimerRef.current);
      const tick = () => {
        const remaining = Math.ceil((until.getTime() - Date.now()) / 1e3);
        if (remaining <= 0) {
          clearInterval(lockoutTimerRef.current);
          setLockout(null);
          setRemainingTime(0);
          setAttempts(0);
          setStatus("idle");
        } else {
          setRemainingTime(remaining);
        }
      };
      tick();
      lockoutTimerRef.current = setInterval(tick, 1e3);
    },
    []
  );
  const triggerLockout = (0, import_react.useCallback)(
    (reason) => {
      const until = new Date(Date.now() + lockoutDuration * 1e3);
      const state = { reason, lockedUntil: until };
      setLockout(state);
      setStatus("locked");
      startLockoutCountdown(until, reason);
    },
    [lockoutDuration, startLockoutCountdown]
  );
  (0, import_react.useEffect)(() => {
    const stored = store.current.get(storageKey);
    if (!stored) return;
    if (decodeToken) {
      const payload = decodeJWT(stored);
      if (!payload || isExpired(payload)) {
        store.current.remove(storageKey);
        onTokenExpired?.();
        return;
      }
    }
    applyToken(stored);
  }, []);
  (0, import_react.useEffect)(() => {
    return () => clearTimers();
  }, [clearTimers]);
  const login = (0, import_react.useCallback)(
    async (credentials) => {
      const now = Date.now();
      if (now - lastAttemptTime.current < minAttemptInterval) {
        triggerLockout("bot_detection");
        return;
      }
      lastAttemptTime.current = now;
      if (status === "locked") return;
      setStatus("loading");
      try {
        const result = await onLogin(credentials);
        applyToken(result.token, result.user);
      } catch (error) {
        onError?.(error);
        setAttempts((prev) => {
          const next = prev + 1;
          if (next >= maxAttempts) {
            triggerLockout("max_attempts");
          } else {
            setStatus("error");
          }
          return next;
        });
      }
    },
    [status, minAttemptInterval, maxAttempts, onLogin, onError, applyToken, triggerLockout]
  );
  const logout = (0, import_react.useCallback)(async () => {
    clearTimers();
    try {
      await onLogout?.();
    } catch {
    }
    store.current.remove(storageKey);
    setToken(null);
    setTokenPayload(null);
    setTokenExpiresAt(null);
    setUser(void 0);
    setAttempts(0);
    setLockout(null);
    setRemainingTime(0);
    setStatus("idle");
  }, [clearTimers, onLogout, storageKey]);
  const is = (0, import_react.useCallback)((s) => status === s, [status]);
  return {
    status,
    is,
    user,
    token,
    login,
    logout,
    tokenPayload,
    tokenExpiresAt,
    attempts,
    lockout,
    remainingTime,
    lockoutReason: lockout?.reason ?? null
  };
}

// src/Auth.tsx
var import_react2 = require("react");
var import_jsx_runtime = require("react/jsx-runtime");
function AuthRoot({
  when,
  children,
  fallback = null,
  onAuthenticated,
  onLoading,
  onLocked,
  onError,
  onIdle
}) {
  (0, import_react2.useEffect)(() => {
    if (when === "authenticated") onAuthenticated?.();
    if (when === "loading") onLoading?.();
    if (when === "locked") onLocked?.();
    if (when === "error") onError?.();
    if (when === "idle") onIdle?.();
  }, [when, onAuthenticated, onLoading, onLocked, onError, onIdle]);
  if (when === "idle") return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_jsx_runtime.Fragment, { children: fallback });
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_jsx_runtime.Fragment, { children });
}
function Authenticated({ when, children }) {
  if (when !== "authenticated") return null;
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_jsx_runtime.Fragment, { children });
}
function Loading({ when, children }) {
  if (when !== "loading") return null;
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_jsx_runtime.Fragment, { children });
}
function Locked({ when, children }) {
  if (when !== "locked") return null;
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_jsx_runtime.Fragment, { children });
}
function Error2({ when, children }) {
  if (when !== "error") return null;
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_jsx_runtime.Fragment, { children });
}
var Auth = Object.assign(AuthRoot, {
  Authenticated,
  Loading,
  Locked,
  Error: Error2
});
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  Auth,
  useAuth
});
//# sourceMappingURL=index.cjs.map