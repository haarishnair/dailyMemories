import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { Loader2, CalendarHeart } from 'lucide-react';

export default function TimelineView() {
    // Query all entries, sort by date descending
    const entries = useLiveQuery(
        () => db.dailyEntries.orderBy('date').reverse().toArray()
    );

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
                    <p className="text-gray-500 mt-1">Tap the + button to add your first memory!</p>
                </div>
            </div>
        );
    }

    // Helper to get image URL from Blob
    const getImageUrl = (blob: Blob) => URL.createObjectURL(blob);

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

    return (
        <div className="pb-20"> {/* Padding for bottom nav */}
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
                                        src={getImageUrl(entry.photoBlob)}
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
