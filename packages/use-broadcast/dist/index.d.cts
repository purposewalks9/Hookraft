declare namespace useBroadcast {
    type Status = "idle" | "active" | "unsupported";
    type MessageType = "state_update" | "tab_join" | "tab_leave" | "ping" | "pong";
    interface Message<T> {
        type: MessageType;
        payload?: T;
        tabId: string;
        timestamp: number;
    }
    interface Options<T> {
        /** Fires when any other tab sends a new state update. Receives the new state value. */
        onMessage?: (data: T, tabId: string) => void;
        /** Fires when a new tab joins the broadcast channel. */
        onTabJoin?: (tabId: string) => void;
        /** Fires when a tab leaves or closes. */
        onTabLeave?: (tabId: string) => void;
        /**
         * If true, syncs state FROM other tabs automatically.
         * If false, only listens to messages without updating local state.
         * Defaults to true.
         */
        syncState?: boolean;
        /** Fires when the channel is successfully opened. */
        onConnect?: () => void;
        /** Fires when the channel is closed. */
        onDisconnect?: () => void;
    }
    interface Return<T> {
        /** Current state value — synced across all tabs */
        state: T;
        /** Update state in this tab AND broadcast to all other tabs */
        broadcast: (value: T) => void;
        /** Send a message to other tabs without updating local state */
        send: (value: T) => void;
        /** Current channel status */
        status: Status;
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
}
declare function useBroadcast<T>(channelName: string, initialState: T, options?: useBroadcast.Options<T>): useBroadcast.Return<T>;

export { useBroadcast };
