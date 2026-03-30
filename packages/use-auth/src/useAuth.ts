import { useState, useEffect, useRef, useCallback } from "react"
import {
  AuthStatus,
  LockoutReason,
  LockoutState,
  TokenPayload,
  UseAuthOptions,
  UseAuthReturn,
}  from "./types"
import { createStorage } from "./storage"
import { decodeJWT, getTokenExpiry, isExpired } from "./jwt"
const DEFAULT_MAX_ATTEMPTS = 5
const DEFAULT_LOCKOUT_DURATION = 30 // seconds
const DEFAULT_MIN_ATTEMPT_INTERVAL = 500 // ms
const DEFAULT_STORAGE_KEY = "hookraft_auth_token"
const REFRESH_BEFORE_EXPIRY_MS = 60 * 1000 // refresh 60s before token expires

export function useAuth<C = unknown, U = unknown>(
  options: UseAuthOptions<C, U>
): UseAuthReturn<C, U> {
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
    minAttemptInterval = DEFAULT_MIN_ATTEMPT_INTERVAL,
  } = options

  const store = useRef(createStorage(storageType))

  const [status, setStatus] = useState<AuthStatus>("idle")
  const [user, setUser] = useState<U | undefined>(undefined)
  const [token, setToken] = useState<string | null>(null)
  const [tokenPayload, setTokenPayload] = useState<TokenPayload | null>(null)
  const [tokenExpiresAt, setTokenExpiresAt] = useState<Date | null>(null)
  const [attempts, setAttempts] = useState(0)
  const [lockout, setLockout] = useState<LockoutState | null>(null)
  const [remainingTime, setRemainingTime] = useState(0)

  const lastAttemptTime = useRef<number>(0)
  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lockoutTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const expireTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // ─── Helpers ────────────────────────────────────────────────────────────────

  const clearTimers = useCallback(() => {
    if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current)
    if (expireTimerRef.current) clearTimeout(expireTimerRef.current)
    if (lockoutTimerRef.current) clearInterval(lockoutTimerRef.current)
  }, [])

  const applyToken = useCallback(
    (raw: string, userData?: U) => {
      store.current.set(storageKey, raw)
      setToken(raw)

      if (decodeToken) {
        const payload = decodeJWT(raw)
        setTokenPayload(payload)

        if (payload) {
          const expiresAt = getTokenExpiry(payload)
          setTokenExpiresAt(expiresAt)

          if (expiresAt) {
            const msUntilExpiry = expiresAt.getTime() - Date.now()
            const msUntilRefresh = msUntilExpiry - REFRESH_BEFORE_EXPIRY_MS

            // Schedule token refresh
            if (onRefresh && msUntilRefresh > 0) {
              refreshTimerRef.current = setTimeout(async () => {
                try {
                  const newToken = await onRefresh()
                  applyToken(newToken, userData)
                } catch {
                  handleExpiry()
                }
              }, msUntilRefresh)
            }

            // Schedule expiry fallback
            if (msUntilExpiry > 0) {
              expireTimerRef.current = setTimeout(() => {
                handleExpiry()
              }, msUntilExpiry)
            } else {
              handleExpiry()
              return
            }
          }
        }
      }

      if (userData !== undefined) setUser(userData)
      setStatus("authenticated")
      setAttempts(0)
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [decodeToken, storageKey, onRefresh]
  )

  const handleExpiry = useCallback(() => {
    clearTimers()
    store.current.remove(storageKey)
    setToken(null)
    setTokenPayload(null)
    setTokenExpiresAt(null)
    setUser(undefined)
    setStatus("idle")
    onTokenExpired?.()
  }, [clearTimers, storageKey, onTokenExpired])

  // ─── Lockout countdown ───────────────────────────────────────────────────────

  const startLockoutCountdown = useCallback(
    (until: Date, reason: LockoutReason) => {
      if (lockoutTimerRef.current) clearInterval(lockoutTimerRef.current)

      const tick = () => {
        const remaining = Math.ceil((until.getTime() - Date.now()) / 1000)
        if (remaining <= 0) {
          clearInterval(lockoutTimerRef.current!)
          setLockout(null)
          setRemainingTime(0)
          setAttempts(0)
          setStatus("idle")
        } else {
          setRemainingTime(remaining)
        }
      }

      tick()
      lockoutTimerRef.current = setInterval(tick, 1000)
    },
    []
  )

  const triggerLockout = useCallback(
    (reason: LockoutReason) => {
      const until = new Date(Date.now() + lockoutDuration * 1000)
      const state: LockoutState = { reason, lockedUntil: until }
      setLockout(state)
      setStatus("locked")
      startLockoutCountdown(until, reason)
    },
    [lockoutDuration, startLockoutCountdown]
  )

  // ─── Init — restore token from storage ──────────────────────────────────────

  useEffect(() => {
    const stored = store.current.get(storageKey)
    if (!stored) return

    if (decodeToken) {
      const payload = decodeJWT(stored)
      if (!payload || isExpired(payload)) {
        store.current.remove(storageKey)
        onTokenExpired?.()
        return
      }
    }

    applyToken(stored)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ─── Cleanup on unmount ──────────────────────────────────────────────────────

  useEffect(() => {
    return () => clearTimers()
  }, [clearTimers])

  // ─── Login ───────────────────────────────────────────────────────────────────

  const login = useCallback(
    async (credentials: C) => {
      // Bot detection — too fast
      const now = Date.now()
      if (now - lastAttemptTime.current < minAttemptInterval) {
        triggerLockout("bot_detection")
        return
      }
      lastAttemptTime.current = now

      // Already locked
      if (status === "locked") return

      setStatus("loading")

      try {
        const result = await onLogin(credentials)
        applyToken(result.token, result.user)
      } catch (error) {
        onError?.(error)

        setAttempts((prev) => {
          const next = prev + 1
          if (next >= maxAttempts) {
            triggerLockout("max_attempts")
          } else {
            setStatus("error")
          }
          return next
        })
      }
    },
    [status, minAttemptInterval, maxAttempts, onLogin, onError, applyToken, triggerLockout]
  )

  // ─── Logout ──────────────────────────────────────────────────────────────────

  const logout = useCallback(async () => {
    clearTimers()
    try {
      await onLogout?.()
    } catch {
      // logout should never block UI
    }
    store.current.remove(storageKey)
    setToken(null)
    setTokenPayload(null)
    setTokenExpiresAt(null)
    setUser(undefined)
    setAttempts(0)
    setLockout(null)
    setRemainingTime(0)
    setStatus("idle")
  }, [clearTimers, onLogout, storageKey])

  // ─── is() helper ─────────────────────────────────────────────────────────────

  const is = useCallback((s: AuthStatus) => status === s, [status])

  // ─── Return ───────────────────────────────────────────────────────────────────

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
    lockoutReason: lockout?.reason ?? null,
  }
}