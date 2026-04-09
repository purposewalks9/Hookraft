declare namespace useRequest {
    type Status = "idle" | "loading" | "success" | "error";
    type CacheEntry<T> = {
        data: T;
        timestamp: number;
        error?: unknown;
    };
    type InFlightEntry<T> = {
        promise: Promise<T>;
        subscribers: number;
    };
    type Options<T> = {
        fetcher?: (key: string) => Promise<T>;
        cacheTime?: number;
        dedupe?: boolean;
        manual?: boolean;
        onSuccess?: (data: T) => void;
        onError?: (error: unknown) => void;
        onStatusChange?: (status: Status) => void;
    };
    type Return<T> = {
        data: T | undefined;
        status: Status;
        error: unknown;
        isLoading: boolean;
        isSuccess: boolean;
        isError: boolean;
        is: (status: Status) => boolean;
        refetch: () => Promise<void>;
        clear: () => void;
    };
}
declare function useRequest<T = unknown>(key: string | null, options?: useRequest.Options<T>): useRequest.Return<T>;

declare function clearAll(): void;

export { clearAll, useRequest };
