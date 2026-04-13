declare namespace useCacheQuery {
    type Status = "idle" | "loading" | "success" | "stale" | "revalidating" | "expired" | "error";
    type Source = "memory" | "cache" | "network" | null;
    type Expiry = `${number}m` | `${number}h` | `${number}d`;
    interface Options<T> {
        /** Name of the Cache API bucket. Defaults to "hookraft-cache-v1" */
        cacheName?: string;
        /** TTL string — e.g. "30m", "1h", "7d". No expiry if omitted */
        expires?: Expiry | null;
        /** Re-fetch in background even if valid cache exists (stale-while-revalidate) */
        revalidate?: boolean;
        /** Fires when data is served from memory or Cache API */
        onCacheHit?: (data: T) => void;
        /** Fires when fresh data is fetched from the network */
        onFetchSuccess?: (data: T) => void;
        /** Fires when a cached entry is found but has expired */
        onExpired?: () => void;
        /** Fires when the fetch throws */
        onError?: (error: unknown) => void;
    }
    interface Return<T> {
        data: T | null;
        status: Status;
        source: Source;
        /** Force a fresh network fetch and update cache */
        refresh: () => Promise<void>;
        /** Delete this key from memory and Cache API, reset to idle */
        invalidate: () => Promise<void>;
        /** Write new data directly to cache without re-fetching */
        update: (data: T) => Promise<void>;
    }
}
declare function useCacheQuery<T = unknown>(key: string, fetcher: () => Promise<T>, options?: useCacheQuery.Options<T>): useCacheQuery.Return<T>;

export { useCacheQuery };
