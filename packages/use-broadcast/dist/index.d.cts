type BroadcastStatus = "idle" | "active" | "unsupported";
type BroadcastMessageType = "state_update" | "tab_join" | "tab_leave" | "ping" | "pong";
interface BroadcastMessage<T> {
    type: BroadcastMessageType;
    payload?: T;
    tabId: string;
    timestamp: number;
}
interface UseBroadcastOptions<T> {
    /**
     * Fires when any other tab sends a new state update.
     * Receives the new state value.
     */
    onMessage?: (data: T, tabId: string) => void;
    /**
     * Fires when a new tab joins the broadcast channel.
     */
    onTabJoin?: (tabId: string) => void;
    /**
     * Fires when a tab leaves or closes.
     */
    onTabLeave?: (tabId: string) => void;
    /**
     * If true, syncs state FROM other tabs automatically.
     * If false, only listens to messages without updating local state.
     * Defaults to true.
     */
    syncState?: boolean;
    /**
     * Fires when the channel is successfully opened.
     */
    onConnect?: () => void;
    /**
     * Fires when the channel is closed.
     */
    onDisconnect?: () => void;
}
interface UseBroadcastReturn<T> {
    /** Current state value — synced across all tabs */
    state: T;
    /** Update state in this tab AND broadcast to all other tabs */
    broadcast: (value: T) => void;
    /** Send a message to other tabs without updating local state */
    send: (value: T) => void;
    /** Current channel status */
    status: BroadcastStatus;
    /** True if BroadcastChannel is supported in this browser */
    isSupported: boolean;
    /** Unique ID for the current tab */
    tabId: string;
    /** Number of other tabs currently listening on this channel */
    listenerCount: number;
    /** Manually close the channel */
    close: () => void;
    /** Reopen a closed channel */
    reconnect: () => void;
}

/**
 * useBroadcast
 *
 * Sync state across multiple browser tabs in real time.
 * Built on the BroadcastChannel API — no server, no WebSockets.
 *
 * @example
 * // Logout across all tabs
 * const { broadcast } = useBroadcast("auth", { user: null }, {
 *   onMessage: (data) => {
 *     if (!data.user) router.push("/login")
 *   }
 * })
 *
 * // Sync cart across all tabs
 * const { state: cart, broadcast } = useBroadcast("cart", [])
 * broadcast([...cart, newItem]) // updates every open tab instantly
 */
declare function useBroadcast<T>(channelName: string, initialState: T, options?: UseBroadcastOptions<T>): UseBroadcastReturn<T>;

export { type BroadcastMessage, type BroadcastStatus, type UseBroadcastOptions, type UseBroadcastReturn, useBroadcast };
