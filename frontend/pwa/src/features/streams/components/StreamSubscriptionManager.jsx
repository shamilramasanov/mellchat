import { useEffect, useRef } from 'react';
import { useWebSocketContext } from '@shared/components/WebSocketProvider';
import { useStreamsStore } from '../store/streamsStore';
import { useChatStore } from '../../chat/store/chatStore';

/**
 * StreamSubscriptionManager
 * Automatically subscribes to active streams via WebSocket
 * and handles incoming messages
 */
const StreamSubscriptionManager = () => {
  const { subscribe, unsubscribe, on, off, isConnected } = useWebSocketContext();
  const activeStreams = useStreamsStore((state) => state.activeStreams);
  const addMessage = useChatStore((state) => state.addMessage);
  const activeStreamsRef = useRef(activeStreams);

  // Всегда держим актуальный список activeStreams
  useEffect(() => {
    activeStreamsRef.current = activeStreams;
  }, [activeStreams]);

  useEffect(() => {
    if (!isConnected) {
      return;
    }

    if (activeStreams.length === 0) {
      return;
    }

    // Получаем все connectionIds из activeStreams
    const connectionIds = activeStreams
      .map(s => s.connectionId)
      .filter(Boolean);

    // Подписываемся на все стримы
    connectionIds.forEach(connectionId => {
      subscribe(connectionId);
    });

    // НЕ отписываемся - подписки управляются через unsubscribe() в других местах
    return () => {
      // Ничего не делаем - подписки сохраняются
    };
  }, [isConnected, activeStreams, subscribe]);

  useEffect(() => {
    // Listen for incoming messages
    const handleMessage = (data) => {
      // Data format: { connectionId, message }
      // where message is the payload from backend
      if (data && data.message && data.connectionId) {
        // Find stream by connectionId to get stable streamId
        const stream = activeStreamsRef.current.find(s => s.connectionId === data.connectionId);
        
        if (!stream) {
          // Silently ignore messages for removed streams
          return;
        }
        
        // Add streamId to message before storing (use stable stream.id)
        const messageWithStreamId = {
          ...data.message,
          streamId: stream.id, // Use stable stream.id instead of connectionId
          timestamp: new Date(data.message.timestamp), // Convert string to Date if needed
          isQuestion: data.message.isQuestion || false, // Ensure isQuestion is preserved
        };
        
        console.log('📨 StreamSubscriptionManager: Adding message for stream:', stream.id, {
          messageId: messageWithStreamId.id,
          text: messageWithStreamId.text?.substring(0, 50)
        });
        
        addMessage(messageWithStreamId);
      } else {
        console.warn('⚠️ StreamSubscriptionManager: Invalid message format:', data);
      }
    };

    on('message', handleMessage);

    return () => {
      off('message', handleMessage);
    };
  }, [on, off, addMessage]);

  return null; // This component doesn't render anything
};

export default StreamSubscriptionManager;

