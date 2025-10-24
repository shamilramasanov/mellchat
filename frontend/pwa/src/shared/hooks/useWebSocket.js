import { useEffect, useRef, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import { WS_URL, CONNECTION_STATUS } from '../utils/constants';

/**
 * WebSocket hook for real-time communication using native WebSocket
 * @returns {Object} - { status, socket, emit, on, off, isConnected }
 */
export const useWebSocket = () => {
  const [status, setStatus] = useState(CONNECTION_STATUS.DISCONNECTED);
  const socketRef = useRef(null);
  const reconnectAttempts = useRef(0);
  const reconnectTimeoutRef = useRef(null);
  const maxReconnectAttempts = 5;
  const listeners = useRef(new Map());

  // Initialize WebSocket connection
  useEffect(() => {
    const connect = () => {
      try {
        // Create WebSocket instance
        const ws = new WebSocket(WS_URL);
        socketRef.current = ws;

        // Connection opened
        ws.onopen = () => {
          setStatus(CONNECTION_STATUS.CONNECTED);
          reconnectAttempts.current = 0;
          toast.dismiss('ws-reconnecting');
        };

        // Connection closed
        ws.onclose = () => {
          setStatus(CONNECTION_STATUS.DISCONNECTED);
          
          // Attempt reconnection silently
          if (reconnectAttempts.current < maxReconnectAttempts) {
            reconnectAttempts.current += 1;
            const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 16000);
            setStatus(CONNECTION_STATUS.RECONNECTING);
            
            reconnectTimeoutRef.current = setTimeout(() => {
              connect();
            }, delay);
          }
        };

        // Connection error
        ws.onerror = () => {
          // Silent error handling
        };

        // Message received
        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            
            // Notify all listeners for this event type
            const eventListeners = listeners.current.get(data.type);
            if (eventListeners) {
              eventListeners.forEach(callback => callback(data));
            }
            
            // Also emit 'message' event with full data (including connectionId)
            if (data.type === 'message') {
              const messageListeners = listeners.current.get('message');
              if (messageListeners) {
                // Pass full data object so we have access to connectionId and payload
                messageListeners.forEach(callback => callback({
                  connectionId: data.connectionId,
                  message: data.payload
                }));
              }
            }
          } catch (error) {
            console.error('Error parsing WebSocket message:', error);
          }
        };
      } catch (error) {
        console.error('WebSocket connection error:', error);
      }
    };

    connect();

    // Cleanup on unmount
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (socketRef.current) {
        socketRef.current.close();
      }
      listeners.current.clear();
    };
  }, []);

  // Send message to server
  const emit = useCallback((type, data) => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({ type, ...data }));
    }
  }, []);

  // Subscribe to event
  const on = useCallback((event, callback) => {
    const eventListeners = listeners.current.get(event) || new Set();
    eventListeners.add(callback);
    listeners.current.set(event, eventListeners);
  }, []);

  // Unsubscribe from event
  const off = useCallback((event, callback) => {
    const eventListeners = listeners.current.get(event);
    if (eventListeners) {
      eventListeners.delete(callback);
      if (eventListeners.size === 0) {
        listeners.current.delete(event);
      }
    }
  }, []);

  // Subscribe to a stream connection
  const subscribe = useCallback((connectionId) => {
    emit('subscribe', { connectionId });
  }, [emit]);

  // Unsubscribe from a stream connection
  const unsubscribe = useCallback((connectionId) => {
    emit('unsubscribe', { connectionId });
  }, [emit]);

  return {
    status,
    socket: socketRef.current,
    emit,
    on,
    off,
    subscribe,
    unsubscribe,
    isConnected: status === CONNECTION_STATUS.CONNECTED,
    isReconnecting: status === CONNECTION_STATUS.RECONNECTING,
    isDisconnected: status === CONNECTION_STATUS.DISCONNECTED,
  };
};

