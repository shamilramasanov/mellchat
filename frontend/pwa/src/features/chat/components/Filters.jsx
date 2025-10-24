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
  const debouncedSearch = useDebounce(search, 300);

  // Update search in store
  useEffect(() => {
    setSearchQuery(debouncedSearch);
  }, [debouncedSearch, setSearchQuery]);

  // Get stats ONLY for active stream
  const streamStats = activeStreamId ? getStreamStats(activeStreamId) : { messageCount: 0, questionCount: 0 };
  const totalMessages = streamStats.messageCount;
  const totalQuestions = streamStats.questionCount;

  const filters = [
    { id: FILTERS.ALL, label: t('filters.all'), icon: '', count: totalMessages },
    { id: FILTERS.QUESTIONS, label: t('filters.questions'), icon: '❓', count: totalQuestions },
    { id: FILTERS.ALL_QUESTIONS, label: t('filters.allQuestions'), icon: '🌐' },
    { id: FILTERS.SPAM, label: t('filters.spam'), icon: '🚫' },
    { id: FILTERS.BOOKMARKS, label: t('filters.bookmarks'), icon: '🔖' },
  ];

  const sorts = [
    { id: SORT_OPTIONS.TIME, label: t('sort.time'), icon: '🕒' },
    { id: SORT_OPTIONS.POPULAR, label: t('sort.popular'), icon: '🔥' },
    { id: SORT_OPTIONS.ACTIVE, label: t('sort.active'), icon: '💬' },
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
              <span>{sort.icon}</span>
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
            {filter.icon && <span>{filter.icon}</span>}
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
        <span className="filters__search-icon">🔍</span>
      </div>
    </div>
  );
};

export default Filters;

