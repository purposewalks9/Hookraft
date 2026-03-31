type RequestStatus = "idle" | "loading" | "success" | "error";
interface CacheEntry<T> {
    data: T;
    timestamp: number;
    error?: unknown;
}
interface UseRequestOptions<T> {
    /**
     * Custom fetcher function. Receives the key and returns a promise.
     * Defaults to a basic fetch + json parse.
     */
    fetcher?: (key: string) => Promise<T>;
    /**
     * How long in ms to keep data in cache before considering it stale.
     * Defaults to 30000 (30 seconds). Set to 0 to disable caching.
     */
    cacheTime?: number;
    /**
     * If true, deduplicates in-flight requests across all components.
     * Defaults to true.
     */
    dedupe?: boolean;
    /**
     * If true, the request will not fire automatically on mount.
     * Call refetch() manually to trigger it.
     */
    manual?: boolean;
    /**
     * Fires when the request succeeds with the response data.
     */
    onSuccess?: (data: T) => void;
    /**
     * Fires when the request fails with the error.
     */
    onError?: (error: unknown) => void;
    /**
     * Fires whenever status changes.
     */
    onStatusChange?: (status: RequestStatus) => void;
}
interface UseRequestReturn<T> {
    /** The response data — undefined until request succeeds */
    data: T | undefined;
    /** Current request status */
    status: RequestStatus;
    /** Error if request failed */
    error: unknown;
    /** True while request is in flight */
    isLoading: boolean;
    /** True if request completed successfully */
    isSuccess: boolean;
    /** True if request failed */
    isError: boolean;
    /** Check current status */
    is: (status: RequestStatus) => boolean;
    /** Manually trigger a fresh request — bypasses cache */
    refetch: () => Promise<void>;
    /** Clear the cache for this key */
    clear: () => void;
}

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
declare function useRequest<T = unknown>(key: string | null, options?: UseRequestOptions<T>): UseRequestReturn<T>;

declare function clearAll(): void;

export { type CacheEntry, type RequestStatus, type UseRequestOptions, type UseRequestReturn, clearAll, useRequest };
