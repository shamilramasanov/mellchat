import { useState } from 'react';
import { X, Sparkles, Send, Loader2 } from 'lucide-react';

export function AIFilterModal({ isOpen, onClose, onFilter, isLoading }) {
  const [query, setQuery] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (query.trim() && !isLoading) {
      onFilter(query.trim());
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Sparkles className="h-5 w-5 text-purple-500" />
            <h2 className="text-lg font-semibold text-black">AI Фильтр чата</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-gray-100 text-gray-600"
            disabled={isLoading}
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <p className="text-sm text-gray-600 mb-4">
          Введите запрос, и AI выберет самые подходящие сообщения из чата.
          <br />
          <span className="text-xs text-gray-500 mt-1 block">
            Например: "5 самых интересных вопросов", "сообщения про настройки мыши", "топ 10 важных сообщений"
          </span>
        </p>

        <form onSubmit={handleSubmit}>
          <textarea
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Введите запрос для AI..."
            className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none resize-none text-black placeholder-gray-400"
            rows={3}
            disabled={isLoading}
            autoFocus
          />
          
          <div className="flex items-center justify-end space-x-2 mt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              disabled={isLoading}
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={!query.trim() || isLoading}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Анализ...</span>
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  <span>Применить</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

