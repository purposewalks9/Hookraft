import * as react_jsx_runtime from 'react/jsx-runtime';

type DoorwayStatus = "idle" | "enter" | "loading" | "success" | "error";
interface UseDoorwayOptions {
    onEnter?: () => void | Promise<void>;
    onExit?: () => void | Promise<void>;
    onLoading?: () => void | Promise<void>;
    onSuccess?: () => void | Promise<void>;
    onError?: () => void | Promise<void>;
}
interface UseDoorwayReturn {
    status: DoorwayStatus;
    is: (status: DoorwayStatus) => boolean;
    enter: () => void;
    exit: () => void;
    load: () => void;
    succeed: () => void;
    fail: () => void;
    reset: () => void;
}
declare function useDoorway(options?: UseDoorwayOptions): UseDoorwayReturn;

interface DoorwayProps {
    when: boolean | DoorwayStatus;
    onEnter?: () => void | Promise<void>;
    onExit?: () => void | Promise<void>;
    onLoading?: () => void | Promise<void>;
    onSuccess?: () => void | Promise<void>;
    onError?: () => void | Promise<void>;
    fallback?: React.ReactNode;
    children: React.ReactNode;
}
declare function Doorway({ when, onEnter, onExit, onLoading, onSuccess, onError, fallback, children, }: DoorwayProps): react_jsx_runtime.JSX.Element;

export { Doorway, type DoorwayProps, type DoorwayStatus, type UseDoorwayOptions, type UseDoorwayReturn, useDoorway };
