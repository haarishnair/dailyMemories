import { useEffect, useState } from 'react';
import type { DailyEntry } from '../db';
import { CloudinaryService } from '../services/cloudinary';
import { Loader2, CalendarHeart, ArrowUpDown } from 'lucide-react';

interface TimelineViewProps {
    onQuickCapture?: () => void;
}

export default function TimelineView({ onQuickCapture }: TimelineViewProps) {
    const [entries, setEntries] = useState<DailyEntry[] | null>(null);
    const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

    // Fetch from Cloudinary on mount
    useEffect(() => {
        CloudinaryService.fetchMemories()
            .then(data => {
                setEntries(data);
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

    // Sort entries based on state
    const sortedEntries = entries?.sort((a, b) => {
        return sortOrder === 'desc'
            ? b.date.localeCompare(a.date)
            : a.date.localeCompare(b.date);
    }) || [];

    // Group entries by Month Year (preserving sort order)
    const groupedEntries: Record<string, DailyEntry[]> = {};
    const monthOrder: string[] = [];

    sortedEntries.forEach(entry => {
        const dateObj = new Date(entry.date);
        const monthYear = dateObj.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
        if (!groupedEntries[monthYear]) {
            groupedEntries[monthYear] = [];
            monthOrder.push(monthYear);
        }
        groupedEntries[monthYear].push(entry);
    });

    // Check if today has an entry
    const todayStr = new Date().toISOString().split('T')[0];
    const hasTodayEntry = entries?.some(e => e.date === todayStr);

    return (
        <div className="pb-20 h-full flex flex-col">
            {/* Header with Sort */}
            <div className="px-6 py-4 bg-white/80 backdrop-blur-md sticky top-0 z-20 border-b border-gray-100 flex items-center justify-between">
                <h2 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                    Your Memories
                </h2>
                <button
                    onClick={() => setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')}
                    className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-full text-xs font-semibold text-gray-600 hover:bg-gray-200 active:scale-95 transition-all"
                >
                    <ArrowUpDown size={14} />
                    {sortOrder === 'desc' ? 'Newest First' : 'Oldest First'}
                </button>
            </div>

            <div className="flex-1 overflow-y-auto">
                {/* Quick Capture Card (Only show if newest first and no entry today) */}
                {!hasTodayEntry && sortOrder === 'desc' && (
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

                {monthOrder.map((month) => (
                    <div key={month} className="mb-0">
                        <div className="sticky top-0 bg-gray-50/95 backdrop-blur-sm z-10 px-6 py-3 border-b border-gray-100 shadow-sm mt-0">
                            <h2 className="font-bold text-gray-800 text-sm uppercase tracking-wide opacity-80">{month}</h2>
                        </div>

                        <div className="px-4 py-4 grid grid-cols-2 gap-3">
                            {groupedEntries[month].map(entry => (
                                <div key={entry.id} className="bg-white rounded-2xl p-2 shadow-sm border border-gray-100 flex flex-col gap-2 group">
                                    <div className="aspect-square rounded-xl overflow-hidden bg-gray-100 relative">
                                        <img
                                            src={getImageUrl(entry)}
                                            alt={entry.caption || "Memory"}
                                            loading="lazy"
                                            className="w-full h-full object-cover transition-transform group-hover:scale-105"
                                        />
                                        <div className="absolute top-2 right-2 bg-black/40 backdrop-blur-md text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                                            {new Date(entry.date).getDate()}
                                        </div>
                                    </div>
                                    {entry.caption && (
                                        <div className="px-1 pb-1">
                                            <p className="text-xs text-gray-700 line-clamp-2 leading-relaxed">
                                                {entry.caption}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                ))}

                {/* Bottom Spacer for Nav */}
                <div className="h-20" />
            </div>
        </div>
    );
}
