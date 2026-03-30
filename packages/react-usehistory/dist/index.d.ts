type UseHistoryOptions<T> = {
    /** Maximum number of history entries to keep. Defaults to 100 */
    limit?: number;
    /** Fires when undo is called with the state being restored */
    onUndo?: (state: T) => void;
    /** Fires when redo is called with the state being restored */
    onRedo?: (state: T) => void;
    /** Fires whenever state changes (set, undo, or redo) */
    onChange?: (state: T) => void;
};
type UseHistoryReturn<T> = {
    /** Current state value */
    state: T;
    /** Set a new state value — pushes to history */
    set: (value: T | ((prev: T) => T)) => void;
    /** Step back one entry in history */
    undo: () => void;
    /** Step forward one entry in history */
    redo: () => void;
    /** True if there are entries to undo */
    canUndo: boolean;
    /** True if there are entries to redo */
    canRedo: boolean;
    /** Full past history (oldest → most recent before current) */
    history: T[];
    /** Future states available for redo */
    future: T[];
    /** Reset to initial value and clear all history */
    clear: () => void;
    /** Jump to a specific index in history */
    jump: (index: number) => void;
};
/**
 * useHistory
 *
 * Adds undo/redo superpowers to any state value.
 * Tracks past and future states with a configurable history limit.
 *
 * @example
 * const { state, set, undo, redo, canUndo, canRedo } = useHistory("")
 *
 * set("hello")   // state = "hello"
 * set("world")   // state = "world"
 * undo()         // state = "hello"
 * redo()         // state = "world"
 */
declare function useHistory<T>(initialValue: T, options?: UseHistoryOptions<T>): UseHistoryReturn<T>;

export { type UseHistoryOptions, type UseHistoryReturn, useHistory };
