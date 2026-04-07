interface UseCopyOptions {
    /**
     * Duration of the suction animation in ms.
     * @default 400
     */
    duration?: number;
    /**
     * Stagger delay between each character in ms.
     * @default 20
     */
    stagger?: number;
    /**
     * How long "copied" state stays true after animation ends in ms.
     * @default 1500
     */
    resetDelay?: number;
}
interface UseCopyReturn {
    /** Attach to the preformatted text element */
    textRef: React.RefObject<HTMLElement | null>;
    /** Attach to the copy icon button */
    iconRef: React.RefObject<HTMLButtonElement | null>;
    /** True from click until resetDelay ms after animation ends */
    copied: boolean;
    /** Call this onClick of the icon button */
    trigger: () => void;
}

declare function useCopy({ duration, stagger, resetDelay, }?: UseCopyOptions): UseCopyReturn;

export { type UseCopyOptions, type UseCopyReturn, useCopy };
