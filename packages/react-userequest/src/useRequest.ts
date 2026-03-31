import { useState, useEffect, useCallback, useRef } from "react"
import {
  getCached,
  setCached,
  clearCached,
  getInFlight,
  setInFlight,
  clearInFlight,
} from "./store"
import type {
  RequestStatus,
  UseRequestOptions,
  UseRequestReturn,
} from "./types"

const defaultFetcher = (key: string) =>
  fetch(key).then((res) => {
    if (!res.ok) throw new Error(`Request failed: ${res.status} ${res.statusText}`)
    return res.json()
  })

/**
 * useRequest
 *
 * A deduplication-first data fetching hook.
 * Multiple components requesting the same key at the same time
 * will share a single in-flight request — not fire multiple.
 *
 * All caching is in-memory only (JS RAM). Nothing is written
 * to localStorage, sessionStorage, or any browser storage.
 *
 * @example
 * // All three components share ONE network request
 * const { data } = useRequest("/api/user")
 * const { data } = useRequest("/api/user")
 * const { data } = useRequest("/api/user")
 */
export function useRequest<T = unknown>(
  key: string | null,
  options: UseRequestOptions<T> = {}
): UseRequestReturn<T> {
  const {
    fetcher = defaultFetcher as (key: string) => Promise<T>,
    cacheTime = 30_000,
    dedupe = true,
    manual = false,
    onSuccess,
    onError,
    onStatusChange,
  } = options

  const [data, setData] = useState<T | undefined>(() => {
    if (!key) return undefined
    return getCached<T>(key, cacheTime) ?? undefined
  })
  const [status, setStatus] = useState<RequestStatus>(() => {
    if (!key) return "idle"
    const cached = getCached<T>(key, cacheTime)
    return cached !== null ? "success" : "idle"
  })
  const [error, setError] = useState<unknown>(undefined)

  const mountedRef = useRef(true)
  const onSuccessRef = useRef(onSuccess)
  const onErrorRef = useRef(onError)
  const onStatusChangeRef = useRef(onStatusChange)

  // Keep callback refs fresh without causing re-runs
  useEffect(() => { onSuccessRef.current = onSuccess }, [onSuccess])
  useEffect(() => { onErrorRef.current = onError }, [onError])
  useEffect(() => { onStatusChangeRef.current = onStatusChange }, [onStatusChange])

  useEffect(() => {
    mountedRef.current = true
    return () => { mountedRef.current = false }
  }, [])

  const updateStatus = useCallback((next: RequestStatus) => {
    if (!mountedRef.current) return
    setStatus(next)
    onStatusChangeRef.current?.(next)
  }, [])

  const execute = useCallback(
    async (forceRefresh = false): Promise<void> => {
      if (!key) return

      // Check cache first (unless force refreshing)
      if (!forceRefresh) {
        const cached = getCached<T>(key, cacheTime)
        if (cached !== null) {
          if (mountedRef.current) {
            setData(cached)
            updateStatus("success")
          }
          return
        }
      } else {
        clearCached(key)
      }

      // Check for an in-flight request for this key
      if (dedupe) {
        const existing = getInFlight<T>(key)
        if (existing) {
          updateStatus("loading")
          try {
            const result = await existing
            if (!mountedRef.current) return
            setData(result)
            updateStatus("success")
            onSuccessRef.current?.(result)
          } catch (err) {
            if (!mountedRef.current) return
            setError(err)
            updateStatus("error")
            onErrorRef.current?.(err)
          }
          return
        }
      }

      // No cache, no in-flight — fire a new request
      updateStatus("loading")

      const promise = fetcher(key)

      if (dedupe) {
        setInFlight(key, promise)
      }

      try {
        const result = await promise
        setCached(key, result)
        clearInFlight(key)

        if (!mountedRef.current) return
        setData(result)
        setError(undefined)
        updateStatus("success")
        onSuccessRef.current?.(result)
      } catch (err) {
        clearInFlight(key)

        if (!mountedRef.current) return
        setError(err)
        updateStatus("error")
        onErrorRef.current?.(err)
      }
    },
    [key, cacheTime, dedupe, fetcher, updateStatus]
  )

  // Auto-fetch on mount unless manual mode
  useEffect(() => {
    if (!key || manual) return
    execute()
  }, [key, manual, execute])

  const refetch = useCallback(async () => {
    await execute(true)
  }, [execute])

  const clear = useCallback(() => {
    if (!key) return
    clearCached(key)
    setData(undefined)
    setError(undefined)
    updateStatus("idle")
  }, [key, updateStatus])

  const is = useCallback(
    (s: RequestStatus) => status === s,
    [status]
  )

  return {
    data,
    status,
    error,
    isLoading: status === "loading",
    isSuccess: status === "success",
    isError: status === "error",
    is,
    refetch,
    clear,
  }
}