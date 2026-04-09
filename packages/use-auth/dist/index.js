// src/useAuth.ts
import { useState, useEffect, useRef, useCallback } from "react";

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
  const store = useRef(createStorage(storageType));
  const [status, setStatus] = useState("idle");
  const [user, setUser] = useState(void 0);
  const [token, setToken] = useState(null);
  const [tokenPayload, setTokenPayload] = useState(null);
  const [tokenExpiresAt, setTokenExpiresAt] = useState(null);
  const [attempts, setAttempts] = useState(0);
  const [lockout, setLockout] = useState(null);
  const [remainingTime, setRemainingTime] = useState(0);
  const lastAttemptTime = useRef(0);
  const refreshTimerRef = useRef(null);
  const lockoutTimerRef = useRef(null);
  const expireTimerRef = useRef(null);
  const clearTimers = useCallback(() => {
    if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
    if (expireTimerRef.current) clearTimeout(expireTimerRef.current);
    if (lockoutTimerRef.current) clearInterval(lockoutTimerRef.current);
  }, []);
  const applyToken = useCallback(
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
  const handleExpiry = useCallback(() => {
    clearTimers();
    store.current.remove(storageKey);
    setToken(null);
    setTokenPayload(null);
    setTokenExpiresAt(null);
    setUser(void 0);
    setStatus("idle");
    onTokenExpired?.();
  }, [clearTimers, storageKey, onTokenExpired]);
  const startLockoutCountdown = useCallback(
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
  const triggerLockout = useCallback(
    (reason) => {
      const until = new Date(Date.now() + lockoutDuration * 1e3);
      const state = { reason, lockedUntil: until };
      setLockout(state);
      setStatus("locked");
      startLockoutCountdown(until, reason);
    },
    [lockoutDuration, startLockoutCountdown]
  );
  useEffect(() => {
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
  useEffect(() => {
    return () => clearTimers();
  }, [clearTimers]);
  const login = useCallback(
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
  const logout = useCallback(async () => {
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
  const is = useCallback((s) => status === s, [status]);
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
import { useEffect as useEffect2 } from "react";
import { Fragment, jsx } from "react/jsx-runtime";
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
  useEffect2(() => {
    if (when === "authenticated") onAuthenticated?.();
    if (when === "loading") onLoading?.();
    if (when === "locked") onLocked?.();
    if (when === "error") onError?.();
    if (when === "idle") onIdle?.();
  }, [when, onAuthenticated, onLoading, onLocked, onError, onIdle]);
  if (when === "idle") return /* @__PURE__ */ jsx(Fragment, { children: fallback });
  return /* @__PURE__ */ jsx(Fragment, { children });
}
function Authenticated({ when, children }) {
  if (when !== "authenticated") return null;
  return /* @__PURE__ */ jsx(Fragment, { children });
}
function Loading({ when, children }) {
  if (when !== "loading") return null;
  return /* @__PURE__ */ jsx(Fragment, { children });
}
function Locked({ when, children }) {
  if (when !== "locked") return null;
  return /* @__PURE__ */ jsx(Fragment, { children });
}
function Error({ when, children }) {
  if (when !== "error") return null;
  return /* @__PURE__ */ jsx(Fragment, { children });
}
var Auth = Object.assign(AuthRoot, {
  Authenticated,
  Loading,
  Locked,
  Error
});
export {
  Auth,
  useAuth
};
//# sourceMappingURL=index.js.map