import * as react_jsx_runtime from 'react/jsx-runtime';

type QueueStatus = "idle" | "running" | "paused" | "done";
interface QueueItem<T> {
    id: string;
    data: T;
    status: "pending" | "processing" | "completed" | "failed";
    error?: unknown;
}
interface UseQueueOptions<T> {
    onProcess: (item: T) => Promise<void>;
    onSuccess?: (item: T) => void;
    onError?: (item: T, error: unknown) => void;
    onDone?: () => void;
    concurrency?: number;
}
declare function useQueue<T>(options: UseQueueOptions<T>): {
    status: QueueStatus;
    is: (s: QueueStatus) => boolean;
    add: (data: T) => string;
    start: () => void;
    pause: () => void;
    clear: () => void;
    reset: () => void;
    items: QueueItem<T>[];
    pending: QueueItem<T>[];
    processing: QueueItem<T>[];
    completed: QueueItem<T>[];
    failed: QueueItem<T>[];
};

interface QueueProps {
    /** Current queue status */
    when: QueueStatus;
    /** Fires when queue starts running */
    onRunning?: () => void;
    /** Fires when queue is paused */
    onPaused?: () => void;
    /** Fires when queue is done */
    onDone?: () => void;
    /** Fires when queue goes idle */
    onIdle?: () => void;
    /** What to render when queue is idle */
    fallback?: React.ReactNode;
    /** Your component */
    children: React.ReactNode;
}
declare function Queue({ when, onRunning, onPaused, onDone, onIdle, fallback, children, }: QueueProps): react_jsx_runtime.JSX.Element;

export { Queue, type QueueItem, type QueueProps, type QueueStatus, type UseQueueOptions, useQueue };
