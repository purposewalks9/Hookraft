// src/useWebSocket.ts
import { useState, useEffect, useRef, useCallback } from "react";
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
  const [status, setStatus] = useState("idle");
  const [messages, setMessages] = useState([]);
  const [lastMessage, setLastMessage] = useState(null);
  const [reconnectCount, setReconnectCount] = useState(0);
  const [queuedCount, setQueuedCount] = useState(0);
  const wsRef = useRef(null);
  const reconnectTimerRef = useRef(null);
  const heartbeatTimerRef = useRef(null);
  const reconnectAttemptsRef = useRef(0);
  const messageQueueRef = useRef([]);
  const manualCloseRef = useRef(false);
  const mountedRef = useRef(true);
  const onConnectRef = useRef(onConnect);
  const onDisconnectRef = useRef(onDisconnect);
  const onMessageRef = useRef(onMessage);
  const onErrorRef = useRef(onError);
  const onReconnectRef = useRef(onReconnect);
  const onReconnectFailedRef = useRef(onReconnectFailed);
  useEffect(() => {
    onConnectRef.current = onConnect;
  }, [onConnect]);
  useEffect(() => {
    onDisconnectRef.current = onDisconnect;
  }, [onDisconnect]);
  useEffect(() => {
    onMessageRef.current = onMessage;
  }, [onMessage]);
  useEffect(() => {
    onErrorRef.current = onError;
  }, [onError]);
  useEffect(() => {
    onReconnectRef.current = onReconnect;
  }, [onReconnect]);
  useEffect(() => {
    onReconnectFailedRef.current = onReconnectFailed;
  }, [onReconnectFailed]);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);
  const stopHeartbeat = useCallback(() => {
    if (heartbeatTimerRef.current) {
      clearInterval(heartbeatTimerRef.current);
      heartbeatTimerRef.current = null;
    }
  }, []);
  const startHeartbeat = useCallback((ws) => {
    if (!heartbeat) return;
    stopHeartbeat();
    const { message = "ping", interval = 3e4 } = heartbeat;
    heartbeatTimerRef.current = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(typeof message === "string" ? message : JSON.stringify(message));
      }
    }, interval);
  }, [heartbeat, stopHeartbeat]);
  const flushQueue = useCallback((ws) => {
    const queue = [...messageQueueRef.current];
    messageQueueRef.current = [];
    setQueuedCount(0);
    queue.forEach((msg) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(msg);
      }
    });
  }, []);
  const connect = useCallback(() => {
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
  const disconnect = useCallback(() => {
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
  const reconnect = useCallback(() => {
    disconnect();
    reconnectAttemptsRef.current = 0;
    setTimeout(() => connect(), 100);
  }, [disconnect, connect]);
  const send = useCallback((data) => {
    const serialized = serializeMessage(data);
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(serialized);
    } else if (queueWhileOffline) {
      messageQueueRef.current.push(serialized);
      setQueuedCount(messageQueueRef.current.length);
    }
  }, [serializeMessage, queueWhileOffline]);
  const sendRaw = useCallback((data) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(data);
    } else if (queueWhileOffline) {
      messageQueueRef.current.push(data);
      setQueuedCount(messageQueueRef.current.length);
    }
  }, [queueWhileOffline]);
  const clearMessages = useCallback(() => {
    setMessages([]);
    setLastMessage(null);
  }, []);
  const is = useCallback(
    (s) => status === s,
    [status]
  );
  useEffect(() => {
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
export {
  useWebSocket
};
//# sourceMappingURL=index.js.map