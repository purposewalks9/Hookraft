// src/useBroadcast.ts
import { useState, useEffect, useCallback, useRef } from "react";
function generateTabId() {
  return `tab_${Math.random().toString(36).slice(2, 9)}_${Date.now()}`;
}
function isBroadcastSupported() {
  return typeof window !== "undefined" && typeof window.BroadcastChannel !== "undefined";
}
function useBroadcast(channelName, initialState, options = {}) {
  const {
    onMessage,
    onTabJoin,
    onTabLeave,
    syncState = true,
    onConnect,
    onDisconnect
  } = options;
  const supported = isBroadcastSupported();
  const tabId = useRef(generateTabId()).current;
  const channelRef = useRef(null);
  const [state, setState] = useState(initialState);
  const [status, setStatus] = useState(
    supported ? "idle" : "unsupported"
  );
  const [listenerCount, setListenerCount] = useState(0);
  const onMessageRef = useRef(onMessage);
  const onTabJoinRef = useRef(onTabJoin);
  const onTabLeaveRef = useRef(onTabLeave);
  const onConnectRef = useRef(onConnect);
  const onDisconnectRef = useRef(onDisconnect);
  useEffect(() => {
    onMessageRef.current = onMessage;
  }, [onMessage]);
  useEffect(() => {
    onTabJoinRef.current = onTabJoin;
  }, [onTabJoin]);
  useEffect(() => {
    onTabLeaveRef.current = onTabLeave;
  }, [onTabLeave]);
  useEffect(() => {
    onConnectRef.current = onConnect;
  }, [onConnect]);
  useEffect(() => {
    onDisconnectRef.current = onDisconnect;
  }, [onDisconnect]);
  const openChannel = useCallback(() => {
    if (!supported) return;
    if (channelRef.current) return;
    const channel = new BroadcastChannel(channelName);
    channelRef.current = channel;
    setStatus("active");
    onConnectRef.current?.();
    channel.onmessage = (event) => {
      const { type, payload, tabId: senderId } = event.data;
      if (senderId === tabId) return;
      switch (type) {
        case "state_update":
          if (payload !== void 0) {
            if (syncState) setState(payload);
            onMessageRef.current?.(payload, senderId);
          }
          break;
        case "tab_join":
          setListenerCount((n) => n + 1);
          onTabJoinRef.current?.(senderId);
          channel.postMessage({
            type: "pong",
            tabId,
            timestamp: Date.now()
          });
          break;
        case "tab_leave":
          setListenerCount((n) => Math.max(0, n - 1));
          onTabLeaveRef.current?.(senderId);
          break;
        case "pong":
          setListenerCount((n) => n + 1);
          break;
      }
    };
    channel.postMessage({
      type: "tab_join",
      tabId,
      timestamp: Date.now()
    });
  }, [channelName, supported, syncState, tabId]);
  const closeChannel = useCallback(() => {
    if (!channelRef.current) return;
    channelRef.current.postMessage({
      type: "tab_leave",
      tabId,
      timestamp: Date.now()
    });
    channelRef.current.close();
    channelRef.current = null;
    setStatus("idle");
    setListenerCount(0);
    onDisconnectRef.current?.();
  }, [tabId]);
  useEffect(() => {
    openChannel();
    return () => closeChannel();
  }, [openChannel, closeChannel]);
  const broadcast = useCallback(
    (value) => {
      setState(value);
      channelRef.current?.postMessage({
        type: "state_update",
        payload: value,
        tabId,
        timestamp: Date.now()
      });
    },
    [tabId]
  );
  const send = useCallback(
    (value) => {
      channelRef.current?.postMessage({
        type: "state_update",
        payload: value,
        tabId,
        timestamp: Date.now()
      });
    },
    [tabId]
  );
  const close = useCallback(() => closeChannel(), [closeChannel]);
  const reconnect = useCallback(() => {
    closeChannel();
    openChannel();
  }, [closeChannel, openChannel]);
  return {
    state,
    broadcast,
    send,
    status,
    isSupported: supported,
    tabId,
    listenerCount,
    close,
    reconnect
  };
}
export {
  useBroadcast
};
//# sourceMappingURL=index.js.map