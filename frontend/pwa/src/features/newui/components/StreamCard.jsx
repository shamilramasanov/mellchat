import { memo, useCallback } from 'react';
import { MessageCircle, HelpCircle, Minimize2, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

function StreamCardBase({ stream, isActive, onClick, onMessagesClick, onQuestionsClick, onCollapseClick, onCloseClick }) {
  const { t } = useTranslation();
  const platformBorder = {
    twitch: 'border-purple-400',
    youtube: 'border-red-400',
    kick: 'border-lime-400',
  }[stream.platform] || 'border-gray-300';

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick?.();
    }
  }, [onClick]);
  const platformIcons = {
    twitch: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6 text-purple-500">
        <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714Z"/>
      </svg>
    ),
    youtube: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6 text-red-500">
        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
      </svg>
    ),
    kick: (
      <svg viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg" fillRule="evenodd" clipRule="evenodd" strokeLinejoin="round" strokeMiterlimit="2" className="h-6 w-6 text-green-500">
        <path d="M37 .036h164.448v113.621h54.71v-56.82h54.731V.036h164.448v170.777h-54.73v56.82h-54.711v56.8h54.71v56.82h54.73V512.03H310.89v-56.82h-54.73v-56.8h-54.711v113.62H37V.036z" fill="currentColor"/>
      </svg>
    ),
  };

  const handleAuthorClick = (e) => {
    e.stopPropagation();
    window.open(stream.url, '_blank');
  };

  return (
    <div
      className={`flex-shrink-0 w-[184px] h-28 rounded-lg transition-all elevation-2 cursor-pointer border-2 ${
        isActive ? `bg-gray-100 border-black` : `bg-white ${platformBorder} hover:border-gray-400`
      }`}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={handleKeyDown}
    >
      <div className="p-3 h-full flex flex-col">
        <div className="flex items-start justify-between mb-1">
          <button
            onClick={handleAuthorClick}
            className="flex items-center space-x-2 hover:opacity-80 transition-opacity cursor-pointer"
            title={`Открыть ${stream.platform} стрим`}
            aria-label={`Открыть ${stream.platform} стрим`}
          >
            {platformIcons[stream.platform]}
          </button>
          <div className="flex items-center space-x-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onCollapseClick();
              }}
              className="ripple p-1 rounded-full hover:bg-gray-200 transition-colors text-black"
              aria-label="Collapse"
            >
              <Minimize2 className="h-3 w-3" />
            </button>
            {onCloseClick && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onCloseClick();
                }}
                className="ripple p-1 rounded-full hover:bg-red-100 hover:text-red-600 transition-colors text-black"
                aria-label="Close"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
        </div>
        <div className="text-left text-black mb-2 text-sm">
          <span className="truncate">{stream.authorName}</span>
        </div>
        <div className="flex space-x-2 mt-auto">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onMessagesClick();
            }}
            className="ripple flex items-center space-x-1 px-2 py-1.5 rounded-md bg-gray-200 hover:bg-gray-300 transition-colors flex-1 text-black text-sm"
            title={t('chat.newMessages')}
            aria-label={t('chat.newMessages')}
          >
            <MessageCircle className="h-3 w-3" />
            <span>{stream.unreadMessages}</span>
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onQuestionsClick();
            }}
            className="ripple flex items-center space-x-1 px-2 py-1.5 rounded-md bg-gray-200 hover:bg-gray-300 transition-colors flex-1 text-black text-sm"
            title={t('filters.questions')}
            aria-label={t('filters.questions')}
          >
            <HelpCircle className="h-3 w-3" />
            <span>{stream.unreadQuestions}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export const StreamCard = memo(StreamCardBase);


