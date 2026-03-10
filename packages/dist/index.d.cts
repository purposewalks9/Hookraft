import * as react_jsx_runtime from 'react/jsx-runtime';

type DoorwayStatus = "idle" | "enter" | "loading" | "success" | "error";
interface UseDoorwayOptions {
    /** Fires when the component enters / becomes visible */
    onEnter?: () => void | Promise<void>;
    /** Fires when the component exits / becomes hidden */
    onExit?: () => void | Promise<void>;
    /** Fires when you call door.load() */
    onLoading?: () => void | Promise<void>;
    /** Fires when you call door.succeed() */
    onSuccess?: () => void | Promise<void>;
    /** Fires when you call door.fail() */
    onError?: () => void | Promise<void>;
}
interface UseDoorwayReturn {
    /** Current status of the doorway */
    status: DoorwayStatus;
    /** Check if status matches a given state */
    is: (status: DoorwayStatus) => boolean;
    /** Transition to enter state */
    enter: () => void;
    /** Transition to idle/exit state */
    exit: () => void;
    /** Transition to loading state */
    load: () => void;
    /** Transition to success state */
    succeed: () => void;
    /** Transition to error state */
    fail: () => void;
    /** Reset back to idle without firing onExit */
    reset: () => void;
}
declare function useDoorway(options?: UseDoorwayOptions): UseDoorwayReturn;

interface DoorwayProps {
    /** Controls visibility and triggers lifecycle events */
    when: boolean | DoorwayStatus;
    /** Fires when component becomes visible */
    onEnter?: () => void | Promise<void>;
    /** Fires when component becomes hidden */
    onExit?: () => void | Promise<void>;
    /** Fires when when === 'loading' */
    onLoading?: () => void | Promise<void>;
    /** Fires when when === 'success' */
    onSuccess?: () => void | Promise<void>;
    /** Fires when when === 'error' */
    onError?: () => void | Promise<void>;
    /** What to render when not visible */
    fallback?: React.ReactNode;
    /** Your component */
    children: React.ReactNode;
}
declare function Doorway({ when, onEnter, onExit, onLoading, onSuccess, onError, fallback, children, }: DoorwayProps): react_jsx_runtime.JSX.Element;

export { Doorway, type DoorwayProps, type DoorwayStatus, type UseDoorwayOptions, type UseDoorwayReturn, useDoorway };
