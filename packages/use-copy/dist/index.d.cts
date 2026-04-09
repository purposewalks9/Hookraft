declare namespace useCopy {
    type Options = {
        duration?: number;
        stagger?: number;
        resetDelay?: number;
    };
    type Return = {
        textRef: React.RefObject<HTMLElement | null>;
        iconRef: React.RefObject<HTMLButtonElement | null>;
        copied: boolean;
        trigger: () => void;
    };
}
declare function useCopy({ duration, stagger, resetDelay, }?: useCopy.Options): useCopy.Return;

export { useCopy };
