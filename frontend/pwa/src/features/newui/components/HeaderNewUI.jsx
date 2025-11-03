import { memo } from 'react';
import { User, Settings, Shield } from 'lucide-react';

function HeaderNewUIBase({ onLogoClick, onPersonalizationClick, onSettingsClick, onAdminClick }) {
  return (
    <header className="sticky z-50 w-full border-b border-gray-300 bg-white/95 backdrop-blur safe-area-header" style={{ top: 'env(safe-area-inset-top, 0px)' }}>
      <div className="flex h-12 items-center justify-between px-3">
        <button onClick={onLogoClick} className="flex items-center space-x-2 ripple rounded-lg px-2 py-1 hover:bg-gray-100 transition-colors text-black">
          <h1 className="text-lg font-medium">MellChat</h1>
        </button>
               <div className="flex items-center space-x-1">
                 <button onClick={onPersonalizationClick} className="ripple p-2 rounded-full hover:bg-gray-100 transition-colors text-black" aria-label="Personalization">
                   <User className="h-5 w-5" />
                 </button>
                 <button onClick={onSettingsClick} className="ripple p-2 rounded-full hover:bg-gray-100 transition-colors text-black" aria-label="Settings">
                   <Settings className="h-5 w-5" />
                 </button>
                 <button onClick={onAdminClick} className="ripple p-2 rounded-full hover:bg-gray-100 transition-colors text-black" aria-label="Admin Panel">
                   <Shield className="h-5 w-5" />
                 </button>
               </div>
      </div>
    </header>
  );
}

export const HeaderNewUI = memo(HeaderNewUIBase);


