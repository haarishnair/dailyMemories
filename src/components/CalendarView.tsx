import { useState, useEffect } from 'react';
import { CloudinaryService } from '../services/cloudinary';
import type { DailyEntry } from '../db';
import { ChevronLeft, ChevronRight, Plus, Loader2 } from 'lucide-react';
import { startOfMonth, endOfMonth, eachDayOfInterval, format, isSameDay, addMonths, subMonths, isAfter } from 'date-fns';
import clsx from 'clsx';

interface CalendarViewProps {
    onDateSelect: (date: string) => void;
}

export default function CalendarView({ onDateSelect }: CalendarViewProps) {
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [viewMode, setViewMode] = useState<'month' | 'year'>('month');
    const [entries, setEntries] = useState<DailyEntry[] | null>(null);

    // Fetch entries
    useEffect(() => {
        CloudinaryService.fetchMemories()
            .then(data => {
                // Deduplicate for calendar as well
                const uniqueEntriesMap = new Map<string, DailyEntry>();
                data.forEach(entry => {
                    const existing = uniqueEntriesMap.get(entry.date);
                    if (!existing || entry.timestamp > existing.timestamp) {
                        uniqueEntriesMap.set(entry.date, entry);
                    }
                });
                setEntries(Array.from(uniqueEntriesMap.values()));
            })
            .catch(() => setEntries([]));
    }, []);

    const daysInMonth = eachDayOfInterval({
        start: startOfMonth(currentMonth),
        end: endOfMonth(currentMonth)
    });

    const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
    const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
    const nextYear = () => setCurrentMonth(addMonths(currentMonth, 12));
    const prevYear = () => setCurrentMonth(subMonths(currentMonth, 12));

    if (!entries) return <div className="h-full flex items-center justify-center"><Loader2 className="animate-spin text-purple-600" /></div>;

    const months = Array.from({ length: 12 }, (_, i) => {
        return new Date(currentMonth.getFullYear(), i, 1);
    });

    return (
        <div className="h-full flex flex-col bg-white">
            {/* Calendar Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
                <button
                    onClick={() => setViewMode(viewMode === 'month' ? 'year' : 'month')}
                    className="text-xl font-bold text-gray-800 hover:text-purple-600 transition-colors flex items-center gap-2"
                >
                    {viewMode === 'month' ? format(currentMonth, 'MMMM yyyy') : format(currentMonth, 'yyyy')}
                    <span className="text-xs font-normal text-gray-400 bg-gray-100 px-2 py-1 rounded-full">
                        {viewMode === 'month' ? 'Select Year' : 'Select Month'}
                    </span>
                </button>
                <div className="flex gap-2">
                    <button
                        onClick={viewMode === 'month' ? prevMonth : prevYear}
                        className="p-2 hover:bg-gray-100 rounded-full text-gray-600"
                    >
                        <ChevronLeft size={24} />
                    </button>
                    <button
                        onClick={viewMode === 'month' ? nextMonth : nextYear}
                        disabled={isAfter(viewMode === 'month' ? addMonths(currentMonth, 1) : addMonths(currentMonth, 12), new Date())}
                        className="p-2 hover:bg-gray-100 rounded-full text-gray-600 disabled:opacity-30"
                    >
                        <ChevronRight size={24} />
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4">
                {viewMode === 'year' ? (
                    <div className="grid grid-cols-3 gap-4">
                        {months.map(monthDate => {
                            const isFuture = isAfter(monthDate, new Date()) && monthDate.getMonth() !== new Date().getMonth();
                            // Check if month has entries
                            const hasEntries = entries.some(e => {
                                const d = new Date(e.date);
                                return d.getFullYear() === monthDate.getFullYear() && d.getMonth() === monthDate.getMonth();
                            });

                            return (
                                <button
                                    key={monthDate.toString()}
                                    disabled={isFuture}
                                    onClick={() => {
                                        setCurrentMonth(monthDate);
                                        setViewMode('month');
                                    }}
                                    className={clsx(
                                        "aspect-square rounded-2xl flex flex-col items-center justify-center p-2 transition-all",
                                        isFuture
                                            ? "opacity-30"
                                            : "hover:bg-purple-50 active:scale-95",
                                        hasEntries ? "bg-purple-50 border border-purple-100" : "bg-gray-50",
                                        monthDate.getMonth() === new Date().getMonth() && monthDate.getFullYear() === new Date().getFullYear() && "ring-2 ring-purple-500"
                                    )}
                                >
                                    <span className={clsx("text-sm font-bold", hasEntries ? "text-purple-700" : "text-gray-600")}>
                                        {format(monthDate, 'MMM')}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-7 gap-2 mb-2 text-center">
                            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(d => (
                                <div key={d} className="text-xs font-bold text-gray-400 py-2">{d}</div>
                            ))}
                        </div>
                        <div className="grid grid-cols-7 gap-2 auto-rows-fr">

                            {daysInMonth.map((day) => {
                                const dateStr = format(day, 'yyyy-MM-dd');
                                const entry = entries.find(e => e.date === dateStr);
                                const isToday = isSameDay(day, new Date());
                                const isFuture = isAfter(day, new Date());

                                return (
                                    <div
                                        key={dateStr}
                                        className={clsx(
                                            "aspect-[4/5] rounded-xl relative overflow-hidden group transition-all",
                                            !entry && !isFuture ? "bg-gray-50 border-2 border-dashed border-gray-200 hover:border-purple-300 cursor-pointer" : "",
                                            entry ? "shadow-sm" : ""
                                        )}
                                        onClick={() => {
                                            if (!entry && !isFuture) {
                                                onDateSelect(dateStr);
                                            }
                                        }}
                                    >
                                        {entry ? (
                                            <img
                                                src={entry.photoUrl || (entry.photoBlob ? URL.createObjectURL(entry.photoBlob) : '')}
                                                className="w-full h-full object-cover"
                                                loading="lazy"
                                            />
                                        ) : (
                                            !isFuture && (
                                                <div className="w-full h-full flex flex-col items-center justify-center text-gray-300">
                                                    <Plus size={20} />
                                                </div>
                                            )
                                        )}

                                        {/* Date Number Overlay */}
                                        <div className={clsx(
                                            "absolute top-1 left-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full z-10",
                                            isToday ? "bg-purple-600 text-white" : "bg-black/20 text-white backdrop-blur-sm"
                                        )}>
                                            {format(day, 'd')}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
            </div>
            );
}
