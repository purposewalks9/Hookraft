import * as react_jsx_runtime from 'react/jsx-runtime';

declare namespace useQueue {
    type Status = "idle" | "running" | "paused" | "done";
    type Item<T> = {
        id: string;
        data: T;
        status: "pending" | "processing" | "completed" | "failed";
        error?: unknown;
    };
    type Options<T> = {
        onProcess: (item: T) => Promise<void>;
        onSuccess?: (item: T) => void;
        onError?: (item: T, error: unknown) => void;
        onDone?: () => void;
        concurrency?: number;
    };
    type Return<T> = {
        status: Status;
        is: (status: Status) => boolean;
        add: (data: T) => string;
        start: () => void;
        pause: () => void;
        clear: () => void;
        reset: () => void;
        items: Item<T>[];
        pending: Item<T>[];
        processing: Item<T>[];
        completed: Item<T>[];
        failed: Item<T>[];
    };
}
declare function useQueue<T>(options: useQueue.Options<T>): useQueue.Return<T>;

declare namespace Queue {
    type Props = {
        when: useQueue.Status;
        onRunning?: () => void;
        onPaused?: () => void;
        onDone?: () => void;
        onIdle?: () => void;
        fallback?: React.ReactNode;
        children: React.ReactNode;
    };
}
declare function Queue({ when, onRunning, onPaused, onDone, onIdle, fallback, children, }: Queue.Props): react_jsx_runtime.JSX.Element;

export { Queue, useQueue };
