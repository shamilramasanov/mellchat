import { memo } from 'react';

function MessageCardBase({ message, showPlatformBadge = false, streamInfo = null }) {
  const platformIcons = {
    twitch: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4 text-purple-500">
        <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714Z"/>
      </svg>
    ),
    youtube: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4 text-red-500">
        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
      </svg>
    ),
    kick: (
      <svg viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg" fillRule="evenodd" clipRule="evenodd" strokeLinejoin="round" strokeMiterlimit="2" className="h-4 w-4 text-green-500">
        <path d="M37 .036h164.448v113.621h54.71v-56.82h54.731V.036h164.448v170.777h-54.73v56.82h-54.711v56.8h54.71v56.82h54.73V512.03H310.89v-56.82h-54.73v-56.8h-54.711v113.62H37V.036z" fill="currentColor"/>
      </svg>
    ),
  };

  const toDate = (value) => {
    if (value instanceof Date) return value;
    if (typeof value === 'number') return new Date(value);
    if (typeof value === 'string') {
      const n = Number(value);
      return new Date(Number.isFinite(n) ? n : value);
    }
    return new Date();
  };

  const formatTimestamp = (input) => {
    const date = toDate(input);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className={`p-3 mb-2 rounded-lg border-2 elevation-1 ${
      message.isQuestion ? 'bg-blue-50 border-blue-300 border-l-4 border-l-blue-500' : 'bg-white border-gray-300'
    }`}>
      <div className="flex items-start justify-between mb-1">
        <div className="flex items-center space-x-2 flex-wrap gap-1">
          {showPlatformBadge && streamInfo && (
            <span className={`px-2 py-0.5 rounded text-xs font-medium ${
              streamInfo.platform === 'twitch' ? 'bg-purple-100 text-purple-700' :
              streamInfo.platform === 'youtube' ? 'bg-red-100 text-red-700' :
              streamInfo.platform === 'kick' ? 'bg-lime-100 text-lime-700' :
              'bg-gray-100 text-gray-700'
            }`}>
              {streamInfo.platform.toUpperCase()}
            </span>
          )}
          {!showPlatformBadge && platformIcons[message.platform]}
          <span className="font-semibold text-black">{message.username}</span>
          {/* Всегда показываем название автора/канала справа от имени */}
          {streamInfo && streamInfo.channelName ? (
            <span className="px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-700 border border-blue-200">
              {streamInfo.channelName}
            </span>
          ) : streamInfo ? (
            <span className="px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700">
              {streamInfo.platform || 'unknown'}
            </span>
          ) : null}
        </div>
        <span className="text-xs text-gray-600">{formatTimestamp(message.timestamp)}</span>
      </div>
      <p className="text-gray-700 pl-6">{message.text}</p>
    </div>
  );
}

export const MessageCard = memo(MessageCardBase);


