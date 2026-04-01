import { useState, useEffect, useCallback, useRef } from "react"
import type {
  BroadcastMessage,
  BroadcastStatus,
  UseBroadcastOptions,
  UseBroadcastReturn,
} from "./types"

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
export function useBroadcast<T>(
  channelName: string,
  initialState: T,
  options: UseBroadcastOptions<T> = {}
): UseBroadcastReturn<T> {
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
  const [status, setStatus] = useState<BroadcastStatus>(
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

    channel.onmessage = (event: MessageEvent<BroadcastMessage<T>>) => {
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
          } satisfies BroadcastMessage<T>)
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
    } satisfies BroadcastMessage<T>)
  }, [channelName, supported, syncState, tabId])

  const closeChannel = useCallback(() => {
    if (!channelRef.current) return

    // Announce this tab is leaving
    channelRef.current.postMessage({
      type: "tab_leave",
      tabId,
      timestamp: Date.now(),
    } satisfies BroadcastMessage<T>)

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
      } satisfies BroadcastMessage<T>)
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
      } satisfies BroadcastMessage<T>)
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