import { useEffect } from 'react';
import { useWebSocket } from '@shared/hooks';
import { useStreamsStore } from '../store/streamsStore';
import { useChatStore } from '../../chat/store/chatStore';

/**
 * StreamSubscriptionManager
 * Automatically subscribes to active streams via WebSocket
 * and handles incoming messages
 */
const StreamSubscriptionManager = () => {
  const { subscribe, unsubscribe, on, off, isConnected } = useWebSocket();
  const activeStreams = useStreamsStore((state) => state.activeStreams);
  const addMessage = useChatStore((state) => state.addMessage);

  useEffect(() => {
    if (!isConnected) return;

    // Subscribe to all active streams using connectionId for WebSocket
    activeStreams.forEach((stream) => {
      if (stream.connectionId) {
        subscribe(stream.connectionId);
      }
    });

    // Cleanup: unsubscribe from all streams
    return () => {
      activeStreams.forEach((stream) => {
        if (stream.connectionId) {
          unsubscribe(stream.connectionId);
        }
      });
    };
  }, [isConnected, activeStreams, subscribe, unsubscribe]);

  useEffect(() => {
    // Listen for incoming messages
    const handleMessage = (data) => {
      // Data format: { connectionId, message }
      // where message is the payload from backend
      if (data && data.message && data.connectionId) {
        // Find stream by connectionId to get stable streamId
        const stream = activeStreams.find(s => s.connectionId === data.connectionId);
        if (!stream) {
          return;
        }
        
        // Add streamId to message before storing (use stable stream.id)
        const messageWithStreamId = {
          ...data.message,
          streamId: stream.id, // Use stable stream.id instead of connectionId
          timestamp: new Date(data.message.timestamp), // Convert string to Date if needed
          isQuestion: data.message.isQuestion || false, // Ensure isQuestion is preserved
        };
        
        addMessage(messageWithStreamId);
      }
    };

    on('message', handleMessage);

    return () => {
      off('message', handleMessage);
    };
  }, [on, off, addMessage, activeStreams]);

  return null; // This component doesn't render anything
};

export default StreamSubscriptionManager;

