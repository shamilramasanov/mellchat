import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useChatStore } from '../store/chatStore';
import { useStreamsStore } from '@features/streams/store/streamsStore';
import { useDebounce } from '@shared/hooks';
import { FILTERS, SORT_OPTIONS } from '@shared/utils/constants';
import './Filters.css';

const Filters = () => {
  const { t } = useTranslation();
  const activeFilter = useChatStore((state) => state.activeFilter);
  const setFilter = useChatStore((state) => state.setFilter);
  const sortBy = useChatStore((state) => state.sortBy);
  const setSortBy = useChatStore((state) => state.setSortBy);
  const setSearchQuery = useChatStore((state) => state.setSearchQuery);
  
  // Get active stream ID
  const activeStreamId = useStreamsStore((state) => state.activeStreamId);
  
  // Subscribe to messages so component re-renders when messages change
  const messages = useChatStore((state) => state.messages);
  const getStreamStats = useChatStore((state) => state.getStreamStats);
  
  const [search, setSearch] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const debouncedSearch = useDebounce(search, 150); // Уменьшаем время debounce для более быстрого отклика

  // Update search in store
  useEffect(() => {
    setIsSearching(true);
    setSearchQuery(debouncedSearch);
    
    // Reset searching state after a short delay
    const timer = setTimeout(() => {
      setIsSearching(false);
    }, 100);
    
    return () => clearTimeout(timer);
  }, [debouncedSearch, setSearchQuery]);

  // Get stats ONLY for active stream
  const streamStats = activeStreamId ? getStreamStats(activeStreamId) : { messageCount: 0, questionCount: 0, unreadCount: 0, unreadQuestionCount: 0 };
  const totalMessages = streamStats.unreadCount; // Show unread messages count
  const totalQuestions = streamStats.unreadQuestionCount; // Show unread questions count

  const filters = [
    { id: FILTERS.ALL, label: t('filters.all'), count: totalMessages },
    { id: FILTERS.QUESTIONS, label: t('filters.questions'), count: totalQuestions },
    { id: FILTERS.ALL_QUESTIONS, label: t('filters.allQuestions') },
    { id: FILTERS.SPAM, label: t('filters.spam') },
    { id: FILTERS.BOOKMARKS, label: t('filters.bookmarks') },
  ];

  const sorts = [
    { id: SORT_OPTIONS.TIME, label: t('sort.time') },
    { id: SORT_OPTIONS.POPULAR, label: t('sort.popular') },
    { id: SORT_OPTIONS.ACTIVE, label: t('sort.active') },
  ];

  const showSort = activeFilter === FILTERS.QUESTIONS || activeFilter === FILTERS.ALL_QUESTIONS;

  return (
    <div className="filters">
      {/* Sort (only for Questions) */}
      {showSort && (
        <div className="filters__sort">
          {sorts.map((sort) => (
            <button
              key={sort.id}
              className={`filters__sort-btn ${sortBy === sort.id ? 'filters__sort-btn--active' : ''}`}
              onClick={() => setSortBy(sort.id)}
            >
              <span>{sort.label}</span>
            </button>
          ))}
        </div>
      )}

      {/* Filter Buttons */}
      <div className="filters__buttons">
        {filters.map((filter) => (
          <button
            key={filter.id}
            className={`filters__btn ${activeFilter === filter.id ? 'filters__btn--active' : ''}`}
            onClick={() => setFilter(filter.id)}
          >
            <span>{filter.label}</span>
            {filter.count !== undefined && <span className="filters__btn-count">{filter.count}</span>}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="filters__search">
        <input
          type="text"
          className="filters__search-input"
          placeholder={t('chat.searchPlaceholder')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <span className="filters__search-icon">
          {isSearching ? '⏳' : '🔍'}
        </span>
      </div>
    </div>
  );
};

export default Filters;

