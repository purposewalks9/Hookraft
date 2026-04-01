"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var index_exports = {};
__export(index_exports, {
  useBroadcast: () => useBroadcast
});
module.exports = __toCommonJS(index_exports);

// src/useBroadcast.ts
var import_react = require("react");
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
  const tabId = (0, import_react.useRef)(generateTabId()).current;
  const channelRef = (0, import_react.useRef)(null);
  const [state, setState] = (0, import_react.useState)(initialState);
  const [status, setStatus] = (0, import_react.useState)(
    supported ? "idle" : "unsupported"
  );
  const [listenerCount, setListenerCount] = (0, import_react.useState)(0);
  const onMessageRef = (0, import_react.useRef)(onMessage);
  const onTabJoinRef = (0, import_react.useRef)(onTabJoin);
  const onTabLeaveRef = (0, import_react.useRef)(onTabLeave);
  const onConnectRef = (0, import_react.useRef)(onConnect);
  const onDisconnectRef = (0, import_react.useRef)(onDisconnect);
  (0, import_react.useEffect)(() => {
    onMessageRef.current = onMessage;
  }, [onMessage]);
  (0, import_react.useEffect)(() => {
    onTabJoinRef.current = onTabJoin;
  }, [onTabJoin]);
  (0, import_react.useEffect)(() => {
    onTabLeaveRef.current = onTabLeave;
  }, [onTabLeave]);
  (0, import_react.useEffect)(() => {
    onConnectRef.current = onConnect;
  }, [onConnect]);
  (0, import_react.useEffect)(() => {
    onDisconnectRef.current = onDisconnect;
  }, [onDisconnect]);
  const openChannel = (0, import_react.useCallback)(() => {
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
  const closeChannel = (0, import_react.useCallback)(() => {
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
  (0, import_react.useEffect)(() => {
    openChannel();
    return () => closeChannel();
  }, [openChannel, closeChannel]);
  const broadcast = (0, import_react.useCallback)(
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
  const send = (0, import_react.useCallback)(
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
  const close = (0, import_react.useCallback)(() => closeChannel(), [closeChannel]);
  const reconnect = (0, import_react.useCallback)(() => {
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
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  useBroadcast
});
//# sourceMappingURL=index.cjs.map