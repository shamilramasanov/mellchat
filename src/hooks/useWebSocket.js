import { useEffect, useRef, useState, useCallback } from 'react';

const WS_URL = process.env.REACT_APP_WS_URL || 'wss://mellchat-production.up.railway.app';
const API_URL = process.env.REACT_APP_API_URL || 'https://mellchat-production.up.railway.app';

export const useWebSocket = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [streams, setStreams] = useState([]);
  const [messages, setMessages] = useState({});
  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const reconnectAttempts = useRef(0);
  const MAX_RECONNECT_ATTEMPTS = 5;

  // Connect to WebSocket
  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      console.log('WebSocket already connected');
      return;
    }

    console.log('Connecting to WebSocket:', WS_URL);
    const ws = new WebSocket(WS_URL);

    ws.onopen = () => {
      console.log('✅ WebSocket connected');
      setIsConnected(true);
      reconnectAttempts.current = 0;
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('📨 WebSocket message:', data);

        if (data.type === 'message' && data.payload) {
          const msg = data.payload;
          console.log('💬 Message payload:', msg);
          
          // Add message to the stream's messages
          setMessages(prev => ({
            ...prev,
            [data.connectionId]: [
              ...(prev[data.connectionId] || []),
              {
                id: msg.id || `${Date.now()}-${Math.random()}`,
                username: msg.username || msg.author || 'Anonymous',
                text: msg.text || msg.message || '',
                timestamp: msg.timestamp || Date.now(),
                color: msg.color || generateColor(msg.username || 'Anonymous'),
                platform: msg.platform || 'unknown',
                reactions: { like: 0, dislike: 0 },
                isBookmarked: false,
                userReaction: null
              }
            ]
          }));
        } else if (data.type === 'stream_info') {
          // Update stream info
          setStreams(prev => prev.map(s => 
            s.connectionId === data.connectionId 
              ? { ...s, viewers: data.viewers, isLive: data.isLive }
              : s
          ));
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    ws.onerror = (error) => {
      console.error('❌ WebSocket error:', error);
    };

    ws.onclose = () => {
      console.log('🔌 WebSocket disconnected');
      setIsConnected(false);
      wsRef.current = null;

      // Attempt to reconnect
      if (reconnectAttempts.current < MAX_RECONNECT_ATTEMPTS) {
        const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000);
        console.log(`Reconnecting in ${delay}ms... (attempt ${reconnectAttempts.current + 1}/${MAX_RECONNECT_ATTEMPTS})`);
        reconnectTimeoutRef.current = setTimeout(() => {
          reconnectAttempts.current++;
          connect();
        }, delay);
      } else {
        console.error('Max reconnection attempts reached');
      }
    };

    wsRef.current = ws;
  }, []);

  // Disconnect WebSocket
  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setIsConnected(false);
  }, []);

  // Add stream
  const addStream = useCallback(async (url) => {
    try {
      const response = await fetch(`${API_URL}/api/v1/connect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ streamUrl: url })
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: response.statusText }));
        console.error('❌ Backend error:', error);
        const errorMessage = error.error?.message || error.message || error.error || 'Failed to connect to stream';
        throw new Error(errorMessage);
      }

      const data = await response.json();
      console.log('✅ Stream connected:', data);

      // Add stream to state
      const newStream = {
        id: data.connection.id,
        connectionId: data.connection.id,
        platform: data.connection.platform,
        channel: data.connection.channel,
        title: data.connection.channel || `${data.connection.platform} Stream`,
        isLive: true,
        viewers: 0,
        messageCount: 0,
        url: url
      };

      // Check if stream already exists (prevent duplicates)
      setStreams(prev => {
        const exists = prev.find(s => s.connectionId === data.connection.id);
        if (exists) {
          console.log('Stream already exists, skipping duplicate');
          return prev;
        }
        return [...prev, newStream];
      });
      
      setMessages(prev => ({ ...prev, [data.connection.id]: [] }));

      // Subscribe to WebSocket updates
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({
          type: 'subscribe',
          connectionId: data.connection.id
        }));
      }

      return newStream;
    } catch (error) {
      console.error('Error adding stream:', error);
      throw error;
    }
  }, []);

  // Remove stream
  const removeStream = useCallback(async (streamId) => {
    try {
      // Get stream from current state
      let streamToRemove = null;
      setStreams(prev => {
        streamToRemove = prev.find(s => s.id === streamId);
        return prev;
      });

      if (!streamToRemove) return;

      // Unsubscribe from WebSocket
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({
          type: 'unsubscribe',
          connectionId: streamToRemove.connectionId
        }));
      }

      // Disconnect from backend
      const disconnectResponse = await fetch(`${API_URL}/api/v1/connect/disconnect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ connectionId: streamToRemove.connectionId })
      });
      
      if (disconnectResponse.ok) {
        console.log('✅ Stream disconnected from backend');
      } else {
        console.error('❌ Failed to disconnect stream from backend');
      }

      // Remove from state
      setStreams(prev => prev.filter(s => s.id !== streamId));
      setMessages(prev => {
        const newMessages = { ...prev };
        delete newMessages[streamToRemove.connectionId];
        return newMessages;
      });
    } catch (error) {
      console.error('Error removing stream:', error);
    }
  }, []);

  // Connect on mount
  useEffect(() => {
    connect();
    return () => disconnect();
  }, [connect, disconnect]);

  // Update message count
  useEffect(() => {
    setStreams(prev => prev.map(stream => ({
      ...stream,
      messageCount: messages[stream.connectionId]?.length || 0
    })));
  }, [messages]);

  return {
    isConnected,
    streams,
    messages,
    addStream,
    removeStream,
    connect,
    disconnect
  };
};

// Helper function to generate color from username
function generateColor(username) {
  const colors = [
    '#4CC9F0', '#7209B7', '#F72585', '#4361EE', '#3A0CA3',
    '#06FFA5', '#FFBE0B', '#FB5607', '#FF006E', '#8338EC'
  ];
  let hash = 0;
  for (let i = 0; i < username.length; i++) {
    hash = username.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

