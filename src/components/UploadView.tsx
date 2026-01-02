import React, { useState, useRef, useEffect } from 'react';

import { Upload, X, Loader2, Camera, Calendar } from 'lucide-react';

import { CloudinaryService } from '../services/cloudinary';
import clsx from 'clsx';

interface UploadViewProps {
    onUploadComplete: () => void;
    initialDate?: string;
    autoOpen?: boolean;
}

export default function UploadView({ onUploadComplete, initialDate, autoOpen }: UploadViewProps) {
    const [isUploading, setIsUploading] = useState(false);
    const [preview, setPreview] = useState<string | null>(null);
    const [file, setFile] = useState<File | null>(null);
    const [date, setDate] = useState(initialDate || new Date().toISOString().split('T')[0]);
    const [caption, setCaption] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Auto-open camera if requested
    useEffect(() => {
        if (autoOpen && fileInputRef.current && !file) {
            fileInputRef.current.click();
        }
    }, [autoOpen, file]);

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const selectedFile = e.target.files[0];
            setFile(selectedFile);
            setPreview(URL.createObjectURL(selectedFile));
        }
    };

    const handleSave = async () => {
        if (!file) return;

        setIsUploading(true);
        try {
            // Upload to Cloudinary
            await CloudinaryService.uploadImage(file, date, caption);

            onUploadComplete();
        } catch (error) {
            console.error("Error saving entry:", error);
            alert("Failed to save memory. Check console/network.");
        } finally {
            setIsUploading(false);
        }
    };

    const reset = () => {
        setFile(null);
        setPreview(null);
        setCaption('');
    };

    if (!preview) {
        return (
            <div className="flex flex-col items-center justify-center h-full p-6 text-center">
                <div
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full max-w-sm aspect-[4/5] bg-gray-100 rounded-3xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 active:scale-95 transition-all group"
                >
                    <div className="p-4 bg-white rounded-full shadow-sm mb-4 group-hover:shadow-md transition-shadow">
                        <Camera className="text-purple-600" size={32} />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-700">Add Today's Memory</h3>
                    <p className="text-sm text-gray-500 mt-1 px-8">Tap to take a photo or choose from gallery</p>
                </div>
                <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                />
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-white relative">
            {/* Top Bar */}
            <div className="flex justify-between items-center p-4 border-b border-gray-100">
                <button onClick={reset} className="p-2 -ml-2 text-gray-500">
                    <X size={24} />
                </button>
                <span className="font-semibold">New Entry</span>
                <div className="w-8" /> {/* Spacer */}
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-6">
                {/* Image Preview */}
                <div className="aspect-[4/5] rounded-2xl overflow-hidden shadow-sm bg-gray-100 relative">
                    <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                </div>

                {/* Date Picker */}
                <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                        <Calendar size={16} /> Date
                    </label>
                    <input
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="w-full p-3 bg-gray-50 rounded-xl outline-none focus:ring-2 focus:ring-purple-100 transition-all font-medium"
                    />
                </div>

                {/* Caption */}
                <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Caption (Optional)</label>
                    <textarea
                        value={caption}
                        onChange={(e) => setCaption(e.target.value)}
                        placeholder="What happened today?"
                        className="w-full p-3 bg-gray-50 rounded-xl outline-none focus:ring-2 focus:ring-purple-100 transition-all min-h-[100px] resize-none"
                    />
                </div>
            </div>

            {/* Save Button */}
            <div className="p-4 border-t border-gray-100">
                <button
                    onClick={handleSave}
                    disabled={isUploading}
                    className={clsx(
                        "w-full py-4 rounded-xl font-semibold flex items-center justify-center gap-2 text-white shadow-lg transition-all",
                        isUploading ? "bg-purple-400 cursor-not-allowed" : "bg-purple-600 hover:bg-purple-700 active:scale-95 shadow-purple-200"
                    )}
                >
                    {isUploading ? <Loader2 className="animate-spin" /> : <Upload size={20} />}
                    {isUploading ? "Saving Memory..." : "Save Memory"}
                </button>
            </div>
        </div>
    );
}
