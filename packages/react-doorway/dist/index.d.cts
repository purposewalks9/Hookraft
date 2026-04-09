import * as react_jsx_runtime from 'react/jsx-runtime';

declare namespace useDoorway {
    type Status = "idle" | "enter" | "loading" | "success" | "error";
    type Options = {
        onEnter?: () => void | Promise<void>;
        onExit?: () => void | Promise<void>;
        onLoading?: () => void | Promise<void>;
        onSuccess?: () => void | Promise<void>;
        onError?: () => void | Promise<void>;
    };
    type Return = {
        status: Status;
        is: (status: Status) => boolean;
        enter: () => void;
        exit: () => void;
        load: () => void;
        succeed: () => void;
        fail: () => void;
        reset: () => void;
    };
}
declare function useDoorway(options?: useDoorway.Options): useDoorway.Return;

declare namespace Doorway {
    type Props = {
        when: boolean | useDoorway.Status;
        onEnter?: () => void | Promise<void>;
        onExit?: () => void | Promise<void>;
        onLoading?: () => void | Promise<void>;
        onSuccess?: () => void | Promise<void>;
        onError?: () => void | Promise<void>;
        fallback?: React.ReactNode;
        children: React.ReactNode;
    };
}
declare function Doorway({ when, onEnter, onExit, onLoading, onSuccess, onError, fallback, children, }: Doorway.Props): react_jsx_runtime.JSX.Element;

export { Doorway, useDoorway };
