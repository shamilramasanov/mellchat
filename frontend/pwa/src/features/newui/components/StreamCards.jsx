import { memo } from 'react';
import { StreamCard } from './StreamCard.jsx';
import { useStreamsStore } from '@features/streams/store/streamsStore';

function StreamCardsBase({ streams, activeStreamId, onStreamSelect, onCollapseClick, onCloseClick, onMessagesClick, onQuestionsClick }) {
  const collapsedStreamIds = useStreamsStore((s) => s.collapsedStreamIds) || [];
  const closedStreamIds = useStreamsStore((s) => s.closedStreamIds) || [];
  
  console.log('🎴 StreamCards render:', {
    streamsCount: streams.length,
    collapsedCount: collapsedStreamIds.length,
    closedCount: closedStreamIds.length,
    collapsedStreamIds,
    closedStreamIds,
    streamIds: streams.map(s => s.id)
  });
  
  // Показываем активный всегда; остальные — только не свёрнутые и не закрытые
  const visibleStreams = streams.filter(s => (
    s.id === activeStreamId || (!collapsedStreamIds.includes(s.id) && !closedStreamIds.includes(s.id))
  ));
  
  console.log('🎴 Visible streams after filter:', visibleStreams.length, visibleStreams.map(s => s.id));
  
  if (visibleStreams.length === 0) {
    console.log('⚠️ No visible streams, returning null');
    return null;
  }
  return (
    <div className="sticky top-12 z-40 w-full overflow-x-auto hide-scrollbar bg-white border-b border-gray-300 px-4 py-3 shadow-[0_4px_12px_rgba(0,0,0,0.08)]">
      <div className="flex gap-3">
        {visibleStreams.map(stream => (
          <StreamCard
            key={stream.id}
            stream={stream}
            isActive={stream.id === activeStreamId}
            onClick={() => onStreamSelect(stream.id)}
            onCollapseClick={() => onCollapseClick(stream.id)}
            onCloseClick={onCloseClick ? () => onCloseClick(stream.id) : undefined}
            onMessagesClick={onMessagesClick ? () => onMessagesClick(stream.id) : undefined}
            onQuestionsClick={onQuestionsClick ? () => onQuestionsClick(stream.id) : undefined}
          />
        ))}
      </div>
    </div>
  );
}

export const StreamCards = memo(StreamCardsBase);


