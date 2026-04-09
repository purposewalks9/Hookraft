declare namespace useWebSocket {
    type Status = "idle" | "connecting" | "connected" | "disconnected" | "reconnecting" | "error";
    interface HeartbeatConfig {
        /** Message to send as heartbeat. Defaults to "ping" */
        message?: string | object;
        /** Interval in ms between heartbeats. Defaults to 30000 */
        interval?: number;
    }
    interface Options<TMessage = unknown, TSend = unknown> {
        url: string;
        protocols?: string | string[];
        autoConnect?: boolean;
        reconnect?: boolean;
        reconnectAttempts?: number;
        reconnectInterval?: number;
        maxReconnectInterval?: number;
        heartbeat?: HeartbeatConfig;
        messageLimit?: number;
        queueWhileOffline?: boolean;
        onConnect?: () => void;
        onDisconnect?: (event: CloseEvent) => void;
        onMessage?: (data: TMessage, event: MessageEvent) => void;
        onError?: (event: Event) => void;
        onReconnect?: (attempt: number) => void;
        onReconnectFailed?: () => void;
        parseMessage?: (raw: string) => TMessage | null;
        serializeMessage?: (data: TSend) => string;
    }
    interface Return<TMessage = unknown, TSend = unknown> {
        status: Status;
        messages: TMessage[];
        lastMessage: TMessage | null;
        isConnecting: boolean;
        isConnected: boolean;
        isDisconnected: boolean;
        isError: boolean;
        reconnectCount: number;
        queuedCount: number;
        send: (data: TSend) => void;
        sendRaw: (data: string) => void;
        connect: () => void;
        disconnect: () => void;
        reconnect: () => void;
        clearMessages: () => void;
        is: (status: Status) => boolean;
    }
}
declare function useWebSocket<TMessage = unknown, TSend = unknown>(options: useWebSocket.Options<TMessage, TSend>): useWebSocket.Return<TMessage, TSend>;

export { useWebSocket };
