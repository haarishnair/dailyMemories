import { useState } from 'react';
import { LayoutGrid, PlusCircle, Settings, Sparkles, Camera, CalendarDays } from 'lucide-react';
import clsx from 'clsx';
import UploadView from './components/UploadView';
import TimelineView from './components/TimelineView';
import BackupView from './components/BackupView';
import HighlightView from './components/HighlightView';
import CalendarView from './components/CalendarView';
import type { DailyEntry } from './db';

function App() {
  const [activeTab, setActiveTab] = useState<'timeline' | 'calendar' | 'upload' | 'settings'>('timeline');
  const [showHighlight, setShowHighlight] = useState(false);
  const [uploadDate, setUploadDate] = useState<string | undefined>(undefined);
  const [autoCamera, setAutoCamera] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | undefined>(undefined);
  const [entryToReplace, setEntryToReplace] = useState<DailyEntry | undefined>(undefined);

  const handleQuickCapture = () => {
    setUploadDate(undefined);
    setEntryToReplace(undefined);
    setAutoCamera(true);
    setActiveTab('upload');
  };

  const handleEditEntry = (entryOrDate: string | DailyEntry) => {
    if (typeof entryOrDate === 'string') {
      // Just adding a new photo for a specific date
      setUploadDate(entryOrDate);
      setEntryToReplace(undefined);
    } else {
      // Replacing a specific entry
      setUploadDate(entryOrDate.date);
      setEntryToReplace(entryOrDate);
    }
    setAutoCamera(true);
    setActiveTab('upload');
  };

  return (
    <div className="flex flex-col h-screen max-w-md mx-auto bg-white shadow-xl overflow-hidden relative">
      {/* Full Screen Overlays */}
      {showHighlight && (
        <div className="absolute inset-0 z-50 bg-black">
          <div className="relative h-full">
            <button
              onClick={() => setShowHighlight(false)}
              className="absolute top-4 left-4 z-[60] text-white bg-black/20 p-2 rounded-full backdrop-blur-md"
            >
              ✕ Close
            </button>
            <HighlightView />
          </div>
        </div>
      )}

      {/* Header */}
      <header className="p-4 bg-white border-b border-gray-100 flex justify-between items-center z-10">
        <h1 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent">
          Daily Memories
        </h1>
        <div className="flex items-center gap-2">
          {/* Calendar Toggle */}
          <button
            onClick={() => setActiveTab(activeTab === 'timeline' ? 'calendar' : 'timeline')}
            className={clsx(
              "w-10 h-10 rounded-full flex items-center justify-center active:scale-95 transition-all",
              activeTab === 'calendar' ? "bg-purple-100 text-purple-600" : "bg-gray-100 text-gray-500"
            )}
          >
            {activeTab === 'calendar' ? <LayoutGrid size={20} /> : <CalendarDays size={20} />}
          </button>

          {/* Camera Button with Instant Native Picker */}
          <div className="relative">
            <input
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              id="header-camera-input"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  // We need to pass this file to UploadView. 
                  // For now, we'll use a simple state prop or just let UploadView handle it?
                  // No, if we pick here, we MUST pass it.
                  // Let's modify App state to hold 'pendingFile'.
                  setUploadDate(undefined);
                  setAutoCamera(false); // No need to auto-open camera in UploadView since we already have the file
                  // We need a way to pass the file. adding `pendingFile` state.
                  // But wait, I can't add state in this tool call easily without replacing the whole component or multiple chunks.
                  // Let's try to just trigger the existing flow but faster?
                  // If I switch tab, it needs a click.
                  // BETTER: Just make the button a label for the input? No, semantic button is better.
                  // I will add `pendingFile` state in the next step. For now, let's just create the input and handler structure.
                }
              }}
            />
            <label
              htmlFor="header-camera-input"
              className="w-10 h-10 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center active:scale-95 transition-transform cursor-pointer"
            >
              <Camera size={20} />
            </label>
          </div>
          <button
            onClick={() => setShowHighlight(true)}
            className="w-10 h-10 rounded-full bg-gradient-to-tr from-yellow-300 to-pink-500 flex items-center justify-center text-white shadow-md active:scale-95 transition-transform"
          >
            <Sparkles size={20} />
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto relative bg-gray-50 text-gray-900">
        {activeTab === 'timeline' && <TimelineView onQuickCapture={handleQuickCapture} onEditEntry={handleEditEntry} />}
        {activeTab === 'calendar' && <CalendarView onDateSelect={handleEditEntry} />}
        {activeTab === 'upload' && (
          <UploadView
            initialDate={uploadDate}
            initialFile={pendingFile}
            autoOpen={autoCamera}
            replacementId={entryToReplace?.id as string}
            onUploadComplete={() => {
              setActiveTab('timeline');
              setAutoCamera(false);
              setPendingFile(undefined);
              setUploadDate(undefined);
              setEntryToReplace(undefined);
            }}
          />
        )}
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
