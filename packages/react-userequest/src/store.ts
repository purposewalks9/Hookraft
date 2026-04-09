import { useRequest } from "./useRequest"

const cache = new Map<string, useRequest.CacheEntry<unknown>>()

const inFlight = new Map<string, useRequest.InFlightEntry<unknown>>()

export function getCached<T>(key: string, cacheTime: number): T | null {
  const entry = cache.get(key) as useRequest.CacheEntry<T> | undefined
  if (!entry) return null
  if (cacheTime === 0) return null
  const isStale = Date.now() - entry.timestamp > cacheTime
  if (isStale) {
    cache.delete(key)
    return null
  }
  return entry.data
}

export function setCached<T>(key: string, data: T): void {
  cache.set(key, { data, timestamp: Date.now() })
}

export function clearCached(key: string): void {
  cache.delete(key)
}

export function getInFlight<T>(key: string): Promise<T> | null {
  const entry = inFlight.get(key) as useRequest.InFlightEntry<T> | undefined
  if (!entry) return null
  entry.subscribers++
  return entry.promise
}

export function setInFlight<T>(key: string, promise: Promise<T>): void {
  inFlight.set(key, { promise: promise as Promise<unknown>, subscribers: 1 })
}

export function clearInFlight(key: string): void {
  inFlight.delete(key)
}

export function clearAll(): void {
  cache.clear()
  inFlight.clear()
}