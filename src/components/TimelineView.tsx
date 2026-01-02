import { useEffect, useState } from 'react';
import type { DailyEntry } from '../db';
import { CloudinaryService } from '../services/cloudinary';
import { Loader2, CalendarHeart } from 'lucide-react';

interface TimelineViewProps {
    onQuickCapture?: () => void;
}

export default function TimelineView({ onQuickCapture }: TimelineViewProps) {
    const [entries, setEntries] = useState<DailyEntry[] | null>(null);

    // Fetch from Cloudinary on mount
    useEffect(() => {
        CloudinaryService.fetchMemories()
            .then(data => {
                // Sort by date descending
                const sorted = data.sort((a, b) => b.date.localeCompare(a.date));
                setEntries(sorted);
            })
            .catch(() => setEntries([]));
    }, []);

    if (!entries) {
        return (
            <div className="flex h-full items-center justify-center text-purple-600">
                <Loader2 className="animate-spin" size={32} />
            </div>
        );
    }

    if (entries.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center p-8 space-y-4">
                <div className="p-4 bg-purple-50 rounded-full text-purple-300">
                    <CalendarHeart size={48} />
                </div>
                <div>
                    <h3 className="text-lg font-semibold text-gray-800">No Memories Yet</h3>
                    <p className="text-gray-500 mt-1">Check Cloudinary config or add a memory!</p>
                </div>
            </div>
        );
    }

    // Helper to get image URL
    const getImageUrl = (entry: DailyEntry) => entry.photoUrl || (entry.photoBlob ? URL.createObjectURL(entry.photoBlob) : '');

    // Group entries by Month Year (e.g., "December 2023")
    const groupedEntries: Record<string, typeof entries> = {};
    entries.forEach(entry => {
        const dateObj = new Date(entry.date);
        const monthYear = dateObj.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
        if (!groupedEntries[monthYear]) {
            groupedEntries[monthYear] = [];
        }
        groupedEntries[monthYear].push(entry);
    });

    // Check if today has an entry
    const todayStr = new Date().toISOString().split('T')[0];
    const hasTodayEntry = entries.some(e => e.date === todayStr);

    return (
        <div className="pb-20"> {/* Padding for bottom nav */}
            {/* Quick Capture Card */}
            {!hasTodayEntry && (
                <div className="p-4 pb-0">
                    <div className="bg-gradient-to-r from-purple-500 to-pink-600 rounded-2xl p-4 text-white shadow-lg flex items-center justify-between">
                        <div>
                            <h3 className="font-bold text-lg">Capture Today</h3>
                            <p className="text-purple-100 text-sm">No memory for {new Date().toLocaleDateString(undefined, { weekday: 'long' })} yet</p>
                        </div>
                        <button
                            onClick={() => onQuickCapture?.()}
                            className="bg-white text-purple-600 px-4 py-2 rounded-xl font-bold text-sm shadow-sm active:scale-95 transition-transform"
                        >
                            Add Now
                        </button>
                    </div>
                </div>
            )}

            {Object.entries(groupedEntries).map(([month, monthEntries]) => (
                <div key={month} className="mb-8">
                    <div className="sticky top-0 bg-gray-50/95 backdrop-blur-sm z-10 px-6 py-3 border-b border-gray-100">
                        <h2 className="font-bold text-gray-800">{month}</h2>
                    </div>

                    <div className="px-4 py-4 grid grid-cols-2 gap-3">
                        {monthEntries.map(entry => (
                            <div key={entry.id} className="bg-white rounded-2xl p-2 shadow-sm border border-gray-100 flex flex-col gap-2">
                                <div className="aspect-square rounded-xl overflow-hidden bg-gray-100">
                                    <img
                                        src={getImageUrl(entry)}
                                        alt={entry.caption || "Memory"}
                                        loading="lazy"
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                                <div className="px-1 pb-1">
                                    <div className="text-xs font-bold text-gray-400 mb-0.5">
                                        {new Date(entry.date).getDate()}{/* Day number */}
                                    </div>
                                    {entry.caption && (
                                        <p className="text-xs text-gray-700 line-clamp-2 leading-relaxed">
                                            {entry.caption}
                                        </p>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
}
