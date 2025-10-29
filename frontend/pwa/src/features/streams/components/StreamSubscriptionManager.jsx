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
  const recentStreams = useStreamsStore((state) => state.recentStreams);
  const addMessage = useChatStore((state) => state.addMessage);
  const activeStreamsRef = useRef(activeStreams);
  const recentStreamsRef = useRef(recentStreams);

  // Всегда держим актуальный список стримов
  useEffect(() => {
    activeStreamsRef.current = activeStreams;
  }, [activeStreams]);

  useEffect(() => {
    recentStreamsRef.current = recentStreams;
  }, [recentStreams]);

  useEffect(() => {
    if (!isConnected) {
      return;
    }

    // Получаем все connectionIds из activeStreams И recentStreams
    const activeConnectionIds = activeStreams
      .map(s => s.connectionId)
      .filter(Boolean);

    const recentConnectionIds = recentStreams
      .map(s => s.connectionId)
      .filter(Boolean);

    // Объединяем и убираем дубликаты
    const allConnectionIds = [...new Set([...activeConnectionIds, ...recentConnectionIds])];

    if (allConnectionIds.length > 0) {
      console.log(`📡 StreamSubscriptionManager: Subscribing to ${allConnectionIds.length} connections:`, allConnectionIds);
    }

    // Подписываемся на все стримы (из activeStreams и recentStreams)
    // Используем небольшую задержку для первого подключения, чтобы дать время восстановлению
    const subscribeTimeout = setTimeout(() => {
      allConnectionIds.forEach(connectionId => {
        subscribe(connectionId);
      });
    }, isConnected ? 500 : 2000); // Если уже подключен, ждем меньше

    return () => {
      clearTimeout(subscribeTimeout);
    };
  }, [isConnected, activeStreams, recentStreams, subscribe]);

  useEffect(() => {
    // Listen for incoming messages
    const handleMessage = (data) => {
      // Data format: { connectionId, message }
      // where message is the payload from backend
      if (data && data.message && data.connectionId) {
        // Find stream by connectionId сначала в activeStreams, потом в recentStreams
        let stream = activeStreamsRef.current.find(s => s.connectionId === data.connectionId);
        if (!stream) {
          stream = recentStreamsRef.current.find(s => s.connectionId === data.connectionId);
        }
        
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
          text: messageWithStreamId.text?.substring(0, 50),
          isRecent: !activeStreamsRef.current.find(s => s.connectionId === data.connectionId)
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

