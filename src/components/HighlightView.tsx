import { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type DailyEntry } from '../db';
import { Play, Sparkles, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function HighlightView() {
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentIndex, setCurrentIndex] = useState(0);

    // Get all entries
    const entries = useLiveQuery(
        () => db.dailyEntries.orderBy('date').toArray()
    );

    const [yearReview, setYearReview] = useState<DailyEntry[]>([]);

    // Filter for random selection/top entries when entries load
    // For MVP, just random 10 pictures
    useEffect(() => {
        if (entries && entries.length > 0 && !isPlaying) {
            const shuffled = [...entries].sort(() => 0.5 - Math.random());
            setYearReview(shuffled.slice(0, 10));
        }
    }, [entries, isPlaying]);

    useEffect(() => {
        let interval: any;
        if (isPlaying) {
            interval = setInterval(() => {
                if (currentIndex < yearReview.length - 1) {
                    setCurrentIndex(prev => prev + 1);
                } else {
                    setIsPlaying(false); // End of show
                    setCurrentIndex(0);
                }
            }, 3000); // 3 seconds per slide
        }
        return () => clearInterval(interval);
    }, [isPlaying, currentIndex, yearReview]);

    if (!entries) {
        return <div className="p-8 text-center text-gray-500">Loading memories...</div>;
    }

    if (entries.length < 3) {
        return (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center space-y-4">
                <Sparkles className="text-gray-300" size={48} />
                <h3 className="text-lg font-semibold text-gray-700">Not Enough Memories Yet</h3>
                <p className="text-gray-500">Add at least 3 daily entries to unlock your Yearly Highlight!</p>
            </div>
        );
    }

    const startShow = () => {
        setCurrentIndex(0);
        setIsPlaying(true);
    };

    if (isPlaying && yearReview.length > 0) {
        const currentEntry = yearReview[currentIndex];
        return (
            <div className="fixed inset-0 z-50 bg-black flex flex-col">
                {/* Progress Bars */}
                <div className="flex gap-1 p-2 pt-safe top-0 absolute w-full z-20">
                    {yearReview.map((_, idx) => (
                        <div key={idx} className="h-1 flex-1 bg-white/30 rounded-full overflow-hidden">
                            <motion.div
                                className="h-full bg-white"
                                initial={{ width: "0%" }}
                                animate={{ width: idx < currentIndex ? "100%" : idx === currentIndex ? "100%" : "0%" }}
                                transition={{ duration: idx === currentIndex ? 3 : 0, ease: "linear" }}
                            />
                        </div>
                    ))}
                </div>

                {/* Close Button */}
                <button
                    onClick={() => setIsPlaying(false)}
                    className="absolute top-6 right-4 z-20 text-white/80 p-2"
                >
                    <X size={24} />
                </button>

                {/* Image Display */}
                <AnimatePresence mode='wait'>
                    <motion.div
                        key={currentEntry.id}
                        initial={{ opacity: 0, scale: 1.05 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.5 }}
                        className="flex-1 relative flex items-center justify-center"
                    >
                        <div className="absolute inset-0 bg-black/50 backdrop-blur-3xl z-0">
                            <img src={currentEntry.photoUrl || (currentEntry.photoBlob ? URL.createObjectURL(currentEntry.photoBlob) : '')} className="w-full h-full object-cover opacity-50" />
                        </div>

                        <img
                            src={currentEntry.photoUrl || (currentEntry.photoBlob ? URL.createObjectURL(currentEntry.photoBlob) : '')}
                            className="w-full max-h-screen object-contain z-10 relative shadow-2xl"
                        />

                        {/* Date & Caption Overlay */}
                        <div className="absolute bottom-10 left-0 right-0 p-6 z-20 text-white text-center pb-safe">
                            <h3 className="text-2xl font-bold mb-2 drop-shadow-md">
                                {new Date(currentEntry.date).toLocaleDateString(undefined, { day: 'numeric', month: 'long' })}
                            </h3>
                            {currentEntry.caption && (
                                <p className="text-lg opacity-90 font-medium drop-shadow-md bg-black/30 inline-block px-4 py-2 rounded-xl backdrop-blur-sm">
                                    {currentEntry.caption}
                                </p>
                            )}
                        </div>
                    </motion.div>
                </AnimatePresence>

                {/* Navigation Taps - invisible overlays */}
                <div className="absolute inset-0 z-10 flex">
                    <div className="w-1/3 h-full" onClick={() => setCurrentIndex(c => Math.max(0, c - 1))} />
                    <div className="w-1/3 h-full" onClick={() => setIsPlaying(false)} /> {/* Center tap stops? Or maybe pause? for now just let it run or tap sides */}
                    <div className="w-1/3 h-full" onClick={() => setCurrentIndex(c => Math.min(yearReview.length - 1, c + 1))} />
                </div>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col items-center justify-center p-6 bg-gradient-to-br from-purple-500 to-pink-600 text-white relative overflow-hidden">
            {/* Background Decor */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-black/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>

            <div className="relative z-10 text-center space-y-8 max-w-sm">
                <div className="inline-flex p-4 bg-white/20 backdrop-blur-md rounded-full mb-4 shadow-xl border border-white/30">
                    <Sparkles size={48} className="text-yellow-300" />
                </div>

                <div>
                    <h2 className="text-4xl font-bold mb-2">Yearly Highlight</h2>
                    <p className="text-purple-100 text-lg">Relive your best moments from this year in a cinematic experience.</p>
                </div>

                <button
                    onClick={startShow}
                    className="w-full py-4 bg-white text-purple-600 rounded-2xl font-bold text-lg shadow-xl hover:bg-gray-50 active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                    <Play fill="currentColor" size={24} />
                    Play Highlights
                </button>

                <p className="text-sm text-white/60">
                    Selected randomly from your {entries.length} memories.
                </p>
            </div>
        </div>
    );
}
