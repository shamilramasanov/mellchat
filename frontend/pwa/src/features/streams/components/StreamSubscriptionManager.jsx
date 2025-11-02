import { useEffect, useRef } from 'react';
import { useWebSocketContext } from '@shared/components/WebSocketProvider';
import { useStreamsStore } from '../store/streamsStore';
import { useChatStore } from '../../chat/store/chatStore';
import { authAPI } from '@shared/services/api';
import { STORAGE_KEYS } from '@shared/utils/constants';

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

    // Получаем connectionIds ТОЛЬКО из activeStreams (не из recentStreams!)
    const activeConnectionIds = activeStreams
      .map(s => s.connectionId)
      .filter(Boolean);

    if (activeConnectionIds.length > 0) {
      console.log(`📡 StreamSubscriptionManager: Subscribing to ${activeConnectionIds.length} connections:`, activeConnectionIds);
    }

    // Подписываемся только на активные стримы
    const subscribeTimeout = setTimeout(() => {
      activeConnectionIds.forEach(connectionId => {
        subscribe(connectionId);
      });
    }, isConnected ? 500 : 2000);

    // При размонтировании или изменении - отписываемся от старых подписок
    return () => {
      clearTimeout(subscribeTimeout);
      // Отписываемся от всех connectionIds, которые больше не активны
      activeConnectionIds.forEach(connectionId => {
        unsubscribe(connectionId);
      });
    };
  }, [isConnected, activeStreams, subscribe, unsubscribe]);

  useEffect(() => {
    // Listen for incoming messages
    const handleMessage = (data) => {
      // Data format: { connectionId, message }
      if (!data || !data.message || !data.connectionId) {
        console.warn('⚠️ StreamSubscriptionManager: Invalid message format:', data);
        return;
      }

        // Find stream by connectionId сначала в activeStreams, потом в recentStreams
        let stream = activeStreamsRef.current.find(s => s.connectionId === data.connectionId);
        if (!stream) {
          stream = recentStreamsRef.current.find(s => s.connectionId === data.connectionId);
        }
      if (!stream) return; // stream already removed

      const raw = data.message;

      // Normalize payload from backend to UI schema
      const normalizedText = raw.text || raw.content || raw.message || '';
      const normalizedId = raw.id || raw.messageId || raw._id || `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const normalizedUser = raw.username || raw.userName || raw.user?.displayName || raw.author || raw.sender || 'unknown';
      const normalizedPlatform = raw.platform || stream.platform;
      const ts = raw.timestamp || raw.createdAt || raw.time || raw.ts;
      const normalizedTimestamp = ts ? new Date(Number(ts) || ts) : new Date();
      const normalizedIsQuestion = raw.isQuestion ?? /\?/.test(normalizedText);

      if (!normalizedText) return; // ignore empty

        const messageWithStreamId = {
        id: normalizedId,
        streamId: stream.id,
        platform: normalizedPlatform,
        username: normalizedUser,
        text: normalizedText,
        timestamp: normalizedTimestamp,
        isQuestion: Boolean(normalizedIsQuestion),
        };
        
        console.log('📨 StreamSubscriptionManager: Adding message for stream:', stream.id, {
          messageId: messageWithStreamId.id,
          text: messageWithStreamId.text?.substring(0, 50),
          isRecent: !activeStreamsRef.current.find(s => s.connectionId === data.connectionId)
        });
        
        addMessage(messageWithStreamId);
        
        // Логируем активность просмотра сообщения
        if (stream.connectionId) {
          const sessionId = localStorage.getItem(STORAGE_KEYS.GUEST_SESSION_ID);
          authAPI.logActivity({
            streamId: stream.connectionId,
            platform: normalizedPlatform,
            channelName: stream.channelName || stream.name,
            action: 'view_message',
            metadata: {
              messageId: normalizedId,
              streamId: stream.id
            }
          }).catch(() => {}); // Игнорируем ошибки
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

