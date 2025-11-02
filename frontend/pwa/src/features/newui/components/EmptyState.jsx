import { MessageSquare, Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export function EmptyState({ onAddStream }) {
  const { t } = useTranslation();
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 bg-gray-50">
      <div className="text-center max-w-md">
        <div className="mb-6 flex justify-center">
          <div className="p-6 rounded-full bg-gray-100">
            <MessageSquare className="h-16 w-16 text-black" />
          </div>
        </div>
        <h1 className="mb-4 text-black">{t('newui.appTitle')}</h1>
        <h2 className="mb-3 text-black">{t('newui.noActiveStreams')}</h2>
        <p className="mb-8 text-gray-600">{t('newui.appSubtitle')}</p>
        <button onClick={onAddStream} className="ripple inline-flex items-center space-x-2 px-8 py-4 rounded-lg bg-black hover:bg-gray-800 text-white elevation-3 transition-all hover:elevation-4">
          <Plus className="h-5 w-5" />
          <span>{t('newui.addStream')}</span>
        </button>
        <div className="mt-12 pt-8 border-t border-gray-300">
          <p className="text-sm text-gray-600">{t('newui.supportedPlatforms')}</p>
          <div className="flex items-center justify-center space-x-6 mt-4">
            <div className="flex flex-col items-center space-y-2">
              <svg viewBox="0 0 24 24" fill="currentColor" className="h-8 w-8 text-purple-500"><path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714Z"/></svg>
              <span className="text-xs text-gray-600">Twitch</span>
            </div>
            <div className="flex flex-col items-center space-y-2">
              <svg viewBox="0 0 24 24" fill="currentColor" className="h-8 w-8 text-red-500"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
              <span className="text-xs text-gray-600">YouTube</span>
            </div>
            <div className="flex flex-col items-center space-y-2">
              <svg viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg" fillRule="evenodd" clipRule="evenodd" strokeLinejoin="round" strokeMiterlimit="2" className="h-8 w-8 text-green-500"><path d="M37 .036h164.448v113.621h54.71v-56.82h54.731V.036h164.448v170.777h-54.73v56.82h-54.711v56.8h54.71v56.82h54.73V512.03H310.89v-56.82h-54.73v-56.8h-54.711v113.62H37V.036z" fill="currentColor"/></svg>
              <span className="text-xs text-gray-600">Kick</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


