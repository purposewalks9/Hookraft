import { useState, useEffect, useCallback, useRef } from "react"

// Generate a unique ID for this tab session
function generateTabId(): string {
  return `tab_${Math.random().toString(36).slice(2, 9)}_${Date.now()}`
}

// Check if BroadcastChannel is available (SSR safe)
function isBroadcastSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof window.BroadcastChannel !== "undefined"
  )
}

// ─── Namespace ────────────────────────────────────────────────────────────────

export declare namespace useBroadcast {
  type Status = "idle" | "active" | "unsupported"

  type MessageType =
    | "state_update"
    | "tab_join"
    | "tab_leave"
    | "ping"
    | "pong"

  interface Message<T> {
    type: MessageType
    payload?: T
    tabId: string
    timestamp: number
  }

  interface Options<T> {
    /** Fires when any other tab sends a new state update. Receives the new state value. */
    onMessage?: (data: T, tabId: string) => void
    /** Fires when a new tab joins the broadcast channel. */
    onTabJoin?: (tabId: string) => void
    /** Fires when a tab leaves or closes. */
    onTabLeave?: (tabId: string) => void
    /**
     * If true, syncs state FROM other tabs automatically.
     * If false, only listens to messages without updating local state.
     * Defaults to true.
     */
    syncState?: boolean
    /** Fires when the channel is successfully opened. */
    onConnect?: () => void
    /** Fires when the channel is closed. */
    onDisconnect?: () => void
  }

  interface Return<T> {
    /** Current state value — synced across all tabs */
    state: T
    /** Update state in this tab AND broadcast to all other tabs */
    broadcast: (value: T) => void
    /** Send a message to other tabs without updating local state */
    send: (value: T) => void
    /** Current channel status */
    status: Status
    /** True if BroadcastChannel is supported in this browser */
    isSupported: boolean
    /** Unique ID for the current tab */
    tabId: string
    /** Number of other tabs currently listening on this channel */
    listenerCount: number
    /** Manually close the channel */
    close: () => void
    /** Reopen a closed channel */
    reconnect: () => void
  }
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useBroadcast<T>(
  channelName: string,
  initialState: T,
  options: useBroadcast.Options<T> = {}
): useBroadcast.Return<T> {
  const {
    onMessage,
    onTabJoin,
    onTabLeave,
    syncState = true,
    onConnect,
    onDisconnect,
  } = options

  const supported = isBroadcastSupported()
  const tabId = useRef(generateTabId()).current
  const channelRef = useRef<BroadcastChannel | null>(null)

  const [state, setState] = useState<T>(initialState)
  const [status, setStatus] = useState<useBroadcast.Status>(
    supported ? "idle" : "unsupported"
  )
  const [listenerCount, setListenerCount] = useState(0)

  // Keep callbacks fresh
  const onMessageRef = useRef(onMessage)
  const onTabJoinRef = useRef(onTabJoin)
  const onTabLeaveRef = useRef(onTabLeave)
  const onConnectRef = useRef(onConnect)
  const onDisconnectRef = useRef(onDisconnect)

  useEffect(() => { onMessageRef.current = onMessage }, [onMessage])
  useEffect(() => { onTabJoinRef.current = onTabJoin }, [onTabJoin])
  useEffect(() => { onTabLeaveRef.current = onTabLeave }, [onTabLeave])
  useEffect(() => { onConnectRef.current = onConnect }, [onConnect])
  useEffect(() => { onDisconnectRef.current = onDisconnect }, [onDisconnect])

  const openChannel = useCallback(() => {
    if (!supported) return
    if (channelRef.current) return

    const channel = new BroadcastChannel(channelName)
    channelRef.current = channel
    setStatus("active")
    onConnectRef.current?.()

    channel.onmessage = (event: MessageEvent<useBroadcast.Message<T>>) => {
      const { type, payload, tabId: senderId } = event.data

      // Ignore messages from this tab
      if (senderId === tabId) return

      switch (type) {
        case "state_update":
          if (payload !== undefined) {
            if (syncState) setState(payload)
            onMessageRef.current?.(payload, senderId)
          }
          break

        case "tab_join":
          setListenerCount((n) => n + 1)
          onTabJoinRef.current?.(senderId)
          // Respond so the joining tab knows we exist
          channel.postMessage({
            type: "pong",
            tabId,
            timestamp: Date.now(),
          } satisfies useBroadcast.Message<T>)
          break

        case "tab_leave":
          setListenerCount((n) => Math.max(0, n - 1))
          onTabLeaveRef.current?.(senderId)
          break

        case "pong":
          // Another tab acknowledged our join ping
          setListenerCount((n) => n + 1)
          break
      }
    }

    // Announce this tab joined
    channel.postMessage({
      type: "tab_join",
      tabId,
      timestamp: Date.now(),
    } satisfies useBroadcast.Message<T>)
  }, [channelName, supported, syncState, tabId])

  const closeChannel = useCallback(() => {
    if (!channelRef.current) return

    // Announce this tab is leaving
    channelRef.current.postMessage({
      type: "tab_leave",
      tabId,
      timestamp: Date.now(),
    } satisfies useBroadcast.Message<T>)

    channelRef.current.close()
    channelRef.current = null
    setStatus("idle")
    setListenerCount(0)
    onDisconnectRef.current?.()
  }, [tabId])

  // Open channel on mount, close on unmount
  useEffect(() => {
    openChannel()
    return () => closeChannel()
  }, [openChannel, closeChannel])

  // Broadcast state update to all other tabs AND update local state
  const broadcast = useCallback(
    (value: T) => {
      setState(value)
      channelRef.current?.postMessage({
        type: "state_update",
        payload: value,
        tabId,
        timestamp: Date.now(),
      } satisfies useBroadcast.Message<T>)
    },
    [tabId]
  )

  // Send to other tabs WITHOUT updating local state
  const send = useCallback(
    (value: T) => {
      channelRef.current?.postMessage({
        type: "state_update",
        payload: value,
        tabId,
        timestamp: Date.now(),
      } satisfies useBroadcast.Message<T>)
    },
    [tabId]
  )

  const close = useCallback(() => closeChannel(), [closeChannel])

  const reconnect = useCallback(() => {
    closeChannel()
    openChannel()
  }, [closeChannel, openChannel])

  return {
    state,
    broadcast,
    send,
    status,
    isSupported: supported,
    tabId,
    listenerCount,
    close,
    reconnect,
  }
}