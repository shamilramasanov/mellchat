import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useChatStore } from '../store/chatStore';
import './SearchBar.css';

const SearchBar = ({ onSearch, placeholder, onAddStream }) => {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const loading = useChatStore((s) => s.loading);
  const searchResults = useChatStore((s) => s.searchResults);
  const searchTimeout = useChatStore((s) => s.searchTimeout);
  
  // Определяем состояние поиска
  const isSearchPending = searchTimeout !== null && !loading;

  const handleChange = useCallback((e) => {
    const value = e.target.value;
    setQuery(value);
    onSearch(value); // Вызываем поиск при каждом изменении
  }, [onSearch]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSearch(query);
  };

  const handleClear = () => {
    setQuery('');
    onSearch('');
  };

  return (
    <form className="search-bar" onSubmit={handleSubmit}>
      <div className="search-bar__content">
        <div className="search-bar__input-wrapper">
          <input
            type="text"
            className="search-bar__input"
            placeholder={placeholder || t('search.placeholder')}
            value={query}
            onChange={handleChange}
            disabled={loading}
          />
          
          {/* Индикатор загрузки */}
          {loading && (
            <div className="search-bar__loading">
              <div className="search-bar__spinner"></div>
            </div>
          )}
          
          {/* Индикатор ожидания поиска */}
          {isSearchPending && (
            <div className="search-bar__pending" title="Ожидание завершения ввода...">
              ⏳
            </div>
          )}
          
          {/* Индикатор результатов поиска */}
          {searchResults && !loading && !isSearchPending && (
            <div className="search-bar__results-indicator" title="Показаны результаты поиска">
              🔍
            </div>
          )}
          
          {/* Кнопка очистки */}
          {query && !loading && (
            <button
              type="button"
              className="search-bar__clear"
              onClick={handleClear}
              title={t('search.clear')}
            >
              ✕
            </button>
          )}
        </div>
        
        {/* Кнопка добавления стрима */}
        <button
          type="button"
          className="search-bar__add-button"
          onClick={onAddStream}
          aria-label={t('chat.addStream')}
        >
          ➕
        </button>
      </div>
    </form>
  );
};

export default SearchBar;
