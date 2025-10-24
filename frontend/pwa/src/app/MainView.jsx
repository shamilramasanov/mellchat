import { useState } from 'react';
import { useStreamsStore } from '@features/streams/store/streamsStore';
import StreamCards from '@features/streams/components/StreamCards';
import RecentStreams from '@features/streams/components/RecentStreams';
import ChatContainer from '@features/chat/components/ChatContainer';
import AddStreamModal from '@features/streams/components/AddStreamModal';
import './MainView.css';

const MainView = () => {
  const activeStreamId = useStreamsStore((state) => state.activeStreamId);
  const [showAddStream, setShowAddStream] = useState(false);
  
  // If no active stream selected, show home page with all streams
  // Otherwise show chat view with stream cards on top
  const isHome = activeStreamId === null;

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

            {/* Chat Container */}
            <div className="main-view__chat">
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

