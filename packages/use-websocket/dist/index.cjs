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
  useWebSocket: () => useWebSocket
});
module.exports = __toCommonJS(index_exports);

// src/useWebSocket.ts
var import_react = require("react");
function isBrowser() {
  return typeof window !== "undefined" && typeof WebSocket !== "undefined";
}
function defaultParser(raw) {
  try {
    return JSON.parse(raw);
  } catch {
    return raw;
  }
}
function defaultSerializer(data) {
  if (typeof data === "string") return data;
  return JSON.stringify(data);
}
function useWebSocket(options) {
  const {
    url,
    protocols,
    autoConnect = true,
    reconnect: shouldReconnect = true,
    reconnectAttempts: maxAttempts = 5,
    reconnectInterval = 2e3,
    maxReconnectInterval = 3e4,
    heartbeat,
    messageLimit = 100,
    queueWhileOffline = true,
    onConnect,
    onDisconnect,
    onMessage,
    onError,
    onReconnect,
    onReconnectFailed,
    parseMessage = defaultParser,
    serializeMessage = defaultSerializer
  } = options;
  const [status, setStatus] = (0, import_react.useState)("idle");
  const [messages, setMessages] = (0, import_react.useState)([]);
  const [lastMessage, setLastMessage] = (0, import_react.useState)(null);
  const [reconnectCount, setReconnectCount] = (0, import_react.useState)(0);
  const [queuedCount, setQueuedCount] = (0, import_react.useState)(0);
  const wsRef = (0, import_react.useRef)(null);
  const reconnectTimerRef = (0, import_react.useRef)(null);
  const heartbeatTimerRef = (0, import_react.useRef)(null);
  const reconnectAttemptsRef = (0, import_react.useRef)(0);
  const messageQueueRef = (0, import_react.useRef)([]);
  const manualCloseRef = (0, import_react.useRef)(false);
  const mountedRef = (0, import_react.useRef)(true);
  const onConnectRef = (0, import_react.useRef)(onConnect);
  const onDisconnectRef = (0, import_react.useRef)(onDisconnect);
  const onMessageRef = (0, import_react.useRef)(onMessage);
  const onErrorRef = (0, import_react.useRef)(onError);
  const onReconnectRef = (0, import_react.useRef)(onReconnect);
  const onReconnectFailedRef = (0, import_react.useRef)(onReconnectFailed);
  (0, import_react.useEffect)(() => {
    onConnectRef.current = onConnect;
  }, [onConnect]);
  (0, import_react.useEffect)(() => {
    onDisconnectRef.current = onDisconnect;
  }, [onDisconnect]);
  (0, import_react.useEffect)(() => {
    onMessageRef.current = onMessage;
  }, [onMessage]);
  (0, import_react.useEffect)(() => {
    onErrorRef.current = onError;
  }, [onError]);
  (0, import_react.useEffect)(() => {
    onReconnectRef.current = onReconnect;
  }, [onReconnect]);
  (0, import_react.useEffect)(() => {
    onReconnectFailedRef.current = onReconnectFailed;
  }, [onReconnectFailed]);
  (0, import_react.useEffect)(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);
  const stopHeartbeat = (0, import_react.useCallback)(() => {
    if (heartbeatTimerRef.current) {
      clearInterval(heartbeatTimerRef.current);
      heartbeatTimerRef.current = null;
    }
  }, []);
  const startHeartbeat = (0, import_react.useCallback)((ws) => {
    if (!heartbeat) return;
    stopHeartbeat();
    const { message = "ping", interval = 3e4 } = heartbeat;
    heartbeatTimerRef.current = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(typeof message === "string" ? message : JSON.stringify(message));
      }
    }, interval);
  }, [heartbeat, stopHeartbeat]);
  const flushQueue = (0, import_react.useCallback)((ws) => {
    const queue = [...messageQueueRef.current];
    messageQueueRef.current = [];
    setQueuedCount(0);
    queue.forEach((msg) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(msg);
      }
    });
  }, []);
  const connect = (0, import_react.useCallback)(() => {
    if (!isBrowser()) return;
    if (wsRef.current?.readyState === WebSocket.OPEN) return;
    manualCloseRef.current = false;
    if (mountedRef.current) setStatus("connecting");
    const ws = new WebSocket(url, protocols);
    wsRef.current = ws;
    ws.onopen = () => {
      if (!mountedRef.current) return;
      reconnectAttemptsRef.current = 0;
      setReconnectCount(0);
      setStatus("connected");
      startHeartbeat(ws);
      flushQueue(ws);
      onConnectRef.current?.();
    };
    ws.onmessage = (event) => {
      if (!mountedRef.current) return;
      if (heartbeat && (event.data === "pong" || event.data === heartbeat.message)) return;
      const parsed = parseMessage(event.data);
      if (parsed === null) return;
      setLastMessage(parsed);
      setMessages((prev) => {
        const next = [...prev, parsed];
        return next.length > messageLimit ? next.slice(-messageLimit) : next;
      });
      onMessageRef.current?.(parsed, event);
    };
    ws.onclose = (event) => {
      if (!mountedRef.current) return;
      stopHeartbeat();
      wsRef.current = null;
      onDisconnectRef.current?.(event);
      if (manualCloseRef.current) {
        setStatus("disconnected");
        return;
      }
      if (shouldReconnect && reconnectAttemptsRef.current < maxAttempts) {
        reconnectAttemptsRef.current++;
        setReconnectCount(reconnectAttemptsRef.current);
        setStatus("reconnecting");
        onReconnectRef.current?.(reconnectAttemptsRef.current);
        const delay = Math.min(
          reconnectInterval * Math.pow(2, reconnectAttemptsRef.current - 1),
          maxReconnectInterval
        );
        reconnectTimerRef.current = setTimeout(() => {
          if (mountedRef.current) connect();
        }, delay);
      } else if (reconnectAttemptsRef.current >= maxAttempts) {
        setStatus("error");
        onReconnectFailedRef.current?.();
      } else {
        setStatus("disconnected");
      }
    };
    ws.onerror = (event) => {
      if (!mountedRef.current) return;
      onErrorRef.current?.(event);
    };
  }, [
    url,
    protocols,
    shouldReconnect,
    maxAttempts,
    reconnectInterval,
    maxReconnectInterval,
    messageLimit,
    heartbeat,
    parseMessage,
    startHeartbeat,
    stopHeartbeat,
    flushQueue
  ]);
  const disconnect = (0, import_react.useCallback)(() => {
    manualCloseRef.current = true;
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
    stopHeartbeat();
    wsRef.current?.close();
    wsRef.current = null;
    if (mountedRef.current) setStatus("disconnected");
  }, [stopHeartbeat]);
  const reconnect = (0, import_react.useCallback)(() => {
    disconnect();
    reconnectAttemptsRef.current = 0;
    setTimeout(() => connect(), 100);
  }, [disconnect, connect]);
  const send = (0, import_react.useCallback)((data) => {
    const serialized = serializeMessage(data);
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(serialized);
    } else if (queueWhileOffline) {
      messageQueueRef.current.push(serialized);
      setQueuedCount(messageQueueRef.current.length);
    }
  }, [serializeMessage, queueWhileOffline]);
  const sendRaw = (0, import_react.useCallback)((data) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(data);
    } else if (queueWhileOffline) {
      messageQueueRef.current.push(data);
      setQueuedCount(messageQueueRef.current.length);
    }
  }, [queueWhileOffline]);
  const clearMessages = (0, import_react.useCallback)(() => {
    setMessages([]);
    setLastMessage(null);
  }, []);
  const is = (0, import_react.useCallback)(
    (s) => status === s,
    [status]
  );
  (0, import_react.useEffect)(() => {
    if (autoConnect) connect();
    return () => {
      manualCloseRef.current = true;
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      stopHeartbeat();
      wsRef.current?.close();
    };
  }, []);
  return {
    status,
    messages,
    lastMessage,
    isConnecting: status === "connecting" || status === "reconnecting",
    isConnected: status === "connected",
    isDisconnected: status === "disconnected",
    isError: status === "error",
    reconnectCount,
    queuedCount,
    send,
    sendRaw,
    connect,
    disconnect,
    reconnect,
    clearMessages,
    is
  };
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  useWebSocket
});
//# sourceMappingURL=index.cjs.map