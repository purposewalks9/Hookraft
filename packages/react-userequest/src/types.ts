export type RequestStatus = "idle" | "loading" | "success" | "error"

export interface CacheEntry<T> {
  data: T
  timestamp: number
  error?: unknown
}

export interface InFlightEntry<T> {
  promise: Promise<T>
  subscribers: number
}

export interface UseRequestOptions<T> {
  /**
   * Custom fetcher function. Receives the key and returns a promise.
   * Defaults to a basic fetch + json parse.
   */
  fetcher?: (key: string) => Promise<T>
  /**
   * How long in ms to keep data in cache before considering it stale.
   * Defaults to 30000 (30 seconds). Set to 0 to disable caching.
   */
  cacheTime?: number
  /**
   * If true, deduplicates in-flight requests across all components.
   * Defaults to true.
   */
  dedupe?: boolean
  /**
   * If true, the request will not fire automatically on mount.
   * Call refetch() manually to trigger it.
   */
  manual?: boolean
  /**
   * Fires when the request succeeds with the response data.
   */
  onSuccess?: (data: T) => void
  /**
   * Fires when the request fails with the error.
   */
  onError?: (error: unknown) => void
  /**
   * Fires whenever status changes.
   */
  onStatusChange?: (status: RequestStatus) => void
}

export interface UseRequestReturn<T> {
  /** The response data — undefined until request succeeds */
  data: T | undefined
  /** Current request status */
  status: RequestStatus
  /** Error if request failed */
  error: unknown
  /** True while request is in flight */
  isLoading: boolean
  /** True if request completed successfully */
  isSuccess: boolean
  /** True if request failed */
  isError: boolean
  /** Check current status */
  is: (status: RequestStatus) => boolean
  /** Manually trigger a fresh request — bypasses cache */
  refetch: () => Promise<void>
  /** Clear the cache for this key */
  clear: () => void
}