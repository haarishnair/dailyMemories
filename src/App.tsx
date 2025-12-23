import { useState } from 'react';
import { LayoutGrid, PlusCircle, Settings, Sparkles } from 'lucide-react';
import clsx from 'clsx';
// components will be imported here later
import UploadView from './components/UploadView';
import TimelineView from './components/TimelineView';
import BackupView from './components/BackupView';
import HighlightView from './components/HighlightView';

function App() {
  const [activeTab, setActiveTab] = useState<'timeline' | 'upload' | 'settings'>('timeline');
  const [showHighlight, setShowHighlight] = useState(false);

  return (
    <div className="flex flex-col h-screen max-w-md mx-auto bg-white shadow-xl overflow-hidden relative">
      {/* Full Screen Overlays */}
      {showHighlight && (
        <div className="absolute inset-0 z-50 bg-black">
          <div className="relative h-full">
            <button
              onClick={() => setShowHighlight(false)}
              className="absolute top-4 right-4 z-[60] text-white p-2"
            >
              {/* Close button handled inside component for now, or here. 
                 HighlightView has its own close but we controlled it with isPlaying.
                 Let's wrap HighlightView to handle close.
              */}
            </button>
            <HighlightView />
            {/* Hack: The HighlightView has a close button that we need to wire up to setShowHighlight(false) 
                 but currently HighlightView manages its own "isPlaying" state.
                 Refactoring HighlightView to accept onClosing prop would be cleaner, 
                 but for now let's just mount it. 
                 Actually HighlightView returns a full screen div only when playing?
                 Let's check HighlightView.tsx content.
                 It renders "Play Highlights" screen initially.
                 So we can just show it.
              */}
            <button
              onClick={() => setShowHighlight(false)}
              className="absolute top-4 left-4 z-[60] text-white bg-black/20 p-2 rounded-full backdrop-blur-md"
            >
              ✕ Close
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="p-4 bg-white border-b border-gray-100 flex justify-between items-center z-10">
        <h1 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent">
          Daily Memories
        </h1>
        <button
          onClick={() => setShowHighlight(true)}
          className="w-10 h-10 rounded-full bg-gradient-to-tr from-yellow-300 to-pink-500 flex items-center justify-center text-white shadow-md active:scale-95 transition-transform"
        >
          <Sparkles size={20} />
        </button>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto relative bg-gray-50 text-gray-900">
        {activeTab === 'timeline' && <TimelineView />}
        {activeTab === 'upload' && <UploadView onUploadComplete={() => setActiveTab('timeline')} />}
        {activeTab === 'settings' && <BackupView />}
      </main>

      {/* Bottom Navigation */}
      <nav className="bg-white border-t border-gray-100 px-6 py-3 flex justify-between items-center z-20 pb-safe">
        <button
          onClick={() => setActiveTab('timeline')}
          className={clsx("flex flex-col items-center gap-1 transition-colors", activeTab === 'timeline' ? "text-purple-600" : "text-gray-400")}
        >
          <LayoutGrid size={24} />
          <span className="text-[10px] font-medium">Memories</span>
        </button>

        <button
          onClick={() => setActiveTab('upload')}
          className="flex flex-col items-center justify-center -mt-8 bg-purple-600 text-white rounded-full w-14 h-14 shadow-lg shadow-purple-200 active:scale-95 transition-transform"
        >
          <PlusCircle size={28} />
        </button>

        <button
          onClick={() => setActiveTab('settings')}
          className={clsx("flex flex-col items-center gap-1 transition-colors", activeTab === 'settings' ? "text-purple-600" : "text-gray-400")}
        >
          <Settings size={24} />
          <span className="text-[10px] font-medium">Settings</span>
        </button>
      </nav>
    </div>
  );
}

export default App;
