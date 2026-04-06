import { RefObject } from 'react';

type CursorOrigin = "top-right" | "top-left" | "bottom-right" | "bottom-left";
type CursorTheme = "light" | "dark" | "system";
type KeyTarget = RefObject<HTMLElement> | string;
interface UseKeyCursorOptions {
    keys: Record<string, KeyTarget>;
    origin?: CursorOrigin;
    color?: string;
    theme?: CursorTheme;
    onTrigger?: (key: string, element: HTMLElement) => void;
    ignoreWhen?: () => boolean;
}

declare function useKeyCursor(options: UseKeyCursorOptions): void;

export { type CursorOrigin, type CursorTheme, type KeyTarget, type UseKeyCursorOptions, useKeyCursor };
