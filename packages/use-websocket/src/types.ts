export type WebSocketStatus =
  | "idle"
  | "connecting"
  | "connected"
  | "disconnected"
  | "reconnecting"
  | "error"

export interface HeartbeatConfig {
  /** Message to send as heartbeat. Defaults to "ping" */
  message?: string | object
  /** Interval in ms between heartbeats. Defaults to 30000 */
  interval?: number
}

export interface UseWebSocketOptions<TMessage = unknown, TSend = unknown> {
  /** WebSocket server URL */
  url: string
  /** WebSocket protocols */
  protocols?: string | string[]
  /**
   * Whether to connect automatically on mount.
   * Defaults to true.
   */
  autoConnect?: boolean
  /**
   * Whether to automatically reconnect on disconnect.
   * Defaults to true.
   */
  reconnect?: boolean
  /**
   * Maximum number of reconnect attempts.
   * Defaults to 5.
   */
  reconnectAttempts?: number
  /**
   * Base interval in ms between reconnect attempts.
   * Uses exponential backoff. Defaults to 2000.
   */
  reconnectInterval?: number
  /**
   * Maximum reconnect interval in ms.
   * Defaults to 30000.
   */
  maxReconnectInterval?: number
  /**
   * Heartbeat configuration to keep the connection alive.
   */
  heartbeat?: HeartbeatConfig
  /**
   * Maximum number of messages to keep in history.
   * Defaults to 100.
   */
  messageLimit?: number
  /**
   * If true, queues messages sent while disconnected
   * and sends them when reconnected.
   * Defaults to true.
   */
  queueWhileOffline?: boolean
  /** Fires when connection is established */
  onConnect?: () => void
  /** Fires when connection is closed */
  onDisconnect?: (event: CloseEvent) => void
  /** Fires when a message is received */
  onMessage?: (data: TMessage, event: MessageEvent) => void
  /** Fires when an error occurs */
  onError?: (event: Event) => void
  /** Fires on every reconnect attempt with the attempt number */
  onReconnect?: (attempt: number) => void
  /** Fires when max reconnect attempts are exhausted */
  onReconnectFailed?: () => void
  /**
   * Custom message parser. Defaults to JSON.parse.
   * Return the parsed message or null to skip.
   */
  parseMessage?: (raw: string) => TMessage | null
  /**
   * Custom message serializer. Defaults to JSON.stringify.
   */
  serializeMessage?: (data: TSend) => string
}

export interface UseWebSocketReturn<TMessage = unknown, TSend = unknown> {
  /** Current connection status */
  status: WebSocketStatus
  /** All received messages */
  messages: TMessage[]
  /** Last received message */
  lastMessage: TMessage | null
  /** True while connecting or reconnecting */
  isConnecting: boolean
  /** True when connection is open */
  isConnected: boolean
  /** True when disconnected */
  isDisconnected: boolean
  /** True when an error occurred */
  isError: boolean
  /** Number of reconnect attempts made */
  reconnectCount: number
  /** Number of messages queued while offline */
  queuedCount: number
  /** Send a message — queued if not connected */
  send: (data: TSend) => void
  /** Send a raw string message */
  sendRaw: (data: string) => void
  /** Manually connect */
  connect: () => void
  /** Manually disconnect */
  disconnect: () => void
  /** Manually trigger reconnect */
  reconnect: () => void
  /** Clear message history */
  clearMessages: () => void
  /** Check current status */
  is: (status: WebSocketStatus) => boolean
}