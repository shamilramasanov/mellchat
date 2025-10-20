// WebSocket hook with auto-reconnect, subscriptions and keepalive
import { useEffect, useRef, useState, useCallback } from 'react';

const WS_URL = process.env.REACT_APP_WS_URL || '';
const WS_ENABLED = typeof WS_URL === 'string' && WS_URL.startsWith('ws');
const RECONNECT_INTERVAL = 3000; // 3 seconds
const MAX_RECONNECT_ATTEMPTS = 10;
const PING_INTERVAL = 25000; // 25 seconds

export function useWebSocket() {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [lastMessage, setLastMessage] = useState(null);

  const wsRef = useRef(null);
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimerRef = useRef(null);
  const pingTimerRef = useRef(null);
  const messageHandlersRef = useRef(new Map());
  const subscriptionsRef = useRef(new Set());

  const emitEvent = useCallback((event, payload) => {
    const handlers = messageHandlersRef.current.get(event);
    if (!handlers) return;
    handlers.forEach(fn => { try { fn(payload); } catch (e) { console.error('WS handler error:', e); } });
  }, []);

  const startPing = useCallback(() => {
    stopPing();
    pingTimerRef.current = setInterval(() => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        try { wsRef.current.send(JSON.stringify({ type: 'ping', ts: Date.now() })); } catch {}
      }
    }, PING_INTERVAL);
    pingTimerRef.current.unref?.();
  }, [stopPing]);

  const stopPing = useCallback(() => {
    if (pingTimerRef.current) {
      clearInterval(pingTimerRef.current);
      pingTimerRef.current = null;
    }
  }, []);

  const handleMessage = useCallback((data) => {
    setLastMessage(data);
    emitEvent(data.type, data);
    emitEvent('message', data);
  }, [emitEvent]);

  const connect = useCallback(() => {
    if (!WS_ENABLED) {
      setConnectionStatus('disabled');
      return;
    }
    if (wsRef.current?.readyState === WebSocket.OPEN) return;
    try {
      setConnectionStatus('connecting');
      const ws = new WebSocket(WS_URL);
      wsRef.current = ws;
      ws.onopen = () => {
        setIsConnected(true);
        setConnectionStatus('connected');
        reconnectAttemptsRef.current = 0;
        startPing();
        emitEvent('connected', { timestamp: Date.now() });
      };
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          handleMessage(data);
        } catch (e) { console.error('WS parse error', e); }
      };
      ws.onerror = (error) => {
        setConnectionStatus('error');
        emitEvent('error', { error });
      };
      ws.onclose = (event) => {
        setIsConnected(false);
        setConnectionStatus('disconnected');
        wsRef.current = null;
        stopPing();
        emitEvent('disconnected', { code: event.code, reason: event.reason });
        if (event.code !== 1000 && reconnectAttemptsRef.current < MAX_RECONNECT_ATTEMPTS) {
          const backoff = Math.min(RECONNECT_INTERVAL * Math.pow(2, reconnectAttemptsRef.current), 30000);
          setConnectionStatus('reconnecting');
          reconnectTimerRef.current = setTimeout(() => { reconnectAttemptsRef.current++; connect(); }, backoff);
        }
      };
    } catch (e) {
      setConnectionStatus('error');
      const backoff = Math.min(RECONNECT_INTERVAL * Math.pow(2, reconnectAttemptsRef.current), 30000);
      reconnectTimerRef.current = setTimeout(() => { reconnectAttemptsRef.current++; connect(); }, backoff);
    }
  }, [emitEvent, handleMessage, startPing, stopPing]);

  const disconnect = useCallback(() => {
    if (reconnectTimerRef.current) { clearTimeout(reconnectTimerRef.current); reconnectTimerRef.current = null; }
    stopPing();
    if (wsRef.current) { wsRef.current.close(1000, 'Client disconnect'); wsRef.current = null; }
    setIsConnected(false);
    setConnectionStatus('disconnected');
    reconnectAttemptsRef.current = MAX_RECONNECT_ATTEMPTS;
  }, [stopPing]);

  const sendMessage = useCallback((message) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return false;
    try { wsRef.current.send(JSON.stringify(message)); return true; } catch { return false; }
  }, []);

  const subscribe = useCallback((connectionId) => {
    if (subscriptionsRef.current.has(connectionId)) return;
    subscriptionsRef.current.add(connectionId);
    sendMessage({ type: 'subscribe', connectionId });
  }, [sendMessage]);

  const unsubscribe = useCallback((connectionId) => {
    subscriptionsRef.current.delete(connectionId);
    sendMessage({ type: 'unsubscribe', connectionId });
  }, [sendMessage]);

  const on = useCallback((event, handler) => {
    if (!messageHandlersRef.current.has(event)) messageHandlersRef.current.set(event, new Set());
    const set = messageHandlersRef.current.get(event);
    set.add(handler);
    return () => { set.delete(handler); if (set.size === 0) messageHandlersRef.current.delete(event); };
  }, []);

  const off = useCallback((event, handler) => {
    const set = messageHandlersRef.current.get(event);
    if (set) { set.delete(handler); if (set.size === 0) messageHandlersRef.current.delete(event); }
  }, []);

  useEffect(() => { connect(); return () => { disconnect(); }; }, [connect, disconnect]);

  return { isConnected, connectionStatus, lastMessage, connect, disconnect, sendMessage, subscribe, unsubscribe, on, off };
}



