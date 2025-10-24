import { useState } from 'react';
import { useStreamsStore } from '@features/streams/store/streamsStore';
import StreamCards from '@features/streams/components/StreamCards';
import RecentStreams from '@features/streams/components/RecentStreams';
import ChatContainer from '@features/chat/components/ChatContainer';
import AddStreamModal from '@features/streams/components/AddStreamModal';
import { useSwipe } from '@shared/hooks';
import './MainView.css';

const MainView = () => {
  const activeStreamId = useStreamsStore((state) => state.activeStreamId);
  const activeStreams = useStreamsStore((state) => state.activeStreams);
  const setActiveStream = useStreamsStore((state) => state.setActiveStream);
  const [showAddStream, setShowAddStream] = useState(false);
  
  // If no active stream selected, show home page with all streams
  // Otherwise show chat view with stream cards on top
  const isHome = activeStreamId === null;
  
  // Swipe navigation between chats
  const handleSwipeLeft = () => {
    if (!activeStreamId || activeStreams.length <= 1) return;
    
    const currentIndex = activeStreams.findIndex(s => s.id === activeStreamId);
    const nextIndex = (currentIndex + 1) % activeStreams.length;
    setActiveStream(activeStreams[nextIndex].id);
  };
  
  const handleSwipeRight = () => {
    if (!activeStreamId || activeStreams.length <= 1) return;
    
    const currentIndex = activeStreams.findIndex(s => s.id === activeStreamId);
    const prevIndex = currentIndex === 0 ? activeStreams.length - 1 : currentIndex - 1;
    setActiveStream(activeStreams[prevIndex].id);
  };
  
  const swipeHandlers = useSwipe({
    onSwipeLeft: handleSwipeLeft,
    onSwipeRight: handleSwipeRight,
    minSwipeDistance: 50,
  });

  return (
    <>
      <main className="main-view">
        {isHome ? (
          // Home View - Show all active/recent streams
          <RecentStreams />
        ) : (
          // Chat View - Show stream cards + chat
          <>
            {/* Stream Cards */}
            <div className="main-view__streams">
              <StreamCards />
            </div>

            {/* Chat Container with Swipe Navigation */}
            <div className="main-view__chat" {...swipeHandlers}>
              <ChatContainer onAddStream={() => setShowAddStream(true)} />
            </div>
          </>
        )}
      </main>

      {/* Add Stream Modal */}
      <AddStreamModal 
        isOpen={showAddStream}
        onClose={() => setShowAddStream(false)}
      />
    </>
  );
};

export default MainView;

