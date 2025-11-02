import { useMemo, useState } from 'react';
import { X } from 'lucide-react';
import { isValidStreamUrl } from '../utils/platformHelpers.js';

export function AddStreamModal({ isOpen, onClose, onConnect }) {
  const [url, setUrl] = useState('');
  const isValid = useMemo(() => isValidStreamUrl(url), [url]);
  if (!isOpen) return null;

  const handleConnect = () => {
    if (url.trim() && isValid) {
      onConnect(url.trim());
      setUrl('');
      onClose();
    }
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={handleBackdropClick}>
      <div className="w-full max-w-md bg-white rounded-lg elevation-4 overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-gray-300">
          <h2 className="text-black">Add Stream</h2>
          <button onClick={onClose} className="ripple p-2 rounded-full hover:bg-gray-100 transition-colors text-black" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="p-6">
          <label htmlFor="stream-url" className="block mb-2 text-sm text-gray-600">Stream URL</label>
          <input
            id="stream-url"
            type="text"
            placeholder="https://twitch.tv/username"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleConnect();
              if (e.key === 'Escape') onClose();
            }}
            className="w-full px-4 py-3 rounded-lg bg-white border-2 border-gray-300 focus:border-black focus:outline-none focus:ring-2 focus:ring-black/20 transition-all text-black"
            autoFocus
          />
          <p className={`mt-2 text-xs ${isValid || !url ? 'text-gray-600' : 'text-red-600'}`}>
            {isValid || !url ? 'Supports Twitch, YouTube, and Kick streams' : 'Invalid stream URL'}
          </p>
        </div>
        <div className="flex items-center justify-end space-x-3 p-4 border-t border-gray-300">
          <button onClick={onClose} className="ripple px-6 py-2 rounded-lg text-black hover:bg-gray-100 transition-colors border-2 border-gray-300">Cancel</button>
          <button onClick={handleConnect} disabled={!isValid} className={`ripple px-6 py-2 rounded-lg elevation-2 transition-all ${isValid ? 'bg-black hover:bg-gray-800 text-white' : 'bg-gray-300 text-gray-600 cursor-not-allowed'}`}>Connect</button>
        </div>
      </div>
    </div>
  );
}


