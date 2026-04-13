import { useState, useEffect, useRef, useCallback } from "react"

// ─── Global shared state (outside hook — survives re-renders) ─────────────────

const memoryCache = new Map<string, { data: unknown; timestamp: number }>()
const pendingRequests = new Map<string, Promise<unknown>>()

// ─── Namespace ────────────────────────────────────────────────────────────────

export declare namespace useCacheQuery {
  type Status =
    | "idle"
    | "loading"
    | "success"
    | "stale"
    | "revalidating"
    | "expired"
    | "error"

  type Source = "memory" | "cache" | "network" | null

  type Expiry = `${number}m` | `${number}h` | `${number}d`

  interface Options<T> {
    /** Name of the Cache API bucket. Defaults to "hookraft-cache-v1" */
    cacheName?: string
    /** TTL string — e.g. "30m", "1h", "7d". No expiry if omitted */
    expires?: Expiry | null
    /** Re-fetch in background even if valid cache exists (stale-while-revalidate) */
    revalidate?: boolean
    /** Fires when data is served from memory or Cache API */
    onCacheHit?: (data: T) => void
    /** Fires when fresh data is fetched from the network */
    onFetchSuccess?: (data: T) => void
    /** Fires when a cached entry is found but has expired */
    onExpired?: () => void
    /** Fires when the fetch throws */
    onError?: (error: unknown) => void
  }

  interface Return<T> {
    data: T | null
    status: Status
    source: Source
    /** Force a fresh network fetch and update cache */
    refresh: () => Promise<void>
    /** Delete this key from memory and Cache API, reset to idle */
    invalidate: () => Promise<void>
    /** Write new data directly to cache without re-fetching */
    update: (data: T) => Promise<void>
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function isCacheApiAvailable(): boolean {
  return (
    typeof window !== "undefined" &&
    "caches" in window &&
    window.isSecureContext
  )
}

function parseExpiry(exp: string): number | null {
  const units: Record<string, number> = { m: 60, h: 3600, d: 86400 }
  const match = exp.match(/^(\d+)([mhd])$/)
  if (!match) return null
  return parseInt(match[1]) * units[match[2]] * 1000
}

function isExpired(timestamp: number, expires: string): boolean {
  const ttl = parseExpiry(expires)
  if (ttl === null) return false
  return Date.now() - timestamp > ttl
}

function cacheKey(key: string): string {
  return `/hookraft-cache/${key}`
}

async function readFromCacheApi<T>(
  key: string,
  cacheName: string
): Promise<{ data: T; timestamp: number } | null> {
  try {
    const cache = await caches.open(cacheName)
    const cached = await cache.match(cacheKey(key))
    if (!cached) return null
    return await cached.json()
  } catch {
    return null
  }
}

async function writeToCacheApi<T>(
  key: string,
  cacheName: string,
  data: T,
  timestamp: number
): Promise<void> {
  try {
    const cache = await caches.open(cacheName)
    const entry = { data, timestamp }
    const response = new Response(JSON.stringify(entry), {
      headers: { "Content-Type": "application/json" },
    })
    await cache.put(cacheKey(key), response)
  } catch {
    // Cache API unavailable or quota exceeded — memory cache still works
  }
}

async function deleteFromCacheApi(
  key: string,
  cacheName: string
): Promise<void> {
  try {
    const cache = await caches.open(cacheName)
    await cache.delete(cacheKey(key))
  } catch {
    // ignore
  }
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useCacheQuery<T = unknown>(
  key: string,
  fetcher: () => Promise<T>,
  options: useCacheQuery.Options<T> = {}
): useCacheQuery.Return<T> {
  const {
    cacheName = "hookraft-cache-v1",
    expires = null,
    revalidate = false,
    onCacheHit,
    onFetchSuccess,
    onExpired,
    onError,
  } = options

  const [data, setData] = useState<T | null>(null)
  const [status, setStatus] = useState<useCacheQuery.Status>("idle")
  const [source, setSource] = useState<useCacheQuery.Source>(null)

  const mountedRef = useRef(true)
  const fetcherRef = useRef(fetcher)
  const onCacheHitRef = useRef(onCacheHit)
  const onFetchSuccessRef = useRef(onFetchSuccess)
  const onExpiredRef = useRef(onExpired)
  const onErrorRef = useRef(onError)

  useEffect(() => { fetcherRef.current = fetcher }, [fetcher])
  useEffect(() => { onCacheHitRef.current = onCacheHit }, [onCacheHit])
  useEffect(() => { onFetchSuccessRef.current = onFetchSuccess }, [onFetchSuccess])
  useEffect(() => { onExpiredRef.current = onExpired }, [onExpired])
  useEffect(() => { onErrorRef.current = onError }, [onError])

  useEffect(() => {
    mountedRef.current = true
    return () => { mountedRef.current = false }
  }, [])

  // ─── Network fetch with deduplication ──────────────────────────────────────

  const fetchFromNetwork = useCallback(async (): Promise<T> => {
    // If a request for this key is already in flight, share it
    if (pendingRequests.has(key)) {
      return pendingRequests.get(key) as Promise<T>
    }

    const promise = fetcherRef.current()
    pendingRequests.set(key, promise)

    try {
      const result = await promise
      return result
    } finally {
      pendingRequests.delete(key)
    }
  }, [key])

  // ─── Save to both layers ────────────────────────────────────────────────────

  const saveToAllLayers = useCallback(
    async (payload: T) => {
      const timestamp = Date.now()
      memoryCache.set(key, { data: payload, timestamp })
      await writeToCacheApi(key, cacheName, payload, timestamp)
    },
    [key, cacheName]
  )

  // ─── Refresh — force network fetch ─────────────────────────────────────────

  const refresh = useCallback(async () => {
    if (!mountedRef.current) return
    setStatus("revalidating")

    try {
      const fresh = await fetchFromNetwork()
      await saveToAllLayers(fresh)

      if (!mountedRef.current) return
      setData(fresh)
      setSource("network")
      setStatus("success")
      onFetchSuccessRef.current?.(fresh)
    } catch (err) {
      if (!mountedRef.current) return
      setStatus("error")
      onErrorRef.current?.(err)
    }
  }, [fetchFromNetwork, saveToAllLayers])

  // ─── Invalidate ─────────────────────────────────────────────────────────────

  const invalidate = useCallback(async () => {
    memoryCache.delete(key)
    await deleteFromCacheApi(key, cacheName)

    if (!mountedRef.current) return
    setData(null)
    setStatus("idle")
    setSource(null)
  }, [key, cacheName])

  // ─── Update — write directly without fetching ───────────────────────────────

  const update = useCallback(
    async (newData: T) => {
      await saveToAllLayers(newData)
      if (!mountedRef.current) return
      setData(newData)
    },
    [saveToAllLayers]
  )

  // ─── Main effect — run on mount and key change ──────────────────────────────

  useEffect(() => {
    let cancelled = false

    const run = async () => {
      setStatus("loading")

      // 1. Check memory cache first (fastest)
      const memory = memoryCache.get(key)
      if (memory) {
        if (expires && isExpired(memory.timestamp, expires)) {
          memoryCache.delete(key)
          // fall through to Cache API / network below
        } else {
          if (!cancelled) {
            setData(memory.data as T)
            setSource("memory")
            setStatus(revalidate ? "stale" : "success")
            onCacheHitRef.current?.(memory.data as T)
          }
          if (revalidate && !cancelled) await refresh()
          return
        }
      }

      // 2. Check Cache API (persisted across sessions)
      if (isCacheApiAvailable()) {
        const cached = await readFromCacheApi<T>(key, cacheName)
        if (cached) {
          if (expires && isExpired(cached.timestamp, expires)) {
            await deleteFromCacheApi(key, cacheName)
            if (!cancelled) {
              setStatus("expired")
              onExpiredRef.current?.()
            }
            // fall through to network
          } else {
            // Warm memory cache from Cache API
            memoryCache.set(key, { data: cached.data, timestamp: cached.timestamp })

            if (!cancelled) {
              setData(cached.data)
              setSource("cache")
              setStatus(revalidate ? "stale" : "success")
              onCacheHitRef.current?.(cached.data)
            }
            if (revalidate && !cancelled) await refresh()
            return
          }
        }
      }

      // 3. Network fetch
      if (!cancelled) {
        setStatus("loading")
        try {
          const fresh = await fetchFromNetwork()
          await saveToAllLayers(fresh)

          if (!cancelled) {
            setData(fresh)
            setSource("network")
            setStatus("success")
            onFetchSuccessRef.current?.(fresh)
          }
        } catch (err) {
          if (!cancelled) {
            setStatus("error")
            onErrorRef.current?.(err)
          }
        }
      }
    }

    run()

    return () => { cancelled = true }
  }, [key, cacheName, expires, revalidate, fetchFromNetwork, saveToAllLayers, refresh])

  return { data, status, source, refresh, invalidate, update }
}