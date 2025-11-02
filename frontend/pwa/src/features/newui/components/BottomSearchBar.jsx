import { memo, useMemo, useState, useEffect } from 'react';
import debounce from 'lodash.debounce';
import { useTranslation } from 'react-i18next';
import { Search, Plus, Sparkles, Filter, MessageSquare, Smile, Check } from 'lucide-react';
import { useChatStore } from '@features/chat/store/chatStore';
import { useAuthStore } from '@features/auth/store/authStore';

function BottomSearchBarBase({ searchQuery, onSearchChange, onAddStream, onSettingsClick, searchPlaceholder, activeFilter, onFilterChange, onAIClick }) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const { t } = useTranslation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [localQuery, setLocalQuery] = useState(searchQuery || '');
  const moodEnabled = useChatStore(state => state.moodEnabled);
  const toggleMoodEnabled = useChatStore(state => state.toggleMoodEnabled);

  useEffect(() => {
    setLocalQuery(searchQuery || '');
  }, [searchQuery]);

  const debouncedChange = useMemo(() => debounce((value) => {
    onSearchChange(value);
  }, 250), [onSearchChange]);

  const handleInputChange = (e) => {
    const value = e.target.value;
    setLocalQuery(value);
    debouncedChange(value);
  };

  useEffect(() => () => debouncedChange.cancel(), [debouncedChange]);

  const handleCallAI = () => {
    onAIClick?.(); // Открываем модальное окно AI
    setIsMenuOpen(false);
  };

  const handleToggleQuestionsOnly = () => {
    // Если фильтр уже активен - деактивируем, иначе активируем
    if (activeFilter === 'questions') {
      onFilterChange?.(null);
    } else {
      onFilterChange?.('questions');
    }
    setIsMenuOpen(false);
  };

  const handleToggleAllQuestions = () => {
    // Если фильтр уже активен - деактивируем, иначе активируем
    if (activeFilter === 'allQuestions') {
      onFilterChange?.(null);
    } else {
      onFilterChange?.('allQuestions');
    }
    setIsMenuOpen(false);
  };

  const handleMoods = () => {
    toggleMoodEnabled(); // Переключаем фильтр настроения
    setIsMenuOpen(false);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-300 p-3 z-20 shadow-[0_-4px_12px_rgba(0,0,0,0.08)]">
      <div className="flex items-center space-x-2">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-600" />
          <input
            type="text"
            value={localQuery}
            onChange={handleInputChange}
            placeholder={searchPlaceholder || t('newui.searchMessagesPlaceholder')}
            className="w-full pl-10 pr-4 py-2.5 rounded-full border-2 border-gray-300 focus:border-black focus:outline-none text-black placeholder-gray-600 text-sm bg-white"
          />
        </div>
        <div className="relative">
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className={`ripple p-2.5 rounded-full transition-all ${isMenuOpen ? 'bg-black text-white rotate-45' : 'bg-gray-200 text-black hover:bg-gray-300'}`}
            aria-label="Меню быстрых действий"
          >
            <Plus className="h-5 w-5" />
          </button>
          {isMenuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setIsMenuOpen(false)} />
              <div className="absolute bottom-full right-0 mb-2 bg-white rounded-lg elevation-3 border border-gray-300 overflow-hidden z-20 min-w-[240px]">
                {/* Кнопка AI показывается только для авторизованных пользователей */}
                {isAuthenticated && (
                  <button
                    onClick={handleCallAI}
                    className={`ripple w-full flex items-center space-x-3 px-4 py-3 transition-colors border-2 border-b ${
                      activeFilter === 'ai'
                        ? 'bg-purple-100 text-purple-700 border-purple-300 font-semibold'
                        : 'bg-white text-black border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    <Sparkles className="h-4 w-4 text-purple-500" />
                    <span className="text-sm">AI</span>
                    {activeFilter === 'ai' && <Check className="h-4 w-4 text-purple-600 ml-auto" />}
                  </button>
                )}
                <button onClick={() => { onAddStream(); setIsMenuOpen(false); }} className="ripple w-full flex items-center space-x-3 px-4 py-3 hover:bg-gray-100 transition-colors text-black border-b border-gray-200">
                  <Plus className="h-4 w-4 text-blue-500" />
                  <span className="text-sm">{t('newui.addStream')}</span>
                </button>
                <button 
                  onClick={handleToggleQuestionsOnly} 
                  className={`ripple w-full flex items-center space-x-3 px-4 py-3 transition-colors border-2 border-b ${
                    activeFilter === 'questions'
                      ? 'bg-orange-100 text-orange-700 border-orange-300 font-semibold'
                      : 'bg-white text-black border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  <MessageSquare className="h-4 w-4 text-orange-500" />
                  <span className="text-sm">{t('filters.questions')}</span>
                  {activeFilter === 'questions' && <Check className="h-4 w-4 text-orange-600 ml-auto" />}
                </button>
                <button 
                  onClick={handleToggleAllQuestions} 
                  className={`ripple w-full flex items-center space-x-3 px-4 py-3 transition-colors border-2 border-b ${
                    activeFilter === 'allQuestions'
                      ? 'bg-green-100 text-green-700 border-green-300 font-semibold'
                      : 'bg-white text-black border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  <Filter className="h-4 w-4 text-green-500" />
                  <span className="text-sm">{t('filters.allQuestions')}</span>
                  {activeFilter === 'allQuestions' && <Check className="h-4 w-4 text-green-600 ml-auto" />}
                </button>
                <button
                  onClick={handleMoods}
                  className={`ripple w-full flex items-center space-x-3 px-4 py-3 transition-colors border-2 border-b ${
                    moodEnabled
                      ? 'bg-pink-100 text-pink-700 border-pink-300 font-semibold'
                      : 'bg-white text-black border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  <Smile className="h-4 w-4 text-pink-500" />
                  <span className="text-sm">Moods</span>
                  {moodEnabled && <Check className="h-4 w-4 text-pink-600 ml-auto" />}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export const BottomSearchBar = memo(BottomSearchBarBase);


