import { useState } from 'react';
import { X, ArrowLeft, Minimize2, Maximize2 } from 'lucide-react';
import { BottomSearchBar } from '../components/BottomSearchBar.jsx';
import { useTranslation } from 'react-i18next';
import { useStreamsStore } from '@features/streams/store/streamsStore';

export function RecentStreamsScreen({ streams, onBack, onStreamSelect, onStreamDelete, onStreamClose, onAddStream }) {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const platformIcons = {
    twitch: (<svg viewBox="0 0 24 24" fill="currentColor" className="h-8 w-8 text-purple-500"><path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714Z"/></svg>),
    youtube: (<svg viewBox="0 0 24 24" fill="currentColor" className="h-8 w-8 text-red-500"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>),
    kick: (<svg viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg" fillRule="evenodd" clipRule="evenodd" strokeLinejoin="round" strokeMiterlimit="2" className="h-8 w-8 text-green-500"><path d="M37 .036h164.448v113.621h54.71v-56.82h54.731V.036h164.448v170.777h-54.73v56.82h-54.711v56.8h54.71v56.82h54.73V512.03H310.89v-56.82h-54.73v-56.8h-54.711v113.62H37V.036z" fill="currentColor"/></svg>),
  };
  const getTimeAgo = (date) => {
    const d = date instanceof Date ? date : new Date(date);
    if (Number.isNaN(d.getTime())) return '';
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    if (minutes < 1) return 'только что';
    if (minutes < 60) return `${minutes} мин назад`;
    if (hours < 24) return `${hours} ч назад`;
    return `${days} д назад`;
  };

  // Get streams from store with proper state checking
  const collapsedStreamIds = useStreamsStore(s => s.collapsedStreamIds) || [];
  const closedStreamIds = useStreamsStore(s => s.closedStreamIds) || [];
  
  // Активные = не закрытые (могут быть свёрнутыми, но всё ещё активные)
  const activeStreams = streams.filter(s => !closedStreamIds.includes(s.id));
  const closedStreams = streams.filter(s => closedStreamIds.includes(s.id));

  const filterStreams = (list) => {
    if (!searchQuery) return list;
    const q = searchQuery.toLowerCase();
    return list.filter(s => s.authorName.toLowerCase().includes(q) || s.platform.toLowerCase().includes(q));
  };


  const filteredActive = filterStreams(activeStreams);
  const filteredClosed = filterStreams(closedStreams);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <div className="sticky top-0 z-10 bg-white border-b border-gray-300">
        <div className="flex h-12 items-center justify-between px-3">
          <button onClick={onBack} className="inline-flex items-center justify-center gap-2 px-3 py-2 -ml-2 border border-gray-300 rounded-lg bg-white text-black text-base font-medium cursor-pointer transition-all hover:bg-gray-50 hover:border-gray-400 hover:-translate-y-0.5 hover:shadow-md active:translate-y-0 active:shadow-sm min-h-[44px]" aria-label="Назад">
            <ArrowLeft className="h-5 w-5" />
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto pb-32">
        {filteredActive.length > 0 && (
          <div className="p-4">
            <h2 className="text-sm text-gray-600 mb-3">{t('newui.activeStreams')}</h2>
            <div className="space-y-3">
              {filteredActive.map(stream => {
                const isCollapsed = collapsedStreamIds.includes(stream.id);
                return (
                  <div key={stream.id} className={`p-3 rounded-lg border-2 relative transition-all ${
                    isCollapsed 
                      ? 'bg-blue-50/50 border-blue-200 border-dashed opacity-75' 
                      : 'bg-blue-50 border-blue-200'
                  }`}>
                    <div className="flex items-start space-x-3">
                      <div className="flex-1 flex items-start space-x-3 cursor-pointer" onClick={() => onStreamSelect(stream.id)}>
                        <div className="flex-shrink-0 relative">
                          {platformIcons[stream.platform]}
                          {isCollapsed && (
                            <div className="absolute -top-1 -right-1 bg-blue-500 rounded-full p-0.5">
                              <Minimize2 className="h-3 w-3 text-white" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className={`text-black truncate ${isCollapsed ? 'text-gray-600' : ''}`}>{stream.authorName}</h3>
                            {isCollapsed && (
                              <span className="px-2 py-0.5 rounded-full text-xs bg-blue-200 text-blue-700 font-medium">
                                {t('newui.collapsed')}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center space-x-2 text-sm text-gray-600 mb-1">
                            <span className={`px-2 py-0.5 rounded-full text-xs ${stream.isOnline ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>{stream.isOnline ? 'онлайн' : 'оффлайн'}</span>
                            <span>•</span>
                            <span>{getTimeAgo(stream.lastViewed)}</span>
                          </div>
                          <div className="flex items-center space-x-3 text-xs text-gray-600">
                            <span>{stream.unreadMessages} сообщений</span>
                            <span>{stream.unreadQuestions} вопросов</span>
                          </div>
                        </div>
                      </div>
                      <button onClick={(e) => { e.stopPropagation(); onStreamClose?.(stream.id); }} className="inline-flex items-center justify-center gap-1 px-2 py-1 border border-gray-300 rounded-lg bg-white text-gray-600 hover:text-red-600 hover:border-red-300 flex-shrink-0 cursor-pointer transition-all hover:bg-red-50 hover:-translate-y-0.5 hover:shadow-md active:translate-y-0 active:shadow-sm min-h-[32px]" aria-label="Закрыть стрим">
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
        {filteredClosed.length > 0 && (
          <div className="p-4">
            <h2 className="text-sm text-gray-600 mb-3">{t('newui.recentClosed')}</h2>
            <div className="space-y-3">
              {filteredClosed.map(stream => (
                <div key={stream.id} className="p-3 rounded-lg bg-white border-2 border-gray-300 hover:border-black transition-all relative">
                  <div className="flex items-start space-x-3">
                    <div className="flex-1 flex items-start space-x-3 cursor-pointer" onClick={() => onStreamSelect(stream.id)}>
                      <div className="flex-shrink-0">{platformIcons[stream.platform]}</div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-black truncate mb-1">{stream.authorName}</h3>
                        <div className="flex items-center space-x-2 text-sm text-gray-600 mb-1">
                          <span className={`px-2 py-0.5 rounded-full text-xs ${stream.isOnline ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>{stream.isOnline ? 'онлайн' : 'оффлайн'}</span>
                          <span>•</span>
                          <span>{getTimeAgo(stream.lastViewed)}</span>
                        </div>
                        <div className="flex items-center space-x-3 text-xs text-gray-600">
                          <span>{stream.unreadMessages} сообщений</span>
                          <span>{stream.unreadQuestions} вопросов</span>
                        </div>
                      </div>
                    </div>
                    <button onClick={(e) => { e.stopPropagation(); onStreamDelete(stream.id); }} className="inline-flex items-center justify-center gap-1 px-2 py-1 border border-gray-300 rounded-lg bg-white text-gray-600 hover:text-black flex-shrink-0 cursor-pointer transition-all hover:bg-gray-50 hover:border-gray-400 hover:-translate-y-0.5 hover:shadow-md active:translate-y-0 active:shadow-sm min-h-[32px]" aria-label="Удалить стрим">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        {filteredActive.length === 0 && filteredClosed.length === 0 && (
          <div className="flex items-center justify-center py-12"><p className="text-gray-600">{searchQuery ? t('newui.streamsNotFound') : t('newui.noStreams')}</p></div>
        )}
      </div>
      <BottomSearchBar searchQuery={searchQuery} onSearchChange={setSearchQuery} onAddStream={onAddStream} searchPlaceholder={t('newui.searchStreamsPlaceholder')} />
    </div>
  );
}


