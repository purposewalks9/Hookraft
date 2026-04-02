type IntentSignal = "leaving" | "idle" | "engaged" | "lost_interest" | "about_to_click" | "returning" | "tab_hidden" | "reading";
interface IntentState {
    /** User's cursor is moving toward the top — about to close or switch tabs */
    isLeaving: boolean;
    /** No activity detected for the configured idle duration */
    isIdle: boolean;
    /** User is actively scrolling and engaging with the page */
    isEngaged: boolean;
    /** User is scrolling fast without dwelling — losing interest */
    isLostInterest: boolean;
    /** Cursor is decelerating toward an element — about to click */
    isAboutToClick: boolean;
    /** User came back after being idle or in another tab */
    isReturning: boolean;
    /** User switched to another tab */
    isTabHidden: boolean;
    /** User is scrolling slowly — actively reading */
    isReading: boolean;
    /** How long the user has been on the page in ms */
    timeOnPage: number;
    /** How far down the page the user has scrolled (0-100) */
    scrollDepth: number;
    /** Current scroll direction */
    scrollDirection: "up" | "down" | "idle";
    /** Current scroll speed in px/s */
    scrollSpeed: number;
    /** All active intent signals */
    signals: IntentSignal[];
    /** Confidence score 0-100 that the user is about to leave */
    exitConfidence: number;
    /** Confidence score 0-100 that the user is engaged */
    engagementScore: number;
}
interface UseIntentOptions {
    /**
     * Seconds of inactivity before user is considered idle.
     * Defaults to 30.
     */
    idleAfter?: number;
    /**
     * Scroll speed (px/s) above which user is considered to be skimming.
     * Defaults to 800.
     */
    skimThreshold?: number;
    /**
     * Scroll speed (px/s) below which user is considered to be reading.
     * Defaults to 100.
     */
    readingThreshold?: number;
    /**
     * How close to the top of the viewport (px) the cursor must be
     * to trigger exit intent. Defaults to 20.
     */
    exitThreshold?: number;
    /**
     * Fires when exit intent is detected.
     */
    onLeaving?: () => void;
    /**
     * Fires when the user goes idle.
     */
    onIdle?: () => void;
    /**
     * Fires when an idle or hidden user returns.
     */
    onReturn?: () => void;
    /**
     * Fires when the user switches to another tab.
     */
    onTabHidden?: () => void;
    /**
     * Fires when the user comes back to this tab.
     */
    onTabVisible?: () => void;
    /**
     * Fires when the user loses interest (fast scroll toward exit).
     */
    onLostInterest?: () => void;
    /**
     * Fires when engagement score crosses above this threshold (0-100).
     * Defaults to 60.
     */
    onEngaged?: (score: number) => void;
    /**
     * Fires on every intent change with the full intent state.
     */
    onChange?: (intent: IntentState) => void;
}
interface UseIntentReturn extends IntentState {
    /** Reset all signals and timers */
    reset: () => void;
}

/**
 * useIntent
 *
 * Predict what users are about to do by listening to raw browser signals —
 * mouse movement, scroll velocity, idle time, tab visibility, and cursor
 * deceleration — and combining them into readable intent primitives.
 *
 * @example
 * const { isLeaving, isEngaged, exitConfidence, engagementScore } = useIntent({
 *   onLeaving: () => showExitPopup(),
 *   onIdle: () => pauseVideo(),
 *   onEngaged: (score) => trackEngagement(score),
 * })
 */
declare function useIntent(options?: UseIntentOptions): UseIntentReturn;

export { type IntentSignal, type IntentState, type UseIntentOptions, type UseIntentReturn, useIntent };
